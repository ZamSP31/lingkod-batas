const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// Verifies the JWT and attaches the user to req.user
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, no token provided.');
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired.');
  }

  req.user = await User.findById(decoded.id).select('-password +sessionVersion');

  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user no longer exists.');
  }

  if (req.user.isActive === false) {
    res.status(403);
    throw new Error('Account has been deactivated. Access revoked.');
  }

  if (decoded.purpose !== 'access' || !Number.isInteger(decoded.sessionVersion) ||
      decoded.sessionVersion !== (req.user.sessionVersion ?? 0)) {
    res.status(401);
    throw new Error('Session expired. Please sign in again.');
  }

  const { checkSessionActivity } = require('../services/sessionActivity');
  const valid = await checkSessionActivity({ token, decoded,
    activity: req.method === 'POST' && req.originalUrl?.split('?')[0] === '/api/auth/activity',
    Session: require('../models/AccessSession') });
  if (!valid) {
    res.status(401);
    throw new Error('Signed out after one hour of inactivity. Please sign in again.');
  }

  next();
});

// Restricts a route to specific roles, e.g. authorize('attorney')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user?.role}' is not permitted to access this resource.`);
    }
    next();
  };
};

module.exports = { protect, authorize };
