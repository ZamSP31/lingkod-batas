const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const registerClient = async ({ fullName, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  // role is intentionally not accepted from the request body —
  // self-registration is always 'client'. Attorneys are admin-created.
  const user = await User.create({ fullName, email, password, role: 'client' });

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token: generateToken(user._id, user.role),
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('This account has been deactivated.');
    err.statusCode = 403;
    throw err;
  }

  return {
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    token: generateToken(user._id, user.role),
  };
};

module.exports = { registerClient, login };
