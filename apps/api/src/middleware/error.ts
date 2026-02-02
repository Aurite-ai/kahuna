import type { NextFunction, Request, Response } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Custom error class for HTTP errors with status codes.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Global error handling middleware.
 * Catches unhandled errors and returns consistent JSON responses.
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error - pino serializes Error objects automatically
  logger.error({
    err,
    path: req.path,
    method: req.method,
  });

  // Determine status code
  const statusCode = err instanceof HttpError ? err.statusCode : 500;

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === 'development' || err instanceof HttpError
      ? err.message
      : 'Internal server error';

  res.status(statusCode).json({ error: message });
}
