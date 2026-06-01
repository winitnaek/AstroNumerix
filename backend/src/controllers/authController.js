const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { calculateAstrologyProfile } = require('../engine/astrologyEngine');
const { hasValidEmailDomain, isEmail, isIsoDate, isLatitude, isLongitude, isTime, missingFields } = require('../utils/validators');

const PASSWORD_RESET_MINUTES = 15;
const PASSWORD_RESET_MESSAGE = 'If an account exists for that email, password reset instructions have been sent.';

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function buildResetUrl(token) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';
  return `${clientUrl.replace(/\/$/, '')}/reset-password/${token}`;
}

function canReturnLocalResetLink() {
  return process.env.NODE_ENV !== 'production';
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

    if (!(await hasValidEmailDomain(email))) {
      return res.status(400).json({ message: 'Please enter a real email address with a valid mail domain' });
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

    if (!isEmail(req.body.email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (!(await hasValidEmailDomain(req.body.email))) {
      return res.status(400).json({ message: 'Please enter a real email address with a valid mail domain' });
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

async function forgotPassword(req, res, next) {
  try {
    const missing = missingFields(req.body, ['email']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    if (!isEmail(req.body.email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (!canReturnLocalResetLink()) {
      return res.status(503).json({ message: 'Password reset email delivery is not configured yet' });
    }

    const user = await User.findOne({ email: String(req.body.email).toLowerCase() });
    const response = { message: PASSWORD_RESET_MESSAGE };

    if (!user) {
      return res.json(response);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const resetUrl = buildResetUrl(resetToken);

    if (canReturnLocalResetLink()) {
      response.resetUrl = resetUrl;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const missing = missingFields(req.body, ['token', 'password']);
    if (missing.length) {
      return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    if (String(req.body.password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const user = await User.findOne({
      passwordResetToken: hashResetToken(req.body.token),
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ message: 'Password reset link is invalid or has expired' });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset. You can now sign in.' });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}

module.exports = { forgotPassword, login, me, register, resetPassword };
