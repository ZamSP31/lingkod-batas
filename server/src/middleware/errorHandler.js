// Catches routes that don't match any defined endpoint
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

// Central error handler — every thrown error in controllers/services lands here
const errorHandler = (err, req, res, next) => {
  // if a route set res.status already, keep it; otherwise default to 500
  const statusCode = res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
