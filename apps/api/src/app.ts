import cors from "cors";
import express from "express";
import type { Express } from "express";
import { cookieMiddleware } from "./middleware/cookies.js";
import { errorMiddleware } from "./middleware/error.js";
import { loggingMiddleware } from "./middleware/logging.js";
import { authRouter } from "./routes/auth.js";

const app: Express = express();

// =============================================================================
// Global Middleware (order matters)
// =============================================================================

// CORS - allow credentials for cookie-based auth
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  }),
);

// Parse JSON request bodies
app.use(express.json());

// Parse cookies (with signature verification)
app.use(cookieMiddleware);

// Request logging
app.use(loggingMiddleware);

// =============================================================================
// Routes
// =============================================================================

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (outside tRPC for direct cookie handling)
app.use("/api/auth", authRouter);

// tRPC will be mounted here in Phase 3
// app.use('/trpc', ...)

// =============================================================================
// Error Handling (must be last)
// =============================================================================

app.use(errorMiddleware);

export { app };
