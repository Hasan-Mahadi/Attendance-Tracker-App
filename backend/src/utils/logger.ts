import winston from 'winston';
import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

/**
 * Custom log format for development environment.
 * Includes colorized level, timestamp, request ID, and message.
 */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, requestId, stack, ...meta }) => {
    const reqId = requestId ? ` [${requestId}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} ${level}${reqId}: ${message}${metaStr}${stackStr}`;
  })
);

/**
 * Production log format using structured JSON.
 */
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

/**
 * Application-wide Winston logger instance.
 * Uses JSON format in production and pretty format in development.
 */
export const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'info',
  format: env.isProduction ? prodFormat : devFormat,
  defaultMeta: { service: 'attendance-tracker' },
  transports: [
    new winston.transports.Console(),
  ],
  silent: env.isTest,
});

/**
 * Create a child logger with a specific request ID for request-scoped logging.
 * @param requestId - The unique request identifier
 */
export function createRequestLogger(requestId: string): winston.Logger {
  return logger.child({ requestId });
}
