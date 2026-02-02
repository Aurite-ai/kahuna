import type { User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db.js';
import { validateSession } from '../lib/auth.js';
import { HttpError } from './error.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      isTestContext?: boolean;
    }
  }
}

/**
 * Middleware that requires authentication.
 * Validates session cookie and attaches user to request.
 *
 * In test environment (NODE_ENV=test), allows bypassing auth via X-Test-User-Id header.
 * This enables automated testing without simulating browser sessions.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // Test bypass: Check for test user header in test environment
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-user-id']) {
      const testUserId = req.headers['x-test-user-id'] as string;
      const testUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      if (testUser) {
        req.user = testUser;
        req.userId = testUser.id;
        req.isTestContext = true;
        return next();
      }
      // If test user doesn't exist, fall through to normal auth
    }

    // Normal auth: Check session cookie
    const sessionId = req.signedCookies?.['kahuna.sid'];

    if (!sessionId) {
      throw new HttpError(401, 'Authentication required');
    }

    const user = await validateSession(sessionId);

    if (!user) {
      throw new HttpError(401, 'Invalid or expired session');
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth middleware - attaches user if session exists, but doesn't require it.
 * Useful for routes that behave differently for authenticated vs anonymous users.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Test bypass
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-user-id']) {
      const testUserId = req.headers['x-test-user-id'] as string;
      const testUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      if (testUser) {
        req.user = testUser;
        req.userId = testUser.id;
        req.isTestContext = true;
      }
      return next();
    }

    // Normal auth - try to get user from session if present
    const sessionId = req.signedCookies?.['kahuna.sid'];

    if (sessionId) {
      const user = await validateSession(sessionId);
      if (user) {
        req.user = user;
        req.userId = user.id;
      }
    }

    next();
  } catch (error) {
    // Don't fail on auth errors for optional auth
    next();
  }
}
