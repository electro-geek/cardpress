const appLogger = (...args) => console.log(...args);
appLogger.info = (...args) => console.log('[INFO]', ...args);
appLogger.error = (...args) => console.error('[ERROR]', ...args);
appLogger.errorX = (...args) => console.error('[ERROR]', ...args);
appLogger.warn = (...args) => console.warn('[WARN]', ...args);

module.exports = { appLogger };
