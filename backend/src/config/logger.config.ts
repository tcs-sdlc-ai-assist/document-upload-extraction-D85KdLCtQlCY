import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction ? logFormat : consoleFormat,
  }),
];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5,
    }),
  );
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'doc-upload-extraction' },
  transports,
  exitOnError: false,
});