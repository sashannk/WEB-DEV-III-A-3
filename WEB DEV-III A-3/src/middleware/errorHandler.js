function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || res.statusCode;
  let message = error.message || 'Server error';
  let details;

  if (!statusCode || statusCode < 400) {
    statusCode = 500;
  }

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${error.path}: ${error.value}`;
  }

  if (error.code === 11000) {
    statusCode = 409;
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    message = `Duplicate value for ${field}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details && { details })
  });
}

module.exports = {
  notFound,
  errorHandler
};
