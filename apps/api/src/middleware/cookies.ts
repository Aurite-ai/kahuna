import cookieParser from 'cookie-parser';
import type { RequestHandler } from 'express';

// Parse cookies and verify signatures
// SESSION_SECRET must be set in environment for signed cookies
export const cookieMiddleware: RequestHandler = cookieParser(process.env.SESSION_SECRET);
