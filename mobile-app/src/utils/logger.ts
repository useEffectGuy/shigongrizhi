const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'error' : 'debug';

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = levels[LOG_LEVEL] || levels.debug;

function log(level: keyof typeof levels, ...args: any[]) {
  if (levels[level] >= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}]`, ...args);
  }
}

export const logger = {
  debug: (...args: any[]) => log('debug', ...args),
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args)
};