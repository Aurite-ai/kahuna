import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";

/**
 * Input schema for creating a project.
 */
const createProjectInput = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(1000).optional(),
});

/**
 * Input schema for updating a project.
 */
const updateProjectInput = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Project name is required").max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
});

/**
 * Project router - CRUD operations for projects.
 *
 * All operations require authentication and enforce ownership.
 * Projects are the anchor for all feedback loop content:
 * context files, VCK generations, and build results.
 */
export const projectRouter = router({
  /**
   * Create a new project for the authenticated user.
   */
  create: protectedProcedure
    .input(createProjectInput)
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.create({
        data: {
          name: input.name,
          userId: ctx.user.id,
        },
      });

      return project;
    }),

  /**
   * List all projects owned by the authenticated user.
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await ctx.prisma.project.findMany({
      where: {
        userId: ctx.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return projects;
  }),

  /**
   * Get a single project by ID.
   * Verifies ownership before returning.
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: {
          contextFiles: {
            orderBy: { updatedAt: "desc" },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      return project;
    }),

  /**
   * Update a project's name or description.
   * Verifies ownership before updating.
   */
  update: protectedProcedure
    .input(updateProjectInput)
    .mutation(async ({ ctx, input }) => {
      // Verify ownership first
      const existing = await ctx.prisma.project.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Build update data (only include provided fields)
      const updateData: { name?: string } = {};
      if (input.name !== undefined) {
        updateData.name = input.name;
      }

      const project = await ctx.prisma.project.update({
        where: { id: input.id },
        data: updateData,
      });

      return project;
    }),

  /**
   * Delete a project.
   * Cascades to all related data (context files, VCK generations, build results).
   * Verifies ownership before deleting.
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership first
      const existing = await ctx.prisma.project.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      // Cascade delete is handled by Prisma schema (onDelete: Cascade)
      await ctx.prisma.project.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
