const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error:', err);
  
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    statusCode = 400;
    errorMessage = 'Duplicate entry';
  } else if (err.code === 'SQLITE_ERROR') {
    statusCode = 400;
    errorMessage = 'Database error';
  } else if (err.message === 'Database not initialized yet') {
    statusCode = 503;
    errorMessage = 'Service unavailable';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorMessage = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = 'Token expired';
  } else if (err.status) {
    statusCode = err.status;
    errorMessage = err.message || errorMessage;
  } else if (err.message) {
    statusCode = 400;
    errorMessage = err.message;
  }
  
  const response = {
    error: errorMessage,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };
  
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
}

function validationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function authenticationError(message = 'Unauthorized') {
  const error = new Error(message);
  error.status = 401;
  return error;
}

function forbiddenError(message = 'Forbidden') {
  const error = new Error(message);
  error.status = 403;
  return error;
}

function notFoundError(message = 'Not found') {
  const error = new Error(message);
  error.status = 404;
  return error;
}

module.exports = {
  errorHandler,
  validationError,
  authenticationError,
  forbiddenError,
  notFoundError
};
