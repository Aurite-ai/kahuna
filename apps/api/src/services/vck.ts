/**
 * VCK Service
 *
 * Handles VCK generation for projects. This is the core of Kahuna's value proposition:
 * transforming user context into downloadable VCK packages for coding copilots.
 *
 * This service is isolated from HTTP/tRPC concerns for easier testing.
 */

import type { VCK } from "@kahuna/shared";
import { generateVCK } from "@kahuna/vck-templates";
import type { PrismaClient } from "@prisma/client";

/**
 * Options for VCK generation.
 */
export interface GenerateVCKOptions {
  /** Target framework (default: 'langgraph') */
  framework?: string;
  /** Copilot configuration (default: 'claude-code') */
  copilot?: string;
}

/**
 * Result from VCK generation including the VCK and database record.
 */
export interface GenerateVCKResult {
  /** The generated VCK */
  vck: VCK;
  /** The database record for this generation */
  generation: {
    id: string;
    projectId: string;
    framework: string;
    copilot: string;
    createdAt: Date;
  };
}

/**
 * Generate a VCK for a project.
 *
 * This function:
 * 1. Fetches the project with its context files
 * 2. Transforms context files into generator input
 * 3. Calls the VCK generator from @kahuna/vck-templates
 * 4. Stores a generation record in the database
 * 5. Returns both the VCK and the generation record
 *
 * @param prisma - Prisma client instance
 * @param projectId - ID of the project to generate VCK for
 * @param userId - ID of the requesting user (for ownership verification)
 * @param options - Optional generation options (framework, copilot)
 * @returns Generated VCK and database record
 * @throws Error if project not found or user doesn't own it
 */
export async function generateProjectVCK(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
  options: GenerateVCKOptions = {},
): Promise<GenerateVCKResult> {
  const { framework = "langgraph", copilot = "claude-code" } = options;

  // Fetch project with context files
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      contextFiles: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Verify ownership
  if (project.userId !== userId) {
    throw new Error("Access denied");
  }

  // Transform context files into generator input format (filename -> content)
  const contextFiles: Record<string, string> = {};
  for (const file of project.contextFiles) {
    contextFiles[file.filename] = file.content;
  }

  // Build business summary from context files
  // For Phase 1, we combine all context into a simple summary
  // Future phases may have a dedicated summary field in the project
  const businessSummary = buildBusinessSummary(
    project.name,
    project.contextFiles,
  );

  // Generate the VCK using the template generator
  const vck = generateVCK({
    projectId,
    contextFiles,
    businessSummary,
    framework,
    copilot,
  });

  // Store generation record in database
  const generation = await prisma.vckGeneration.create({
    data: {
      projectId,
      framework,
      copilot,
    },
  });

  return {
    vck,
    generation,
  };
}

/**
 * Get VCK generation history for a project.
 *
 * @param prisma - Prisma client instance
 * @param projectId - ID of the project
 * @param userId - ID of the requesting user (for ownership verification)
 * @returns List of VCK generations for the project
 * @throws Error if project not found or user doesn't own it
 */
export async function getVCKHistory(
  prisma: PrismaClient,
  projectId: string,
  userId: string,
) {
  // Verify project exists and user owns it
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.userId !== userId) {
    throw new Error("Access denied");
  }

  // Get generation history
  const generations = await prisma.vckGeneration.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });

  return generations;
}

/**
 * Get a specific VCK generation by ID.
 *
 * @param prisma - Prisma client instance
 * @param generationId - ID of the VCK generation
 * @param userId - ID of the requesting user (for ownership verification)
 * @returns The VCK generation record
 * @throws Error if generation not found or user doesn't own the parent project
 */
export async function getVCKGeneration(
  prisma: PrismaClient,
  generationId: string,
  userId: string,
) {
  const generation = await prisma.vckGeneration.findUnique({
    where: { id: generationId },
    include: {
      project: true,
    },
  });

  if (!generation) {
    throw new Error("VCK generation not found");
  }

  if (generation.project.userId !== userId) {
    throw new Error("Access denied");
  }

  // Return without the nested project to keep response clean
  const { project: _, ...generationData } = generation;
  return generationData;
}

/**
 * Build a business summary from project name and context files.
 * This is a simple Phase 1 implementation.
 */
function buildBusinessSummary(
  projectName: string,
  contextFiles: { filename: string; content: string }[],
): string {
  const parts: string[] = [`Project: ${projectName}`];

  if (contextFiles.length > 0) {
    parts.push(
      `\nContext files included: ${contextFiles.map((f) => f.filename).join(", ")}`,
    );
  } else {
    parts.push("\nNo context files provided yet.");
  }

  return parts.join("");
}
