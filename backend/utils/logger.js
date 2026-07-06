const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = levels[LOG_LEVEL.toLowerCase()] || levels.info;

function log(level, ...args) {
  if (levels[level] >= currentLevel) {
    const timestamp = new Date().toISOString();
    const levelColor = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m'
    };
    const reset = '\x1b[0m';
    console.log(`${levelColor[level]}[${timestamp}] [${level.toUpperCase()}]${reset}`, ...args);
  }
}

const logger = {
  debug: (...args) => log('debug', ...args),
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args)
};

module.exports = logger;