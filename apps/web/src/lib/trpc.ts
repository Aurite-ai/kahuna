/**
 * tRPC React hooks.
 * This module creates typed tRPC hooks for use throughout the frontend.
 */
import { createTRPCReact } from "@trpc/react-query";
import type { CreateTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../api/src/trpc/router.js";

/**
 * Re-export AppRouter type for use elsewhere in the frontend.
 */
export type { AppRouter };

/**
 * Typed tRPC React hooks.
 * Use these hooks to call tRPC procedures with full type safety:
 *
 * @example
 * ```tsx
 * // Query
 * const { data } = trpc.project.list.useQuery();
 *
 * // Mutation
 * const createProject = trpc.project.create.useMutation();
 * createProject.mutate({ name: 'My Project' });
 * ```
 */
export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();
