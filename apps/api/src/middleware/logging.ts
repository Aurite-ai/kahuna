import type { NextFunction, Request, Response } from "express";

/**
 * Request logging middleware.
 * Logs JSON-formatted request information on response completion.
 */
export function loggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    // userId comes from the session if attached by auth middleware
    const userId = (req as Request & { userId?: string }).userId ?? "anonymous";

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration,
        userId,
      }),
    );
  });
  next();
}
