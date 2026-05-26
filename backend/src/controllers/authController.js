const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { calculateAstrologyProfile } = require('../engine/astrologyEngine');
const { isEmail, isIsoDate, isLatitude, isLongitude, isTime, missingFields } = require('../utils/validators');

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

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

async function register(req, res, next) {
  try {
    const missing = missingFields(req.body, ['name', 'email', 'password']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const { name, email, password, dateOfBirth, birthTime } = req.body;
    let birthLocation = null;

    if (!isEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    if (dateOfBirth && !isIsoDate(dateOfBirth)) {
      return res.status(400).json({ message: 'Date of birth must be YYYY-MM-DD' });
    }

    if (birthTime && !isTime(birthTime)) {
      return res.status(400).json({ message: 'Birth time must be HH:mm' });
    }

    try {
      birthLocation = normalizeBirthLocation(req.body.birthLocation);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const existingUser = await User.findOne({ email: String(email).toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    const astrologyProfile = calculateAstrologyProfile({
      dateOfBirth,
      birthTime,
      birthLocation
    });
    const user = await User.create({
      name,
      email,
      password,
      dateOfBirth: dateOfBirth || null,
      birthTime: birthTime || null,
      birthLocation,
      astrologyProfile
    });
    const token = signToken(user._id);

    res.status(201).json({ token, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const missing = missingFields(req.body, ['email', 'password']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    const user = await User.findOne({ email: String(req.body.email).toLowerCase() }).select('+password');

    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    user.password = undefined;

    res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

module.exports = { login, me, register };
