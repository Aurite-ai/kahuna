/**
 * VCK Generator
 *
 * Pure function that assembles a VCK from context and templates.
 * Isolated from HTTP concerns for easy testing.
 */

import {
  getCopilotConfigFiles,
  getCopilotConfigTemplate,
  getFrameworkFiles,
  getFrameworkTemplate,
} from './templates.js';
import type { VCK } from './types.js';
import type { VCKGeneratorInput } from './types.js';

/**
 * VCK format version.
 * Increment when the structure changes.
 */
const VCK_VERSION = '1.0.0';

/**
 * Generate a VCK from user context and templates.
 *
 * This is a pure function: given the same inputs, it produces the same output.
 * It does not perform any I/O operations.
 *
 * @param input - Generation input including context files and options
 * @returns Complete VCK structure
 * @throws Error if specified framework or copilot is not found
 */
export function generateVCK(input: VCKGeneratorInput): VCK {
  const {
    projectId,
    contextFiles,
    businessSummary,
    framework = 'langgraph',
    copilot = 'claude-code',
  } = input;

  // Validate framework exists
  const frameworkTemplate = getFrameworkTemplate(framework);
  if (!frameworkTemplate) {
    throw new Error(`Unknown framework: ${framework}. Available: langgraph`);
  }

  // Validate copilot exists
  const copilotTemplate = getCopilotConfigTemplate(copilot);
  if (!copilotTemplate) {
    throw new Error(`Unknown copilot: ${copilot}. Available: claude-code`);
  }

  // Get template files
  const copilotFiles = getCopilotConfigFiles(copilot);
  const frameworkFiles = getFrameworkFiles(framework);

  // Build boilerplate from framework files
  const boilerplate: Record<string, string> = {};
  for (const file of frameworkFiles) {
    boilerplate[file.path] = file.content;
  }

  // Add all copilot config files to boilerplate
  for (const file of copilotFiles) {
    boilerplate[file.path] = file.content;
  }

  // Construct the VCK
  // Note: rules array is empty because all rules are now in boilerplate as files
  const vck: VCK = {
    metadata: {
      projectId,
      generatedAt: new Date().toISOString(),
      version: VCK_VERSION,
    },
    context: {
      businessSummary,
      files: contextFiles,
    },
    rules: [],
    boilerplate,
  };

  return vck;
}

/**
 * Validate VCK generator input.
 * Returns an array of validation error messages, or empty array if valid.
 */
export function validateGeneratorInput(input: Partial<VCKGeneratorInput>): string[] {
  const errors: string[] = [];

  if (!input.projectId || typeof input.projectId !== 'string') {
    errors.push('projectId is required and must be a string');
  }

  if (!input.contextFiles || typeof input.contextFiles !== 'object') {
    errors.push('contextFiles is required and must be an object');
  }

  if (typeof input.businessSummary !== 'string') {
    errors.push('businessSummary is required and must be a string');
  }

  if (input.framework !== undefined) {
    if (!getFrameworkTemplate(input.framework)) {
      errors.push(`Unknown framework: ${input.framework}`);
    }
  }

  if (input.copilot !== undefined) {
    if (!getCopilotConfigTemplate(input.copilot)) {
      errors.push(`Unknown copilot: ${input.copilot}`);
    }
  }

  return errors;
}
