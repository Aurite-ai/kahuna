import 'dotenv/config';
import { app } from './app.js';
import { logger } from './lib/logger.js';

// Re-export types for frontend consumption
export type { AppRouter } from './trpc/router.js';

const PORT = process.env.PORT || 3000;

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  logger.error('SESSION_SECRET environment variable is required');
  logger.error('Generate one with: openssl rand -base64 48');
  process.exit(1);
}

app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Server started');
});
