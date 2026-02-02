import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";

/**
 * Input schema for creating a context file.
 */
const createContextInput = z.object({
  projectId: z.string().cuid(),
  filename: z.string().min(1, "Filename is required").max(255),
  content: z.string(),
});

/**
 * Input schema for updating a context file.
 */
const updateContextInput = z.object({
  id: z.string().cuid(),
  filename: z.string().min(1, "Filename is required").max(255).optional(),
  content: z.string().optional(),
});

/**
 * Helper to verify the user owns the project.
 * Returns the project if ownership is verified, throws FORBIDDEN otherwise.
 */
async function verifyProjectOwnership(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    });
  }

  if (project.userId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access denied",
    });
  }

  return project;
}

/**
 * Context router - CRUD operations for context files.
 *
 * Context files store user-provided business information that gets included in VCKs.
 * All operations require authentication and verify project ownership.
 */
export const contextRouter = router({
  /**
   * Create a new context file for a project.
   * Verifies the user owns the project.
   */
  create: protectedProcedure
    .input(createContextInput)
    .mutation(async ({ ctx, input }) => {
      // Verify user owns the project
      await verifyProjectOwnership(
        ctx.prisma as PrismaClient,
        input.projectId,
        ctx.user.id,
      );

      const contextFile = await ctx.prisma.contextFile.create({
        data: {
          projectId: input.projectId,
          filename: input.filename,
          content: input.content,
        },
      });

      return contextFile;
    }),

  /**
   * List all context files for a project.
   * Verifies the user owns the project.
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify user owns the project
      await verifyProjectOwnership(
        ctx.prisma as PrismaClient,
        input.projectId,
        ctx.user.id,
      );

      const contextFiles = await ctx.prisma.contextFile.findMany({
        where: {
          projectId: input.projectId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      return contextFiles;
    }),

  /**
   * Get a single context file by ID.
   * Verifies the user owns the parent project.
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const contextFile = await ctx.prisma.contextFile.findUnique({
        where: { id: input.id },
        include: {
          project: true,
        },
      });

      if (!contextFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Context file not found",
        });
      }

      // Verify ownership through project
      if (contextFile.project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Return without the nested project to keep response clean
      const { project: _, ...file } = contextFile;
      return file;
    }),

  /**
   * Update a context file's filename or content.
   * Verifies the user owns the parent project.
   */
  update: protectedProcedure
    .input(updateContextInput)
    .mutation(async ({ ctx, input }) => {
      const contextFile = await ctx.prisma.contextFile.findUnique({
        where: { id: input.id },
        include: {
          project: true,
        },
      });

      if (!contextFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Context file not found",
        });
      }

      // Verify ownership through project
      if (contextFile.project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Build update data (only include provided fields)
      const updateData: { filename?: string; content?: string } = {};
      if (input.filename !== undefined) {
        updateData.filename = input.filename;
      }
      if (input.content !== undefined) {
        updateData.content = input.content;
      }

      const updated = await ctx.prisma.contextFile.update({
        where: { id: input.id },
        data: updateData,
      });

      return updated;
    }),

  /**
   * Delete a context file.
   * Verifies the user owns the parent project.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const contextFile = await ctx.prisma.contextFile.findUnique({
        where: { id: input.id },
        include: {
          project: true,
        },
      });

      if (!contextFile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Context file not found",
        });
      }

      // Verify ownership through project
      if (contextFile.project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      await ctx.prisma.contextFile.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
