/**
 * Utility functions for local knowledge storage
 *
 * Handles slug generation, category mapping, and .mdc file parsing/generation.
 * See: docs/internal/tasks/mcp-mvp/design/local-storage-design.md
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { KnowledgeCategory, KnowledgeEntryFrontmatter } from './types.js';

/**
 * Generate URL-safe slug from title
 *
 * @param title - The title to convert to a slug
 * @returns Lowercase, hyphen-separated slug with special characters removed
 *
 * @example
 * generateSlug("API Design Guidelines") // "api-design-guidelines"
 * generateSlug("Hello, World!") // "hello-world"
 * generateSlug("  Multiple   Spaces  ") // "multiple-spaces"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Decompose unicode characters (é → e + combining accent)
    .replace(/\p{Mn}/gu, '') // Remove combining diacritical marks (Mark, Nonspacing)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars (keep alphanumeric, spaces, hyphens)
    .trim()
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
}

/**
 * Map AI categorizer output to design doc categories
 *
 * Current AI categories → Target categories:
 * - business-info → policy
 * - technical-info → reference
 * - code → pattern
 * - Unknown → context (fallback)
 *
 * @param aiCategory - Category from AI categorizer
 * @returns Mapped KnowledgeCategory
 */
export function mapCategory(aiCategory: string): KnowledgeCategory {
  switch (aiCategory.toLowerCase()) {
    case 'business-info':
      return 'policy';
    case 'technical-info':
      return 'reference';
    case 'code':
      return 'pattern';
    // Pass through valid categories
    case 'policy':
      return 'policy';
    case 'requirement':
      return 'requirement';
    case 'reference':
      return 'reference';
    case 'decision':
      return 'decision';
    case 'pattern':
      return 'pattern';
    case 'context':
      return 'context';
    default:
      return 'context'; // Fallback for unknown categories
  }
}

/**
 * Result of parsing an .mdc file
 */
export interface ParsedMdcFile {
  frontmatter: KnowledgeEntryFrontmatter;
  body: string;
}

/**
 * Parse .mdc file content into frontmatter and body
 *
 * .mdc format:
 * ```
 * ---
 * YAML frontmatter
 * ---
 *
 * Markdown content body
 * ```
 *
 * @param content - Raw .mdc file content
 * @returns Parsed frontmatter object and body string
 * @throws Error if frontmatter is missing or invalid
 */
export function parseMdcFile(content: string): ParsedMdcFile {
  // Match frontmatter between --- delimiters
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!frontmatterMatch) {
    throw new Error('Invalid .mdc file: missing frontmatter delimiters');
  }

  const frontmatterYaml = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length).trim();

  let frontmatter: KnowledgeEntryFrontmatter;
  try {
    frontmatter = parseYaml(frontmatterYaml) as KnowledgeEntryFrontmatter;
  } catch (error) {
    throw new Error(
      `Invalid .mdc file: failed to parse YAML frontmatter - ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Basic validation of required fields
  if (!frontmatter.type || frontmatter.type !== 'knowledge') {
    throw new Error('Invalid .mdc file: type must be "knowledge"');
  }
  if (!frontmatter.title) {
    throw new Error('Invalid .mdc file: missing required field "title"');
  }

  return { frontmatter, body };
}

/**
 * Generate .mdc file content from frontmatter and body
 *
 * @param frontmatter - YAML frontmatter object
 * @param body - Markdown content body
 * @returns Complete .mdc file content string
 */
export function generateMdcFile(frontmatter: KnowledgeEntryFrontmatter, body: string): string {
  const yamlContent = stringifyYaml(frontmatter, {
    lineWidth: 0, // Don't wrap long lines
    defaultStringType: 'PLAIN', // Use plain strings when possible
    defaultKeyType: 'PLAIN',
  });

  return `---\n${yamlContent}---\n\n${body}`;
}
