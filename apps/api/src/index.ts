import "dotenv/config";
import { app } from "./app.js";

// Re-export types for frontend consumption
export type { AppRouter } from "./trpc/router.js";

const PORT = process.env.PORT || 3000;

// Validate required environment variables
if (!process.env.SESSION_SECRET) {
  console.error("ERROR: SESSION_SECRET environment variable is required");
  console.error("Generate one with: openssl rand -base64 48");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
