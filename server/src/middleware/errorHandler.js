// Catches routes that don't match any defined endpoint
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
};

// Central error handler — normalizes Mongoose, JWT, Multer, and application errors (ERR-01)
const errorHandler = (err, req, res, _next) => {
  let statusCode =
    res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;
  let message = err.message || "Internal server error";

  // 1. Mongoose Bad ObjectId (CastError) -> 400 Bad Request
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Resource not found: invalid identifier format for '${err.path}'.`;
  }

  // 2. Mongoose Duplicate Key Error (code 11000) -> 409 Conflict
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for '${field}'. Please provide a unique value.`;
  }

  // 3. Mongoose Schema Validation Error -> 400 Bad Request
  else if (err.name === "ValidationError") {
    statusCode = 400;
    const errors = Object.values(err.errors || {}).map((e) => e.message);
    message = errors.length > 0 ? errors.join("; ") : "Invalid input data.";
  }

  // 4. JWT Verification Errors -> 401 Unauthorized
  else if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError"
  ) {
    statusCode = 401;
    message = "Not authorized: token is invalid or has expired.";
  }

  // 5. Multer Upload Errors -> 400 Bad Request
  else if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded file exceeds the maximum allowed size.";
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
      errorType: err.name,
    }),
  });
};

module.exports = { notFound, errorHandler };

