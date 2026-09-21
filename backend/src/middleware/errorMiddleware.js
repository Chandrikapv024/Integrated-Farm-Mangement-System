/**
 * Centralized Error Handling Middleware for Express.
 * Formats clean JSON responses and prevents exposure of credentials,
 * secrets, and production stack traces.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;
  if (statusCode === 200) {
    statusCode = 500;
  }

  let message = err.message || 'Internal Server Error';

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Handle Mongoose CastError (Malformed Object ID)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for ${err.path}: ${err.value}`;
  }

  // Handle Mongoose Duplicate Key Error (e.g. unique email)
  if (err.code && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired';
  }

  // Sanitize message to ensure secrets/DB strings aren't leaked in raw error messages
  const sanitizedMessage = message
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[DATABASE_URI_REDACTED]')
    .replace(/secret=[^\s]+/gi, 'secret=[REDACTED]');

  res.status(statusCode).json({
    success: false,
    message: sanitizedMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
