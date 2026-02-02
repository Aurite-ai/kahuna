import type { NextFunction, Request, Response } from "express";

/**
 * Custom error class for HTTP errors with status codes.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
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
  _next: NextFunction,
): void {
  // Log the error
  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.path,
      method: req.method,
    }),
  );

  // Determine status code
  const statusCode = err instanceof HttpError ? err.statusCode : 500;

  // Don't leak error details in production
  const message =
    process.env.NODE_ENV === "development" || err instanceof HttpError
      ? err.message
      : "Internal server error";

  res.status(statusCode).json({ error: message });
}
