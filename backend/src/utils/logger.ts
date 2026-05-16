import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format
const customFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

// Console transport (for development)
const consoleTransport = new winston.transports.Console({
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
});

// File transports
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
});

const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
});

// Create logger
const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  defaultMeta: { service: 'nebula-backend' },
  transports: env.NODE_ENV === 'production' 
    ? [errorFileTransport, combinedFileTransport]
    : [consoleTransport, errorFileTransport, combinedFileTransport],
  exceptionHandlers: [errorFileTransport],
  rejectionHandlers: [errorFileTransport],
});

export default logger;
