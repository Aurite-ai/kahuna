import { publicProcedure, router } from "./trpc.js";

/**
 * Health check router - provides a simple endpoint for verifying tRPC is working.
 */
const healthRouter = router({
  /**
   * Ping endpoint - returns current timestamp.
   * Useful for health checks and verifying tRPC connectivity.
   */
  ping: publicProcedure.query(() => {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }),
});

/**
 * App router - the root tRPC router.
 * All sub-routers are merged here.
 *
 * Current structure:
 * - health.ping - Health check endpoint (public)
 *
 * Future phases will add:
 * - project.* - Project management (protected)
 * - context.* - Context file management (protected)
 * - vck.* - VCK generation (protected)
 * - results.* - Build results (protected)
 */
export const appRouter = router({
  health: healthRouter,
});

/**
 * AppRouter type - exported for client-side type inference.
 * Used by @trpc/client to provide end-to-end type safety.
 */
export type AppRouter = typeof appRouter;
