/**
 * Logger utility to replace console.log statements
 * This allows for better control over logging in production
 */

// Set this to false in production
const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Log a message with optional data
 * @param message The message to log
 * @param data Optional data to log
 */
export const log = (message: string, data?: any): void => {
  if (DEBUG_MODE) {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

/**
 * Log an error message with optional error object
 * @param message The error message
 * @param error Optional error object
 */
export const logError = (message: string, error?: any): void => {
  if (DEBUG_MODE) {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  }
};

/**
 * Log a warning message with optional data
 * @param message The warning message
 * @param data Optional data to log
 */
export const logWarning = (message: string, data?: any): void => {
  if (DEBUG_MODE) {
    if (data) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  }
};

// Logger utility for development environment
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  error: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.error(message, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(message, ...args);
    }
  },
};
