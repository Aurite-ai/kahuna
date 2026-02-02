import { Router } from "express";
import type { IRouter } from "express";
import { prisma } from "../db.js";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "../lib/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

export const authRouter: IRouter = Router();

/**
 * POST /api/auth/register
 * Create a new user account and start a session.
 */
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || typeof email !== "string") {
      throw new HttpError(400, "Email is required");
    }
    if (!password || typeof password !== "string") {
      throw new HttpError(400, "Password is required");
    }
    if (password.length < 8) {
      throw new HttpError(400, "Password must be at least 8 characters");
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new HttpError(409, "Email already registered");
    }

    // Create user with hashed password
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Create session and set cookie
    const sessionId = await createSession(user.id);
    setSessionCookie(res, sessionId);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Authenticate with email and password, start a session.
 */
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || typeof email !== "string") {
      throw new HttpError(400, "Email is required");
    }
    if (!password || typeof password !== "string") {
      throw new HttpError(400, "Password is required");
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    // Verify password
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    // Create session and set cookie
    const sessionId = await createSession(user.id);
    setSessionCookie(res, sessionId);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * End the current session and clear the cookie.
 */
authRouter.post("/logout", async (req, res, next) => {
  try {
    const sessionId = req.signedCookies?.["kahuna.sid"];

    if (sessionId) {
      await deleteSession(sessionId);
    }

    clearSessionCookie(res);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get the current authenticated user.
 * Requires authentication.
 */
authRouter.get("/me", requireAuth, (req, res) => {
  // User is guaranteed to exist after requireAuth middleware
  const user = req.user;
  if (!user) {
    // This should never happen after requireAuth, but satisfies TypeScript
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
});
