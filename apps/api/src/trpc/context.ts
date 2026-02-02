import type { User } from '@prisma/client';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { Logger } from 'pino';
import { prisma } from '../db.js';
import { validateSession } from '../lib/auth.js';
import { logger } from '../lib/logger.js';

/**
 * Context available to all tRPC procedures.
 * Contains the authenticated user (if any) and database client.
 *
 * Note: We intentionally exclude req/res from the context type to keep
 * the tRPC procedures portable and avoid complex Express type dependencies.
 * If a procedure needs request/response access, it should use a dedicated
 * Express route instead of tRPC.
 */
export interface Context {
  prisma: typeof prisma;
  user: User | null;
  /** True if this context was created via test auth bypass */
  isTestContext: boolean;
  /** Pino logger instance for structured logging */
  logger: Logger;
}

/**
 * Creates the tRPC context from an Express request.
 *
 * Authentication flow:
 * 1. In test mode (NODE_ENV=test), check for X-Test-User-Id header
 * 2. Otherwise, validate session from signed cookie
 *
 * The test bypass enables programmatic testing of the feedback loop
 * without requiring browser session management.
 */
export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  // Test auth bypass: allows programmatic testing with header-based auth
  // Available in test and development environments
  const allowTestBypass = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';
  if (allowTestBypass && req.headers['x-test-user-id']) {
    const testUserId = req.headers['x-test-user-id'] as string;
    const testUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    return {
      prisma,
      user: testUser,
      isTestContext: true,
      logger,
    };
  }

  // Normal session-based authentication
  // Read session ID from signed cookie and validate against database
  const sessionId = req.signedCookies?.['kahuna.sid'];
  let user: User | null = null;

  if (sessionId) {
    user = await validateSession(sessionId);
  }

  return {
    prisma,
    user,
    isTestContext: false,
    logger,
  };
}

export type { User };
