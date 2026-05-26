const mongoose = require('mongoose');
const {
  calculateCompatibility,
  calculateForecast,
  calculateNameCorrectionScore,
  calculateProfile,
  getNameCorrectionSuggestions
} = require('../engine/numerologyEngine');
const { analyzeLoShuGrid } = require('../engine/loshuGrid');
const { isIsoDate, missingFields } = require('../utils/validators');

async function saveCalculation(user, calculation, updates = {}) {
  await user.constructor.updateOne(
    { _id: user._id },
    {
      ...(Object.keys(updates).length ? { $set: updates } : {}),
      $push: {
        lastCalculations: {
          $each: [calculation],
          $position: 0,
          $slice: 10
        }
      }
    },
    { runValidators: true }
  );
}

async function ensureHistoryIds(user) {
  let changed = false;

  user.lastCalculations.forEach((calculation) => {
    if (!calculation._id) {
      calculation._id = new mongoose.Types.ObjectId();
      changed = true;
    }
  });

  if (changed) {
    user.markModified('lastCalculations');
    await user.save();
  }
}

function toHistoryItems(user) {
  return [...(user.lastCalculations || [])]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((item) => {
      const value = item.toObject ? item.toObject() : item;
      return {
        _id: value._id,
        id: value._id,
        type: value.type,
        input: value.input,
        result: value.result,
        createdAt: value.createdAt
      };
    });
}

function getStoredDateOfBirth(user) {
  return user.dateOfBirth || user.profile?.source?.dateOfBirth || null;
}

function ddmmyyyyToIso(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(value || '').trim());

  if (!match) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function isoToDdmmyyyy(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());

  if (!match) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

async function createProfile(req, res, next) {
  try {
    const missing = missingFields(req.body, ['fullName']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const fullName = String(req.body.fullName).trim();
    const dateOfBirth = req.body.dateOfBirth || getStoredDateOfBirth(req.user);

    if (fullName.length < 2) {
      return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    }

    if (!isIsoDate(dateOfBirth)) {
      return res.status(400).json({ message: 'Date of birth must be YYYY-MM-DD or saved in your profile' });
    }

    const profile = calculateProfile({ fullName, dateOfBirth });

    await saveCalculation(
      req.user,
      { type: 'profile', input: { fullName, dateOfBirth }, result: profile },
      {
        dateOfBirth: req.user.dateOfBirth || dateOfBirth,
        profile
      }
    );

    res.json({ profile });
  } catch (error) {
    next(error);
  }
}

async function forecast(req, res, next) {
  try {
    const dateOfBirth = req.body.dateOfBirth || getStoredDateOfBirth(req.user);

    if (!dateOfBirth || !isIsoDate(dateOfBirth)) {
      return res.status(400).json({ message: 'A valid dateOfBirth is required or must exist in your profile' });
    }

    if (req.body.forecastDate && !isIsoDate(req.body.forecastDate)) {
      return res.status(400).json({ message: 'forecastDate must be YYYY-MM-DD' });
    }

    const result = calculateForecast({
      dateOfBirth,
      forecastDate: req.body.forecastDate
    });

    await saveCalculation(
      req.user,
      { type: 'forecast', input: { ...req.body, dateOfBirth }, result },
      {
        dateOfBirth: req.user.dateOfBirth || dateOfBirth
      }
    );

    res.json({ forecast: result });
  } catch (error) {
    next(error);
  }
}

async function compatibility(req, res, next) {
  try {
    const missing = missingFields(req.body, ['first', 'second']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const first = String(req.body.first).trim();
    const second = String(req.body.second).trim();

    if (!first || !second) {
      return res.status(400).json({ message: 'Both values are required' });
    }

    const result = calculateCompatibility({ first, second });

    await saveCalculation(req.user, { type: 'compatibility', input: { first, second }, result });

    res.json({ compatibility: result });
  } catch (error) {
    next(error);
  }
}

async function loshu(req, res, next) {
  try {
    const storedDob = getStoredDateOfBirth(req.user);
    const dob = req.body.dob || isoToDdmmyyyy(storedDob);

    if (!dob) {
      return res.status(400).json({ message: 'Date of birth is required or must be saved in your profile' });
    }

    const result = analyzeLoShuGrid({ dob });
    const isoDob = ddmmyyyyToIso(dob);

    await saveCalculation(
      req.user,
      { type: 'loshu', input: { dob }, result },
      isoDob ? { dateOfBirth: isoDob } : {}
    );

    res.json(result);
  } catch (error) {
    if (error.message.includes('date')) {
      return res.status(400).json({ message: error.message });
    }

    next(error);
  }
}

async function nameScore(req, res, next) {
  try {
    const missing = missingFields(req.body, ['name']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const name = String(req.body.name).trim();
    const dateOfBirth = req.body.dateOfBirth || getStoredDateOfBirth(req.user);

    if (name.length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    if (!dateOfBirth || !isIsoDate(dateOfBirth)) {
      return res.status(400).json({ message: 'A valid dateOfBirth is required or must exist in your profile' });
    }

    const result = calculateNameCorrectionScore({ name, dateOfBirth });
    const suggestions = getNameCorrectionSuggestions({ fullName: name, dateOfBirth });

    res.json({ suggestion: result, suggestions });
  } catch (error) {
    next(error);
  }
}

async function history(req, res, next) {
  try {
    await ensureHistoryIds(req.user);
    res.json({ history: toHistoryItems(req.user) });
  } catch (error) {
    next(error);
  }
}

async function clearHistory(req, res, next) {
  try {
    req.user.lastCalculations = [];
    await req.user.save();

    res.json({ message: 'Calculation history cleared', history: [] });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  clearHistory,
  compatibility,
  createProfile,
  forecast,
  history,
  loshu,
  nameScore
};
