const { analyzeCleanTrade } = require('../engine/cleanTradeEngine');
const { isIsoDate } = require('../utils/validators');

const ASCENDANTS = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces'
];

function normalizeAscendant(value) {
  if (!value) {
    return '';
  }

  const normalized = ASCENDANTS.find((item) => item.toLowerCase() === String(value).trim().toLowerCase());
  return normalized || null;
}

function normalizeAsset(value) {
  if (!value) {
    return '';
  }

  return String(value).trim().toUpperCase();
}

function getSavedAscendant(user) {
  return user?.astrologyProfile?.ascendant?.westernName || '';
}

async function saveCleanTradeCalculation(user, calculation) {
  await user.constructor.updateOne(
    { _id: user._id },
    {
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

async function cleanAnalysis(req, res, next) {
  try {
    const targetDate = req.body.targetDate;

    if (!targetDate) {
      return res.status(400).json({ message: 'targetDate is required' });
    }

    if (!isIsoDate(targetDate)) {
      return res.status(400).json({ message: 'targetDate must be YYYY-MM-DD' });
    }

    const asset = normalizeAsset(req.body.asset);
    if (asset && !/^[A-Z0-9.-]{1,16}$/.test(asset)) {
      return res.status(400).json({ message: 'asset must be a valid symbol' });
    }

    const requestedAscendant = req.body.ascendant || getSavedAscendant(req.user);
    const ascendant = normalizeAscendant(requestedAscendant);
    if (requestedAscendant && !ascendant) {
      return res.status(400).json({ message: 'ascendant must be one of the 12 zodiac signs' });
    }

    const analysis = await analyzeCleanTrade({
      targetDate,
      location: req.body.location || 'Cumming, Georgia, USA',
      asset,
      ascendant
    });

    if (req.body.saveHistory === true) {
      await saveCleanTradeCalculation(req.user, {
        type: 'cleanTrade',
        input: {
          targetDate,
          location: req.body.location || 'Cumming, Georgia, USA',
          asset,
          ascendant
        },
        result: analysis
      });
    }

    res.json(analysis);
  } catch (error) {
    next(error);
  }
}

module.exports = { cleanAnalysis };
