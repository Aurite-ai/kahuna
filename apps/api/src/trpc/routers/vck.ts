import type { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { generateProjectVCK, getVCKGeneration, getVCKHistory } from '../../services/vck.js';
import { protectedProcedure, router } from '../trpc.js';

/**
 * Input schema for VCK generation.
 */
const generateVCKInput = z.object({
  projectId: z.string().cuid(),
  framework: z.string().optional(),
  copilot: z.string().optional(),
});

/**
 * VCK router - handles VCK generation and history.
 *
 * This is the core of Kahuna's value proposition: transforming
 * user context into downloadable VCK packages for coding copilots.
 *
 * All operations require authentication and enforce ownership.
 */
export const vckRouter = router({
  /**
   * Generate a VCK for a project.
   *
   * Takes the project's context files, combines them with VCK templates,
   * and returns a complete VCK JSON structure. Also records the generation
   * in the database for history tracking.
   */
  generate: protectedProcedure.input(generateVCKInput).mutation(async ({ ctx, input }) => {
    try {
      const result = await generateProjectVCK(
        ctx.prisma as PrismaClient,
        input.projectId,
        ctx.user.id,
        {
          framework: input.framework,
          copilot: input.copilot,
        }
      );

      return {
        vck: result.vck,
        generationId: result.generation.id,
      };
    } catch (error) {
      // Map service errors to tRPC errors
      if (error instanceof Error) {
        if (error.message === 'Project not found') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }
        if (error.message === 'Access denied') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Access denied',
          });
        }
        // Unknown framework/copilot errors from the generator
        if (error.message.startsWith('Unknown framework:')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        if (error.message.startsWith('Unknown copilot:')) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
      }
      // Re-throw unknown errors
      throw error;
    }
  }),

  /**
   * Get VCK generation history for a project.
   *
   * Returns a list of all VCK generations for the project,
   * ordered by creation date (most recent first).
   */
  history: protectedProcedure
    .input(z.object({ projectId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const generations = await getVCKHistory(
          ctx.prisma as PrismaClient,
          input.projectId,
          ctx.user.id
        );

        return generations;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Project not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Project not found',
            });
          }
          if (error.message === 'Access denied') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Access denied',
            });
          }
        }
        throw error;
      }
    }),

  /**
   * Get a specific VCK generation by ID.
   *
   * Returns the generation record (not the full VCK content -
   * that would require regeneration since we don't store the VCK).
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      try {
        const generation = await getVCKGeneration(
          ctx.prisma as PrismaClient,
          input.id,
          ctx.user.id
        );

        return generation;
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'VCK generation not found') {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'VCK generation not found',
            });
          }
          if (error.message === 'Access denied') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Access denied',
            });
          }
        }
        throw error;
      }
    }),
});
