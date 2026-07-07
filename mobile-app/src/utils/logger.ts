const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = levels[LOG_LEVEL] || levels.debug;

function logMessage(level: keyof typeof levels, ...args: any[]) {
  if (levels[level] >= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
  }
}

export const logger = {
  debug: (...args: any[]) => logMessage('debug', ...args),
  info: (...args: any[]) => logMessage('info', ...args),
  warn: (...args: any[]) => logMessage('warn', ...args),
  error: (...args: any[]) => logMessage('error', ...args)
};

// Helper function to replace console.log in production
export const log = logger.debug;