/**
 * Onboarding Status Checker
 *
 * Checks if organization and project context files exist in the knowledge base.
 * Used by tools to gate or warn when onboarding is incomplete.
 *
 * Context files are created by:
 * - org-onboarding skill: creates "org-context.md" → slug "org-context"
 * - project-onboarding skill: creates "project-context-{hash}.md" → slug "project-context-{hash}"
 *
 * The project hash is the first 6 hex characters of an MD5 hash of the project path.
 */

import * as crypto from 'node:crypto';
import type { KnowledgeStorageService } from '../knowledge/storage/types.js';

/**
 * Result of checking onboarding status.
 */
export interface OnboardingStatus {
  /** Whether org context exists in KB */
  hasOrgContext: boolean;
  /** Whether project context exists for current directory */
  hasProjectContext: boolean;
  /** Slug of org context entry if found */
  orgContextSlug?: string;
  /** Slug of project context entry if found */
  projectContextSlug?: string;
  /** The expected project context slug based on current directory */
  expectedProjectSlug: string;
}

/**
 * Generate the project hash used in project context slugs.
 * Uses first 6 hex characters of MD5 hash of the project path.
 *
 * This matches the algorithm in project-onboarding/SKILL.md:
 * "Generate a short hash (6 characters) from the path"
 */
export function generateProjectHash(projectPath: string): string {
  const hash = crypto.createHash('md5').update(projectPath).digest('hex');
  return hash.substring(0, 6);
}

/**
 * Check if organization and project context files exist in the knowledge base.
 *
 * @param storage - Knowledge storage service instance
 * @param projectPath - Optional project path override (defaults to process.cwd())
 * @returns OnboardingStatus indicating what context exists
 */
export async function checkOnboardingStatus(
  storage: KnowledgeStorageService,
  projectPath?: string
): Promise<OnboardingStatus> {
  const cwd = projectPath ?? process.cwd();
  const projectHash = generateProjectHash(cwd);
  const expectedProjectSlug = `project-context-${projectHash}`;

  // Get all active entries
  const entries = await storage.list({ status: 'active' });

  // Find org context - look for slug starting with "org-context"
  const orgEntry = entries.find((entry) => entry.slug.startsWith('org-context'));

  // Find project context - look for exact match on expected slug
  const projectEntry = entries.find((entry) => entry.slug === expectedProjectSlug);

  return {
    hasOrgContext: !!orgEntry,
    hasProjectContext: !!projectEntry,
    orgContextSlug: orgEntry?.slug,
    projectContextSlug: projectEntry?.slug,
    expectedProjectSlug,
  };
}

/**
 * Build markdown response for missing org context.
 * Used as a hard gate in prepare_context.
 */
export function buildMissingOrgContextMarkdown(): string {
  return `# Organization Context Required

Before I can surface relevant context, I need to understand your organization.

**Say "set up org context"** to complete a quick 4-question onboarding.

<hints>
- This is a one-time setup that takes ~2 minutes
- Captures your industry, team structure, constraints, and priorities
- Helps Kahuna make recommendations aligned with your organization
</hints>`;
}

/**
 * Build markdown response for missing project context.
 * Used as a hard gate in prepare_context (after org context exists).
 */
export function buildMissingProjectContextMarkdown(): string {
  return `# Project Context Required

I have your organization context, but need context for this specific project.

**Say "set up project context"** to complete a quick 3-question onboarding.

<hints>
- Captures the problem, users, and success criteria for this project
- Takes ~2 minutes to complete
- Helps surface the most relevant knowledge for your task
</hints>`;
}

/**
 * Build hint text for missing context (soft warning for ask tool).
 * Returns empty string if both contexts exist.
 */
export function buildOnboardingHints(status: OnboardingStatus): string {
  const hints: string[] = [];

  if (!status.hasOrgContext) {
    hints.push('- Complete org onboarding with "set up org context" for better answers');
  }

  if (!status.hasProjectContext) {
    hints.push('- Complete project onboarding with "set up project context" for better answers');
  }

  return hints.join('\n');
}
