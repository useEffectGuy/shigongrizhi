const rateLimit = require('express-rate-limit');

const LOGIN_RATE_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT) || 5;
const LOGIN_RATE_WINDOW = parseInt(process.env.LOGIN_RATE_WINDOW) || 60000;

// General API rate limiter for all endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 900
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: 900
    });
  }
});

// Stricter limiter for write operations (POST, PUT, DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 write requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many write requests',
    message: 'Please try again later',
    retryAfter: 900
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many write requests',
      message: 'Please try again later',
      retryAfter: 900
    });
  }
});

const loginLimiter = rateLimit({
  windowMs: LOGIN_RATE_WINDOW,
  max: LOGIN_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts, please try again later',
    retryAfter: Math.ceil(LOGIN_RATE_WINDOW / 1000)
  },
  handler: (req, res) => {
    const retryAfter = Math.ceil(LOGIN_RATE_WINDOW / 1000);
    res.status(429).json({
      error: 'Too many login attempts',
      message: `Please try again after ${retryAfter} seconds`,
      retryAfter: retryAfter
    });
  }
});

const registerLimiter = rateLimit({
  windowMs: 60000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'Please try again after 60 seconds',
      retryAfter: 60
    });
  }
});

module.exports = { loginLimiter, registerLimiter, apiLimiter, writeLimiter };