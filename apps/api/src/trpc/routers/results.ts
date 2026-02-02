import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";

/**
 * Schema for file content - maps relative paths to file contents.
 * Example: { "index.ts": "export const foo = 1;", "utils/helper.ts": "..." }
 */
const fileContentSchema = z.record(z.string(), z.string());

/**
 * Input schema for submitting build results.
 * Structured fields for code, docs, and tests from the built agent.
 */
const submitResultInput = z.object({
  projectId: z.string().cuid(),
  code: fileContentSchema,
  docs: fileContentSchema,
  tests: fileContentSchema,
  conversationLog: z.string().optional(),
});

/**
 * Helper function to verify project ownership.
 * Throws specific error messages for tRPC mapping.
 */
async function verifyProjectOwnership(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.userId !== userId) {
    throw new Error("Access denied");
  }
}

/**
 * Results router - handles build result submission and retrieval.
 *
 * This completes the feedback loop: users submit conversation logs and
 * generated code from their coding copilot sessions. This data is used
 * to analyze VCK effectiveness and improve future generations.
 *
 * All operations require authentication and enforce ownership.
 */
export const resultsRouter = router({
  /**
   * Submit build results for a project.
   *
   * Content is a flexible text blob - callers can structure it as JSON
   * or plain text. This flexibility allows capturing various types of
   * feedback without schema changes.
   */
  submit: protectedProcedure
    .input(submitResultInput)
    .mutation(async ({ ctx, input }) => {
      try {
        // Verify ownership before creating
        await verifyProjectOwnership(
          ctx.prisma as PrismaClient,
          input.projectId,
          ctx.user.id,
        );

        // Create the build result with structured fields
        const result = await ctx.prisma.buildResult.create({
          data: {
            projectId: input.projectId,
            code: input.code,
            docs: input.docs,
            tests: input.tests,
            conversationLog: input.conversationLog,
          },
        });

        return result;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Project not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Project not found",
            });
          }
          if (error.message === "Access denied") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Access denied",
            });
          }
        }
        throw error;
      }
    }),

  /**
   * List build results for a project.
   *
   * Returns all results for the project, ordered by creation date
   * (most recent first). Only the project owner can access these.
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      try {
        // Verify ownership
        await verifyProjectOwnership(
          ctx.prisma as PrismaClient,
          input.projectId,
          ctx.user.id,
        );

        // Fetch results for the project
        const results = await ctx.prisma.buildResult.findMany({
          where: { projectId: input.projectId },
          orderBy: { createdAt: "desc" },
        });

        return results;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "Project not found") {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Project not found",
            });
          }
          if (error.message === "Access denied") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Access denied",
            });
          }
        }
        throw error;
      }
    }),

  /**
   * Get a single build result by ID.
   *
   * Returns the full result record. Only the project owner can access.
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Fetch the result with project info for ownership check
      const result = await ctx.prisma.buildResult.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: { userId: true },
          },
        },
      });

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Build result not found",
        });
      }

      // Check ownership
      if (result.project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Return result without the nested project ownership info
      const { project: _, ...resultData } = result;
      return resultData;
    }),
});
