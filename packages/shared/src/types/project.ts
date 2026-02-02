/**
 * Project and context file type definitions
 *
 * Projects are the anchor for all feedback loop content.
 * Context files contain user's business information that gets included in VCKs.
 */

import type { UserId } from './user.js';

/**
 * Project - container for user's work in the feedback loop.
 * All context files, VCK generations, and build results are scoped to a project.
 */
export interface Project {
  id: string;
  userId: UserId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new project.
 */
export interface CreateProjectInput {
  name: string;
}

/**
 * Context file - user-provided business context stored with a project.
 * These files are included in VCKs to give copilots business context.
 */
export interface ContextFile {
  id: string;
  projectId: string;
  filename: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for uploading a context file.
 */
export interface UploadContextFileInput {
  projectId: string;
  filename: string;
  content: string;
}

/**
 * Build result - outcome from an agent build attempt.
 * Captures conversation logs and results as the learning signal.
 */
export interface BuildResult {
  id: string;
  projectId: string;
  content: string; // JSON blob containing logs, notes, etc.
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for uploading build results.
 */
export interface UploadBuildResultInput {
  projectId: string;
  content: string;
}
