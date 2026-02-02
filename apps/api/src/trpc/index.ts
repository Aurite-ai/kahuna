/**
 * tRPC infrastructure exports.
 *
 * This module provides the tRPC setup for the Kahuna API:
 * - Context creation for Express integration
 * - Base procedures (public and protected)
 * - Router factory and utilities
 * - The app router and its type
 */

// Context
export { createContext } from "./context.js";
export type { Context } from "./context.js";

// tRPC primitives
export {
  router,
  middleware,
  publicProcedure,
  protectedProcedure,
  mergeRouters,
} from "./trpc.js";

// App router
export { appRouter } from "./router.js";
export type { AppRouter } from "./router.js";
