/**
 * Structured logging utility using Winston
 * Replaces console.log for production-ready logging
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }
  )
);

// JSON format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [
  // Console transport - always available
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Only add file transports in environments with writable filesystem
// Vercel and other serverless platforms have read-only filesystems
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

if (!isServerless) {
  transports.push(
    // Error log file (errors only)
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
    // Combined log file (all levels)
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Sensitive fields to redact
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'ssn',
  'creditCard',
  'cvv',
  'pin',
  'authToken',
  'sessionToken',
];

/**
 * Redact sensitive fields from an object
 */
export function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  const redacted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_FIELDS.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      redacted[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Logger interface with request context support
 */
export interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext = {}) {
  const redactedContext = redactSensitiveData(context);

  return {
    error: (message: string, meta: any = {}) => {
      logger.error(message, { ...redactedContext, ...redactSensitiveData(meta) });
    },
    warn: (message: string, meta: any = {}) => {
      logger.warn(message, { ...redactedContext, ...redactSensitiveData(meta) });
    },
    info: (message: string, meta: any = {}) => {
      logger.info(message, { ...redactedContext, ...redactSensitiveData(meta) });
    },
    http: (message: string, meta: any = {}) => {
      logger.http(message, { ...redactedContext, ...redactSensitiveData(meta) });
    },
    debug: (message: string, meta: any = {}) => {
      logger.debug(message, { ...redactedContext, ...redactSensitiveData(meta) });
    },
  };
}

/**
 * Default logger instance (use createLogger for request-scoped logging)
 */
export default logger;
