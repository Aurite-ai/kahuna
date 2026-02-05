# Hybrid File Classification Implementation

## Overview

This document explains how the hybrid file classification system works in the file-router package.

## What Problem Does This Solve?

Previously, when a file contained mixed content from multiple categories, the system was forced to choose one primary category. This meant valuable context was lost.

The hybrid classification system solves this by:
1. **Detecting** files with mixed content from 2+ categories (30-70% split)
2. **Splitting** them into separate sections
3. **Re-classifying** each section independently
4. **Tracking** relationships between split sections

**Supported Combinations:**
- ✅ `business-info` + `technical-info`
- ✅ `business-info` + `code`
- ✅ `technical-info` + `code`
- ✅ `business-info` + `technical-info` + `code` (three-way hybrids)

## Architecture

### Two-Stage Pipeline

**Stage 1: Initial Classification**
- File is analyzed by Claude
- Categorized into: `business-info`, `technical-info`, `code`, or `hybrid`
- Returns confidence score and reasoning
- **Hybrid threshold**: Content must be 30-70% split between categories

**Stage 2: Content Splitting** (only for hybrid files)
- Claude intelligently identifies section boundaries
- Splits content into 2-5 sections
- Each section is re-classified independently
- Returns multiple `ContentSplit` objects with metadata

## Usage

### Basic Usage

```typescript
import { categorizeWithHybridSupport } from '@kahuna/file-router';

const result = await categorizeWithHybridSupport('myfile.md', fileContent);

if (result.type === 'single') {
  // Normal file - single category
  console.log(result.result.category);
  console.log(result.result.confidence);
} else {
  // Hybrid file - multiple sections
  for (const split of result.result.splits) {
    console.log(`${split.sectionTitle}: ${split.category}`);
  }
}
```

### Lower-Level APIs

```typescript
import { categorizeFile, splitHybridFile } from '@kahuna/file-router';

// Step 1: Initial classification
const classification = await categorizeFile('file.md', content);

if (classification.category === 'hybrid') {
  // Step 2: Split if hybrid
  const splitResult = await splitHybridFile('file.md', content);
  console.log(`Split into ${splitResult.splits.length} sections`);
}
```

### Options

```typescript
const result = await categorizeWithHybridSupport('file.md', content, {
  // Categorization options
  apiKey: 'your-api-key', // Optional, uses ANTHROPIC_API_KEY env var
  maxFileSize: 400000, // Max chars (default: 400k)
  
  // Split options
  minSectionSize: 100, // Min chars per section (default: 100)
  maxSections: 5, // Max splits allowed (default: 5)
  preserveContext: true, // Keep overlap between sections (default: true)
  maxSplitDepth: 2, // Max recursion for nested hybrids (default: 2)
  
  // Behavior options
  autoSplitHybrid: true, // Auto-split hybrids (default: true)
  throwOnSplitError: false, // Return fallback on error (default: false)
});
```

## Edge Cases Handled

### 1. Unsplittable Hybrid
**Problem:** Content is truly interwoven and can't be separated

**Solution:** Returns as single file with `unsplittable` tag and warning

### 2. Nested Hybrid
**Problem:** After splitting, a section is still 50/50

**Solution:** 
- Recursively splits up to `maxSplitDepth` times (default: 2)
- If still hybrid, throws `NestedHybridError` requiring manual review

### 3. False Hybrid
**Problem:** Classifier says hybrid, but it's actually 95% one type

**Solution:** Returns warning with `FALSE_HYBRID_DETECTED` code and recommended category

### 4. Too Many Sections
**Problem:** File splits into 20+ sections

**Solution:** 
- Merges similar adjacent sections
- If still too many, throws `TooManySegmentsError`

### 5. Tiny Sections
**Problem:** Split creates 20-character "sections"

**Solution:** Automatically merges with adjacent section if below `minSectionSize`

### 6. Empty/Binary Content
**Problem:** User submits empty file or binary data

**Solution:** 
- `EmptyContentError` for empty files
- `BinaryContentError` for binary content (>30% control characters)

### 7. Insufficient Content
**Problem:** File too short to meaningfully split (< 200 chars)

**Solution:** Throws `InsufficientContentError`

### 8. Token Limit Exceeded
**Problem:** Split section still exceeds token limits

**Solution:** Throws `SplitSizeError` with section details

## Error Handling

### Error Types

All errors extend `HybridSplitError` with these properties:
- `code`: Error code (e.g., 'NESTED_HYBRID')
- `message`: Human-readable message
- `details`: Additional context

### Error Strategies

**Graceful Degradation:**
```typescript
// With throwOnSplitError: false (default)
const result = await categorizeWithHybridSupport(filename, content);
// Returns fallback classification if split fails
```

**Strict Mode:**
```typescript
// With throwOnSplitError: true
try {
  const result = await categorizeWithHybridSupport(filename, content, {
    throwOnSplitError: true
  });
} catch (error) {
  if (error instanceof NestedHybridError) {
    // Handle nested hybrid - needs manual review
  }
}
```

## Result Types

### Single Result
```typescript
{
  type: 'single',
  result: {
    category: 'business-info' | 'technical-info' | 'code' | 'hybrid',
    confidence: 0.9,
    reasoning: 'This file contains...',
    metadata: {
      tags: ['authentication', 'api'],
      topics: ['JWT', 'OAuth'],
      summary: 'Documentation for authentication API...'
    }
  }
}
```

### Split Result
```typescript
{
  type: 'split',
  result: {
    splits: [
      {
        splitId: 'uuid-1',
        originalFilename: 'payment-spec.md',
        sectionIndex: 1,
        sectionTitle: 'Business Requirements',
        content: '...',
        category: 'business-info',
        confidence: 0.85,
        reasoning: 'Contains business goals and metrics',
        startLine: 1,
        endLine: 25,
        metadata: { ... }
      },
      {
        splitId: 'uuid-2',
        originalFilename: 'payment-spec.md',
        sectionIndex: 2,
        sectionTitle: 'API Implementation',
        content: '...',
        category: 'technical-info',
        confidence: 0.9,
        reasoning: 'Contains API specs and database schema',
        startLine: 26,
        endLine: 75,
        metadata: { ... }
      }
    ],
    warnings: [
      {
        code: 'FALSE_HYBRID_DETECTED',
        message: 'File appears to be primarily technical-info (85%)',
        details: { distribution: {...}, recommendedCategory: 'technical-info' }
      }
    ],
    originalClassification: {
      category: 'hybrid',
      confidence: 1.0,
      reasoning: 'File was classified as hybrid and successfully split'
    }
  }
}
```

## Helper Functions

### Get Statistics
```typescript
import { getCategorizeStats } from '@kahuna/file-router';

const stats = getCategorizeStats(result);
// {
//   type: 'split',
//   categories: { 'business-info': 1, 'technical-info': 1 },
//   totalSections: 2,
//   averageConfidence: 0.875,
//   hasWarnings: true,
//   warningCodes: ['FALSE_HYBRID_DETECTED']
// }
```

### Extract All Content
```typescript
import { extractAllContent } from '@kahuna/file-router';

const allSplits = extractAllContent(result);
// Returns ContentSplit[] regardless of result type
```

## Database Storage

To store split files, track relationships:

```prisma
model FileRecord {
  id            String   @id @default(cuid())
  originalName  String
  category      String
  isHybrid      Boolean  @default(false)
  isSplit       Boolean  @default(false)
  splitParentId String?
  splitIndex    Int?
  content       String
  metadata      Json
  
  splitParent   FileRecord?  @relation("SplitRelation", fields: [splitParentId])
  splitChildren FileRecord[] @relation("SplitRelation")
}
```

## Testing

Run the test suite:

```bash
cd packages/file-router
ANTHROPIC_API_KEY=your-key npx tsx test-hybrid.ts
```

### Test Cases

1. **Hybrid Document**: Payment requirements with business goals + API specs
2. **Pure Business**: Marketing strategy document
3. **Pure Technical**: API documentation

## How the 30-70% Threshold Works

The prompt guides Claude to use "hybrid" only when:
- Content is 30-70% split between business and technical
- Both aspects are substantial and can't be ignored
- File contains distinct sections serving different purposes

**Examples:**

✅ **Should be Hybrid:**
- Product spec with business requirements (40%) + implementation details (60%)
- Architecture doc with business context (35%) + technical design (65%)

❌ **Should NOT be Hybrid:**
- Technical doc with minor business context (5% business, 95% technical) → `technical-info`
- Business doc mentioning some tech (90% business, 10% technical) → `business-info`
- Code file with extensive comments (95% code, 5% docs) → `code`

## Current Behavior

The system is **conservative** about hybrid classification:
- Requires clear 30-70% split
- Defaults to primary category if one dominates (>70%)
- Avoids false positives (incorrectly calling something hybrid)

This means some files you might expect to be hybrid will be classified as their dominant category. This is **by design** and can be tuned by adjusting the threshold in the prompt.

## Future Enhancements

1. **Embedding-based pre-screening**: Use embeddings to quickly identify candidates for hybrid classification
2. **Confidence thresholds**: Adjust hybrid threshold based on confidence scores
3. **Custom categories**: Allow domain-specific category definitions
4. **Parallel splitting**: Process multiple sections concurrently
5. **Split preview**: Return split preview before full classification
6. **Manual review queue**: Integration with review/approval system

## Files Created

- `src/types.ts` - Type definitions for hybrid support
- `src/errors.ts` - Custom error classes
- `src/splitter.ts` - Content splitting logic
- `src/orchestrator.ts` - Main orchestration function
- `src/prompts.ts` - Updated prompts with hybrid guidance
- `src/categorizer.ts` - Updated tool schema
- `src/index.ts` - Updated exports
- `test-hybrid.ts` - Test suite

## Summary

The hybrid classification system provides:
- ✅ Automatic detection of mixed-content files
- ✅ Intelligent content splitting
- ✅ Section-level re-classification
- ✅ Comprehensive edge case handling
- ✅ Graceful error recovery
- ✅ Detailed warnings and metadata
- ✅ Full type safety
- ✅ Production-ready error handling

The system is conservative and will only classify files as hybrid when there's a clear 30-70% split, preventing false positives while ensuring truly mixed files are properly handled.
