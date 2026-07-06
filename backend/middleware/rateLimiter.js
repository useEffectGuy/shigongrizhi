const rateLimit = require('express-rate-limit');

const LOGIN_RATE_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT) || 5;
const LOGIN_RATE_WINDOW = parseInt(process.env.LOGIN_RATE_WINDOW) || 60000;

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

module.exports = { loginLimiter, registerLimiter };