import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Request logging middleware.
 * Logs request information on response completion using pino.
 */
export function loggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
    });
  });

  next();
}
