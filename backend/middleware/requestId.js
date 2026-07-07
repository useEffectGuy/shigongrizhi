const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

function requestIdMiddleware(req, res, next) {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Attach to request
  req.id = requestId;
  
  // Set response header
  res.setHeader('X-Request-ID', requestId);
  
  // Log request with ID
  logger.debug(`[${requestId}] ${req.method} ${req.path}`);
  
  next();
}

module.exports = requestIdMiddleware;
