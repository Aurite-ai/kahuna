/**
 * Utility functions for file categorization
 */

import { FILE_SIZE_LIMITS } from './types.js';

/**
 * Custom error for file size violations
 */
export class FileSizeError extends Error {
  constructor(
    public fileSize: number,
    public limit: number
  ) {
    super(
      `File too large for categorization (${Math.round(fileSize / 1024)}KB). Maximum allowed: ${Math.round(limit / 1024)}KB. Please split into smaller files.`
    );
    this.name = 'FileSizeError';
  }
}

/**
 * Validate file size and throw error if too large
 */
export function validateFileSize(content: string, maxSize?: number): void {
  const size = content.length;
  const limit = maxSize ?? FILE_SIZE_LIMITS.HARD_LIMIT;

  if (size > limit) {
    throw new FileSizeError(size, limit);
  }
}

/**
 * Check if file size exceeds soft limit (warning threshold)
 */
export function exceedsSoftLimit(content: string): boolean {
  return content.length > FILE_SIZE_LIMITS.SOFT_LIMIT;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)}KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Estimate token count from character count (rough approximation)
 * ~4 characters per token on average
 */
export function estimateTokenCount(content: string): number {
  return Math.ceil(content.length / 4);
}
