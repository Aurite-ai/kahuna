import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname,time',
          messageFormat: '{method} {path} {status}{msg}',
          hideObject: true,
        },
      }
    : undefined,
});
