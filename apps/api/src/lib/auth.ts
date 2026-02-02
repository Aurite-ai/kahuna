import bcrypt from 'bcrypt';
import type { Response } from 'express';
import { prisma } from '../db.js';

// Session expires in 7 days
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// bcrypt cost factor
const BCRYPT_ROUNDS = 12;

/**
 * Cookie options for session cookie.
 * httpOnly prevents XSS access, secure requires HTTPS in production,
 * sameSite='lax' provides CSRF protection while allowing navigation.
 */
export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: SESSION_MAX_AGE_MS,
  signed: true,
};

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a new session for a user in the database.
 * Returns the session ID to be stored in the cookie.
 */
export async function createSession(userId: string): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS),
    },
  });
  return session.id;
}

/**
 * Validate a session ID and return the associated user if valid.
 * Returns null if session doesn't exist or has expired.
 */
export async function validateSession(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  // Session doesn't exist or has expired
  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

/**
 * Delete a session from the database.
 * Silently ignores if session doesn't exist.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {
    // Ignore error if session already deleted
  });
}

/**
 * Set the session cookie on a response.
 */
export function setSessionCookie(res: Response, sessionId: string): void {
  res.cookie('kahuna.sid', sessionId, sessionCookieOptions);
}

/**
 * Clear the session cookie from a response.
 */
export function clearSessionCookie(res: Response): void {
  res.clearCookie('kahuna.sid');
}
