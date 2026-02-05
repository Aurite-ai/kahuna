/**
 * Custom error classes for file categorization and splitting
 */

/**
 * Base error class for hybrid file splitting errors
 */
export class HybridSplitError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'HybridSplitError';
    Object.setPrototypeOf(this, HybridSplitError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

/**
 * Error when file cannot be split cleanly and needs manual review
 */
export class ManualReviewRequiredError extends HybridSplitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'MANUAL_REVIEW_REQUIRED', details);
    this.name = 'ManualReviewRequiredError';
    Object.setPrototypeOf(this, ManualReviewRequiredError.prototype);
  }
}

/**
 * Error when split section is still hybrid after splitting
 */
export class NestedHybridError extends HybridSplitError {
  constructor(filename: string, sectionIndex: number, depth: number) {
    super(
      `Section ${sectionIndex} of ${filename} is still hybrid after ${depth} split attempts`,
      'NESTED_HYBRID',
      { filename, sectionIndex, depth }
    );
    this.name = 'NestedHybridError';
    Object.setPrototypeOf(this, NestedHybridError.prototype);
  }
}

/**
 * Error when file content is empty
 */
export class EmptyContentError extends HybridSplitError {
  constructor(message = 'Cannot process empty file content') {
    super(message, 'EMPTY_CONTENT');
    this.name = 'EmptyContentError';
    Object.setPrototypeOf(this, EmptyContentError.prototype);
  }
}

/**
 * Error when file appears to be binary rather than text
 */
export class BinaryContentError extends HybridSplitError {
  constructor(filename: string, binaryRatio: number) {
    super(
      `File ${filename} appears to be binary (${Math.round(binaryRatio * 100)}% non-text characters)`,
      'BINARY_CONTENT',
      { filename, binaryRatio }
    );
    this.name = 'BinaryContentError';
    Object.setPrototypeOf(this, BinaryContentError.prototype);
  }
}

/**
 * Error when file is too short to meaningfully split
 */
export class InsufficientContentError extends HybridSplitError {
  constructor(contentLength: number, minimumRequired: number) {
    super(
      `File too short to split (${contentLength} chars, minimum ${minimumRequired} required)`,
      'INSUFFICIENT_CONTENT',
      { contentLength, minimumRequired }
    );
    this.name = 'InsufficientContentError';
    Object.setPrototypeOf(this, InsufficientContentError.prototype);
  }
}

/**
 * Error when splitting produces too many sections
 */
export class TooManySegmentsError extends HybridSplitError {
  constructor(segmentCount: number, maxAllowed: number) {
    super(
      `File split into too many sections (${segmentCount}, max ${maxAllowed} allowed)`,
      'TOO_MANY_SEGMENTS',
      { segmentCount, maxAllowed }
    );
    this.name = 'TooManySegmentsError';
    Object.setPrototypeOf(this, TooManySegmentsError.prototype);
  }
}

/**
 * Error when a split section exceeds token limits
 */
export class SplitSizeError extends HybridSplitError {
  constructor(sectionIndex: number, tokenCount: number, limit: number) {
    super(
      `Split section ${sectionIndex} exceeds token limit (${tokenCount} tokens, max ${limit})`,
      'SPLIT_SIZE_EXCEEDED',
      { sectionIndex, tokenCount, limit }
    );
    this.name = 'SplitSizeError';
    Object.setPrototypeOf(this, SplitSizeError.prototype);
  }
}

/**
 * Error when file is unsplittable (content is truly interwoven)
 */
export class UnsplittableHybridError extends HybridSplitError {
  constructor(filename: string, reason: string) {
    super(`File ${filename} cannot be cleanly split: ${reason}`, 'UNSPLITTABLE_HYBRID', {
      filename,
      reason,
    });
    this.name = 'UnsplittableHybridError';
    Object.setPrototypeOf(this, UnsplittableHybridError.prototype);
  }
}

/**
 * Error when split validation fails
 */
export class SplitValidationError extends HybridSplitError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SPLIT_VALIDATION_FAILED', details);
    this.name = 'SplitValidationError';
    Object.setPrototypeOf(this, SplitValidationError.prototype);
  }
}
