const { calculateAstrologyProfile } = require('../engine/astrologyEngine');
const { isIsoDate, isLatitude, isLongitude, isTime } = require('../utils/validators');

function toPublicUser(user) {
  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    dateOfBirth: user.dateOfBirth || user.profile?.source?.dateOfBirth || null,
    birthTime: user.birthTime || null,
    birthLocation: user.birthLocation || null,
    profile: user.profile,
    astrologyProfile: user.astrologyProfile || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function normalizeBirthLocation(value) {
  if (!value) {
    return null;
  }

  const name = String(value.name || '').trim();

  if (!name && value.latitude === undefined && value.longitude === undefined) {
    return null;
  }

  if (!name || !isLatitude(value.latitude) || !isLongitude(value.longitude)) {
    throw new Error('Birth location must include name, latitude, and longitude');
  }

  return {
    name,
    latitude: Number(value.latitude),
    longitude: Number(value.longitude)
  };
}

async function updateMe(req, res, next) {
  try {
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      const name = String(req.body.name || '').trim();

      if (name.length < 2) {
        return res.status(400).json({ message: 'Name must be at least 2 characters' });
      }

      updates.name = name;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'dateOfBirth')) {
      const dateOfBirth = req.body.dateOfBirth;

      if (dateOfBirth && !isIsoDate(dateOfBirth)) {
        return res.status(400).json({ message: 'Date of birth must be YYYY-MM-DD' });
      }

      updates.dateOfBirth = dateOfBirth || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'birthTime')) {
      const birthTime = req.body.birthTime;

      if (birthTime && !isTime(birthTime)) {
        return res.status(400).json({ message: 'Birth time must be HH:mm' });
      }

      updates.birthTime = birthTime || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'birthLocation')) {
      try {
        updates.birthLocation = normalizeBirthLocation(req.body.birthLocation);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    const nextDateOfBirth = Object.prototype.hasOwnProperty.call(updates, 'dateOfBirth') ? updates.dateOfBirth : req.user.dateOfBirth;
    const nextBirthTime = Object.prototype.hasOwnProperty.call(updates, 'birthTime') ? updates.birthTime : req.user.birthTime;
    const nextBirthLocation = Object.prototype.hasOwnProperty.call(updates, 'birthLocation') ? updates.birthLocation : req.user.birthLocation;

    updates.astrologyProfile = calculateAstrologyProfile({
      dateOfBirth: nextDateOfBirth,
      birthTime: nextBirthTime,
      birthLocation: nextBirthLocation
    });

    req.user.set(updates);
    await req.user.save();

    res.json({ user: toPublicUser(req.user) });
  } catch (error) {
    next(error);
  }
}

module.exports = { updateMe };
