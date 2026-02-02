import { TRPCError, initTRPC } from "@trpc/server";
import type { Context } from "./context.js";

/**
 * Initialize tRPC with our context type.
 * This creates the foundation for all routers and procedures.
 */
const t = initTRPC.context<Context>().create();

/**
 * Router factory - used to create tRPC routers.
 */
export const router = t.router;

/**
 * Middleware factory - used to create reusable middleware.
 */
export const middleware = t.middleware;

/**
 * Public procedure - no authentication required.
 * Use for endpoints that should be accessible to everyone.
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authenticated user.
 * Throws UNAUTHORIZED if no user in context.
 *
 * After this middleware, ctx.user is guaranteed to be non-null,
 * providing type safety for procedures that require authentication.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Narrow the context type to guarantee user exists
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now typed as User, not User | null
    },
  });
});

/**
 * Merge routers utility - combines multiple routers into one.
 */
export const mergeRouters = t.mergeRouters;
