# Encoding Subsystem Design

**Type:** Subsystem Design Document
**Date:** 2026-03-08
**Status:** Draft (v1.0)
**Purpose:** Define the Encoding subsystem — transformation of raw input into storable KB entries with metadata

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture (subsystem boundaries, contracts)
- [`00-common-schemas.md`](00-common-schemas.md) — Episode Schema, Salience Architecture
- [`01-storage.md`](01-storage.md) — Storage interface (Encoding calls Storage)
- [`llm-agent-model.md`](../04-foundations/llm-agent-model.md) — GRSO framework for agent design

---

## Executive Summary

The Encoding subsystem transforms raw input into storable KB entries. It operates at the boundary between external information (user input, episodes from consolidation, system-generated content) and the Knowledge Base.

**Core Responsibilities:**
- Accept input from multiple sources (learn tool, consolidation, system)
- Categorize content (using provided category or inferring via LLM)
- Compute initial salience scores based on source type and signals
- Format content into KB entry structure
- Generate embeddings for semantic search
- Call Storage to persist entries

**Bayesian Role:** Prior expansion — adding new hypotheses to P(H). Each new entry extends the hypothesis space available for inference.

**G-Level:** G0 (substrate creation) + G3 (categorizing as rules/strategies). Raw input becomes structured knowledge.

---

## Part 1: Component Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENCODING SUBSYSTEM                                            │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           PUBLIC API LAYER                                       │   │
│   │                                                                                   │   │
│   │   encode_user_input()   encode_episode()   encode_system_entry()                 │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                  │
│              ┌─────────────────────────┼─────────────────────────┐                       │
│              │                         │                         │                       │
│              ▼                         ▼                         ▼                       │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐          │
│   │    CATEGORIZER      │   │  INITIAL SALIENCE   │   │   ENTRY FORMATTER   │          │
│   │                     │   │     COMPUTER        │   │                     │          │
│   │ • Category inference│   │ • Factor computation│   │ • Markdown structure│          │
│   │ • LLM-based when    │   │ • Source weighting  │   │ • Frontmatter gen   │          │
│   │   category absent   │   │ • Signal processing │   │ • Content assembly  │          │
│   │ • Validation        │   │                     │   │ • ID generation     │          │
│   │                     │   │                     │   │                     │          │
│   └──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘          │
│              │                         │                         │                       │
│              └─────────────────────────┴─────────────────────────┘                       │
│                                        │                                                  │
│                                        ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         EMBEDDING GENERATOR                                       │   │
│   │                                                                                   │   │
│   │   • Text preparation (title + tags + content)                                     │   │
│   │   • Embedding computation (via Storage's embedding service)                       │   │
│   │   • Delegates to Storage for actual embedding + storage                           │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                  │
│                                        ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                              STORAGE                                              │   │
│   │                           store_entry()                                           │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### Categorizer

**Purpose:** Assign or validate categories for new content.

| Responsibility | Description |
|----------------|-------------|
| **Category Validation** | Check if provided category is valid (in taxonomy) |
| **Category Inference** | Use LLM to infer category when not provided |
| **Fallback Handling** | Assign default category when inference fails |
| **Tag Extraction** | Extract or generate relevant tags |

**Owns:**
- Categorization LLM agent (GRSO-structured)
- Category validation logic
- Default category rules

#### Initial Salience Computer

**Purpose:** Calculate starting salience scores for new entries.

| Responsibility | Description |
|----------------|-------------|
| **Factor Computation** | Compute each salience factor (source_type, confidence, explicit_signal) |
| **Weighted Combination** | Apply factor weights per Salience Architecture |
| **Signal Processing** | Interpret user signals (importance hints, explicit boosts) |
| **Source Weighting** | Apply source-type-specific weights |

**Owns:**
- Initial salience formula
- Source type weights
- Signal interpretation rules

#### Entry Formatter

**Purpose:** Structure content into KB entry format.

| Responsibility | Description |
|----------------|-------------|
| **ID Generation** | Create unique entry IDs |
| **Content Assembly** | Combine title, content, metadata into markdown |
| **Frontmatter Generation** | Create YAML frontmatter with all metadata |
| **Title Extraction** | Extract or generate title from content |

**Owns:**
- Entry ID format
- Markdown structure
- Frontmatter schema

#### Embedding Generator

**Purpose:** Prepare content for embedding and coordinate with Storage.

| Responsibility | Description |
|----------------|-------------|
| **Text Preparation** | Compose text for embedding (title + tags + content) |
| **Delegation** | Pass prepared content to Storage for actual embedding |

**Note:** The actual embedding computation happens in Storage (per Storage design v2.0). Encoding prepares the text; Storage generates and stores the embedding.

---

## Part 2: Data Structures

### 2.1 Input Types

#### User Input (from kahuna_learn tool)

```typescript
interface UserLearnInput {
  // === Required ===
  content: string;               // The knowledge to store

  // === Optional (user-provided) ===
  title?: string;                // Entry title
  category?: string;             // Category (validated, or inferred if absent)
  tags?: string[];               // Classification tags
  importance?: 'high' | 'medium' | 'low';  // User importance signal

  // === Context (auto-captured) ===
  session_id: string;            // Current session ID
  mode?: string;                 // Current copilot mode
}
```

#### Episode Input (from Consolidation)

```typescript
// Episode schema from 00-common-schemas.md
interface EpisodeInput {
  episode: Episode;              // Full episode from Extraction agent
  session_id: string;            // Source session
}

// Reference: Episode type from common-schemas
interface Episode {
  id: string;
  session_id: string;
  type: EpisodeType;             // decision | error | pattern | preference | fact | correction
  content: string;
  context: string;
  source: {
    turn_range: [number, number];
    timestamp: string;
    actor: 'user' | 'assistant';
    explicit: boolean;
  };
  confidence: number;
  confidence_rationale: string;
  supersedes?: string;
  related_topics?: string[];
}
```

#### System Input (system-generated entries)

```typescript
interface SystemInput {
  // === Required ===
  content: string;               // Entry content
  title: string;                 // Entry title
  category: string;              // Must be valid category

  // === System metadata ===
  source_type: 'system';
  source_ref: string;            // What generated this (e.g., "initialization", "migration")

  // === Optional ===
  tags?: string[];
  confidence?: number;           // Default: 0.8
  salience?: number;             // Default: 0.5
  pinned?: boolean;              // Default: false
}
```

### 2.2 Output Type

```typescript
interface EncodingResult {
  // === Success data ===
  entry_id: string;              // Generated entry ID
  file_path: string;             // Where entry was stored
  indexed: boolean;              // Whether semantic index was updated

  // === Computed metadata ===
  category: string;              // Assigned (provided or inferred)
  salience: number;              // Computed initial salience
  confidence: number;            // Entry confidence

  // === Diagnostics ===
  category_inferred: boolean;    // True if category was inferred by LLM
  inference_confidence?: number; // If inferred, how confident was the inference
}

interface EncodingError {
  code: EncodingErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

type EncodingErrorCode =
  | 'INVALID_CONTENT'           // Content empty or unparseable
  | 'INVALID_CATEGORY'          // Category not in taxonomy
  | 'CATEGORIZATION_FAILED'     // LLM inference failed
  | 'STORAGE_FAILED'            // Storage.store_entry failed
  | 'EMBEDDING_FAILED';         // Embedding generation failed
```

### 2.3 Internal Structures

#### Categorization Result

```typescript
interface CategorizationResult {
  category: string;              // Primary category
  inferred: boolean;             // True if LLM-inferred, false if user-provided
  confidence: number;            // 0.0-1.0, how confident (1.0 if user-provided)
  suggested_tags: string[];      // Tags suggested during categorization
  reasoning?: string;            // LLM reasoning (for debugging)
}
```

#### Salience Computation Result

```typescript
interface SalienceResult {
  salience: number;              // Final salience score (0.0-1.0)
  factors: {
    source_type: number;
    confidence: number;
    explicit_signal: number;
  };
  weights_used: {
    source_type: number;
    confidence: number;
    explicit_signal: number;
  };
}
```

---

## Part 3: Public API

### 3.1 encode_user_input

Encode content from the kahuna_learn tool.

```typescript
interface EncodeUserInputParams {
  content: string;
  title?: string;
  category?: string;
  tags?: string[];
  importance?: 'high' | 'medium' | 'low';
  session_id: string;
  mode?: string;
}

async function encode_user_input(
  params: EncodeUserInputParams
): Promise<EncodingResult>;
```

**Flow:**
1. Validate content is non-empty
2. Extract or use provided title
3. Categorize (validate provided category, or infer via LLM)
4. Compute initial salience (source_type = 'user_explicit')
5. Compute confidence (high for user input: 0.85-0.95)
6. Format entry with frontmatter
7. Call Storage.store_entry
8. Return result

**Preconditions:**
- Content is non-empty string
- session_id is valid

**Postconditions:**
- Entry exists in KB
- Entry is indexed for semantic search
- Entry has computed salience and confidence

---

### 3.2 encode_episode

Encode an episode from the Consolidation pipeline.

```typescript
interface EncodeEpisodeParams {
  episode: Episode;
  category_override?: string;    // Integration agent may suggest category
  related_entries?: string[];    // IDs of related KB entries
  supersedes?: string;           // Entry ID this replaces (for corrections)
}

async function encode_episode(
  params: EncodeEpisodeParams
): Promise<EncodingResult>;
```

**Flow:**
1. Map episode.type to category (if no override)
2. Use episode.confidence as entry confidence
3. Compute initial salience based on episode source
4. Format entry with episode context
5. Set source_type based on episode.source.explicit
6. Call Storage.store_entry
7. Return result

**Episode Type → Category Mapping:**

| Episode Type | Default Category | Rationale |
|--------------|------------------|-----------|
| `decision` | `decisions` | Architectural/design decisions |
| `error` | `errors` | Mistakes and corrections |
| `pattern` | `patterns` | Recurring approaches |
| `preference` | `preferences` | User preferences |
| `fact` | `facts` | Factual knowledge |
| `correction` | `errors` | Corrections to prior knowledge |

---

### 3.3 encode_system_entry

Encode system-generated entries.

```typescript
interface EncodeSystemEntryParams {
  content: string;
  title: string;
  category: string;
  tags?: string[];
  source_ref: string;
  confidence?: number;
  salience?: number;
  pinned?: boolean;
}

async function encode_system_entry(
  params: EncodeSystemEntryParams
): Promise<EncodingResult>;
```

**Flow:**
1. Validate category
2. Use provided confidence/salience or defaults
3. Format entry
4. Call Storage.store_entry
5. Return result

**Use Cases:**
- Initial KB seeding during project setup
- Migration from external sources
- Default entries created during initialization

---

## Part 4: Categorizer Design

### 4.1 Category Taxonomy

From Storage design, default categories:

```typescript
const DEFAULT_CATEGORIES = [
  'patterns',      // Recurring approaches and conventions
  'decisions',     // Explicit architectural/design decisions
  'preferences',   // User preferences and style guidelines
  'facts',         // Factual project knowledge
  'errors',        // Mistakes and corrections
  'context',       // Project context and environment
] as const;
```

Categories may be extended via runtime configuration (see Storage Part 6.2).

### 4.2 Categorization Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CATEGORIZATION FLOW                                   │
│                                                                          │
│   Input                                                                  │
│     │                                                                    │
│     ▼                                                                    │
│   ┌─────────────────┐     Yes     ┌─────────────────┐                   │
│   │ Category        │────────────▶│ Validate        │                   │
│   │ provided?       │             │ category        │                   │
│   └────────┬────────┘             └────────┬────────┘                   │
│            │ No                            │                             │
│            ▼                               │                             │
│   ┌─────────────────┐                      │                             │
│   │ LLM Inference   │                      │                             │
│   │ (Categorizer    │                      │                             │
│   │  Agent)         │                      │                             │
│   └────────┬────────┘                      │                             │
│            │                               │                             │
│            ▼                               │                             │
│   ┌─────────────────┐                      │                             │
│   │ Inference       │                      │                             │
│   │ confidence      │                      │                             │
│   │ >= 0.6?         │                      │                             │
│   └────────┬────────┘                      │                             │
│       │         │                          │                             │
│      Yes        No                         │                             │
│       │         │                          │                             │
│       │         ▼                          │                             │
│       │   ┌─────────────────┐              │                             │
│       │   │ Use fallback    │              │                             │
│       │   │ category:       │              │                             │
│       │   │ 'facts'         │              │                             │
│       │   └────────┬────────┘              │                             │
│       │            │                       │                             │
│       └────────────┴───────────────────────┘                             │
│                    │                                                     │
│                    ▼                                                     │
│            ┌─────────────────┐                                          │
│            │ Categorization  │                                          │
│            │ Result          │                                          │
│            └─────────────────┘                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Categorizer Agent (GRSO Structure)

Following the LLM Agent Model's GRSO framework:

```markdown
# Agent: Categorizer

## Goal
Classify knowledge content into exactly one of the available categories.
Produce a category assignment with confidence score and optional tag suggestions.

## Rules
- MUST output exactly one category from the provided list
- MUST output confidence as a number between 0.0 and 1.0
- MUST NOT invent new categories
- If content spans multiple categories, choose the PRIMARY one
- If truly ambiguous, prefer 'facts' as the safest default

## Strategies
- Look for decision indicators: "we decided", "the approach is", "we chose"
  → Category: decisions
- Look for error indicators: "that's wrong", "actually", "correction", "mistake"
  → Category: errors
- Look for pattern indicators: "we always", "the convention is", "pattern", "approach"
  → Category: patterns
- Look for preference indicators: "I prefer", "better to", "style", "should always"
  → Category: preferences
- Look for factual indicators: "the API is", "port 3000", "configured as", "uses X"
  → Category: facts
- Look for context indicators: "this project", "the environment", "our setup"
  → Category: context

## Opening
Given the content below, determine:
1. The most appropriate category from: [list categories]
2. Your confidence in this categorization (0.0-1.0)
3. Suggested tags (2-5 relevant keywords)
4. Brief reasoning for your choice (one sentence)
```

### 4.4 Categorizer Implementation

```typescript
interface CategorizerInput {
  content: string;
  title?: string;
  context?: string;               // Additional context (e.g., session mode)
  available_categories: string[]; // Valid categories
}

interface CategorizerOutput {
  category: string;
  confidence: number;
  suggested_tags: string[];
  reasoning: string;
}

async function categorize_content(
  input: CategorizerInput
): Promise<CategorizationResult> {
  // If user provided a valid category, use it
  if (input.provided_category) {
    if (isValidCategory(input.provided_category)) {
      return {
        category: input.provided_category,
        inferred: false,
        confidence: 1.0,
        suggested_tags: [],
      };
    }
    // Invalid category - fall through to inference
  }

  // Use LLM for inference
  const prompt = buildCategorizerPrompt(input);
  const response = await llm.complete(prompt);
  const parsed = parseCategorizerResponse(response);

  // Validate inferred category
  if (!isValidCategory(parsed.category)) {
    // Fallback
    return {
      category: 'facts',
      inferred: true,
      confidence: 0.3,
      suggested_tags: [],
      reasoning: 'Fallback due to invalid inference',
    };
  }

  // Check confidence threshold
  if (parsed.confidence < CATEGORIZATION_CONFIDENCE_THRESHOLD) {
    return {
      category: 'facts',  // Safe fallback
      inferred: true,
      confidence: parsed.confidence,
      suggested_tags: parsed.suggested_tags,
      reasoning: `Low confidence (${parsed.confidence}), defaulting to facts`,
    };
  }

  return {
    category: parsed.category,
    inferred: true,
    confidence: parsed.confidence,
    suggested_tags: parsed.suggested_tags,
    reasoning: parsed.reasoning,
  };
}

const CATEGORIZATION_CONFIDENCE_THRESHOLD = 0.6;
```

---

## Part 5: Initial Salience Computation

### 5.1 Salience Architecture Reference

From [`00-common-schemas.md`](00-common-schemas.md) Part 3, the full salience computation uses 5 factors. However, at encoding time, only **3 factors** are applicable:

| Factor | At Encoding? | Value Source |
|--------|--------------|--------------|
| `source_type` | ✅ Yes | Input source (user, episode, system) |
| `recency` | ❌ No | Always 1.0 (just created) |
| `access_frequency` | ❌ No | Always 0.0 (never accessed) |
| `explicit_signal` | ✅ Yes | User importance hint, pinned status |
| `confidence` | ✅ Yes | Entry confidence score |

### 5.2 Initial Salience Formula

```typescript
interface InitialSalienceInput {
  source_type: SourceType;
  confidence: number;            // 0.0-1.0
  user_importance?: 'high' | 'medium' | 'low';
  pinned?: boolean;
}

function compute_initial_salience(input: InitialSalienceInput): SalienceResult {
  // === Factor 1: Source Type ===
  const sourceTypeFactor = SOURCE_TYPE_WEIGHTS[input.source_type];

  // === Factor 2: Confidence ===
  const confidenceFactor = input.confidence;

  // === Factor 3: Explicit Signal ===
  let explicitSignalFactor = 0.5; // Default: neutral
  if (input.pinned) {
    explicitSignalFactor = 1.0;
  } else if (input.user_importance) {
    explicitSignalFactor = IMPORTANCE_WEIGHTS[input.user_importance];
  }

  // === Weighted Combination ===
  // At encoding, we only have 3 factors, so we renormalize weights
  const weights = INITIAL_SALIENCE_WEIGHTS;
  const salience =
    sourceTypeFactor * weights.source_type +
    confidenceFactor * weights.confidence +
    explicitSignalFactor * weights.explicit_signal;

  return {
    salience: clamp(salience, 0.0, 1.0),
    factors: {
      source_type: sourceTypeFactor,
      confidence: confidenceFactor,
      explicit_signal: explicitSignalFactor,
    },
    weights_used: weights,
  };
}

// === Constants ===

const SOURCE_TYPE_WEIGHTS: Record<SourceType, number> = {
  'user_explicit': 1.0,     // User directly taught
  'user_implicit': 0.8,     // Inferred from user behavior (episode)
  'inferred': 0.5,          // System inference
  'imported': 0.6,          // External import
  'consolidated': 0.7,      // From consolidation
  'system': 0.4,            // System-generated defaults
};

const IMPORTANCE_WEIGHTS = {
  'high': 0.9,
  'medium': 0.6,
  'low': 0.3,
};

// Weights for initial salience (renormalized for 3 factors)
const INITIAL_SALIENCE_WEIGHTS = {
  source_type: 0.40,        // Source type is primary signal at creation
  confidence: 0.35,         // Confidence is important
  explicit_signal: 0.25,    // User signals matter
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
```

### 5.3 Source Type Determination

| Input Type | Source Type | Rationale |
|------------|-------------|-----------|
| User Learn (explicit content) | `user_explicit` | User directly provided knowledge |
| Episode (source.explicit=true) | `user_implicit` | User stated during session |
| Episode (source.explicit=false) | `inferred` | System observed pattern |
| System Entry | `system` | System-generated |
| Import | `imported` | External source |

> **Note:** The `consolidated` source type is used by Storage during merge operations in `apply_updates()`. Encoding never produces this type directly — it is set by Storage when entries are created or modified through KB consolidation processes.

### 5.4 Confidence Computation

Confidence comes from different sources depending on input type:

```typescript
function compute_confidence(
  inputType: 'user' | 'episode' | 'system',
  input: UserLearnInput | Episode | SystemInput
): number {
  switch (inputType) {
    case 'user':
      // User input is high confidence (they explicitly taught it)
      return 0.90;

    case 'episode':
      // Episode carries its own confidence from Extraction
      return (input as Episode).confidence;

    case 'system':
      // System entries use provided confidence or default
      return (input as SystemInput).confidence ?? 0.80;
  }
}
```

### 5.5 Example Salience Computations

**Example 1: User Learn (explicit, high importance)**
```
source_type = user_explicit → 1.0
confidence = 0.90
explicit_signal = high → 0.9

salience = (1.0 × 0.40) + (0.90 × 0.35) + (0.9 × 0.25)
         = 0.40 + 0.315 + 0.225
         = 0.94
```

**Example 2: Episode (inferred pattern, medium confidence)**
```
source_type = inferred → 0.5
confidence = 0.55
explicit_signal = none → 0.5 (default)

salience = (0.5 × 0.40) + (0.55 × 0.35) + (0.5 × 0.25)
         = 0.20 + 0.1925 + 0.125
         = 0.52
```

**Example 3: System Entry (default)**
```
source_type = system → 0.4
confidence = 0.80
explicit_signal = not pinned → 0.5

salience = (0.4 × 0.40) + (0.80 × 0.35) + (0.5 × 0.25)
         = 0.16 + 0.28 + 0.125
         = 0.565
```

---

## Part 6: Entry Formatting

### 6.1 Entry ID Generation

```typescript
function generate_entry_id(): string {
  const uuid = crypto.randomUUID();
  return `entry-${uuid.slice(0, 8)}`;
}

// Examples:
// entry-abc12345
// entry-def67890
```

### 6.2 Title Extraction

```typescript
interface TitleExtractionInput {
  content: string;
  provided_title?: string;
}

function extract_title(input: TitleExtractionInput): string {
  // Priority 1: User-provided title
  if (input.provided_title?.trim()) {
    return sanitize_title(input.provided_title.trim());
  }

  // Priority 2: First heading in content
  const headingMatch = input.content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return sanitize_title(headingMatch[1]);
  }

  // Priority 3: First sentence or line
  const firstLine = input.content.split('\n')[0].trim();
  const firstSentence = firstLine.split(/[.!?]/)[0].trim();

  if (firstSentence.length <= 80) {
    return sanitize_title(firstSentence);
  }

  // Truncate and add ellipsis
  return sanitize_title(firstSentence.slice(0, 77) + '...');
}

function sanitize_title(title: string): string {
  return title
    .replace(/[#*_`\[\]]/g, '')  // Remove markdown
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim();
}
```

### 6.3 Markdown Entry Format

KB entries are stored as markdown with YAML frontmatter (per Storage design):

```markdown
---
id: entry-abc12345
title: Use Result Types for Error Handling
category: patterns
tags:
  - error-handling
  - typescript
  - conventions
metadata:
  salience: 0.75
  confidence: 0.90
  source_type: user_explicit
  source_ref: sess-2026-03-08-001
  created_at: 2026-03-08T14:30:00Z
  updated_at: 2026-03-08T14:30:00Z
  last_accessed: 2026-03-08T14:30:00Z
  access_count: 0
  pinned: false
  related_entries: []
  supersedes: null
---

# Use Result Types for Error Handling

This project uses Result<T, E> types for error handling instead of throwing exceptions.

## Rationale

- Explicit error handling at call sites
- Better composability with functional patterns
- Type-safe error propagation

## Example

[code example here]
```

### 6.4 Entry Formatter Implementation

```typescript
interface FormatEntryInput {
  // === Content ===
  content: string;
  title: string;
  category: string;
  tags: string[];

  // === Metadata ===
  salience: number;
  confidence: number;
  source_type: SourceType;
  source_ref: string;

  // === Optional ===
  related_entries?: string[];
  supersedes?: string | null;
  pinned?: boolean;
}

interface FormattedEntry {
  id: string;
  markdown: string;               // Full markdown with frontmatter
  metadata: EntryMetadata;        // Structured metadata
}

function format_entry(input: FormatEntryInput): FormattedEntry {
  const id = generate_entry_id();
  const now = new Date().toISOString();

  const metadata: EntryMetadata = {
    salience: input.salience,
    confidence: input.confidence,
    source_type: input.source_type,
    source_ref: input.source_ref,
    created_at: now,
    updated_at: now,
    last_accessed: now,
    access_count: 0,
    pinned: input.pinned ?? false,
    related_entries: input.related_entries ?? [],
    supersedes: input.supersedes ?? null,
  };

  const frontmatter = yaml.stringify({
    id,
    title: input.title,
    category: input.category,
    tags: input.tags,
    metadata,
  });

  // Construct content body
  const body = formatContentBody(input.content, input.title);

  const markdown = `---
${frontmatter}---

${body}`;

  return { id, markdown, metadata };
}

function formatContentBody(content: string, title: string): string {
  // Check if content already has a top-level heading
  if (/^#\s+/.test(content)) {
    return content;
  }

  // Add title as heading
  return `# ${title}\n\n${content}`;
}
```

### 6.5 File Path Generation

Encoding does not determine file paths — that's Storage's responsibility. Encoding provides:
- Entry ID
- Category
- Title (for slug generation)

Storage uses these to construct: `{category}/{title-slug}-{id-suffix}.md`

---

## Part 7: Embedding Handling

### 7.1 Design Decision: Delegation to Storage

Per the Storage design (v2.0), embedding generation happens in Storage, not Encoding.

**Rationale:**
- Storage owns the embedding service singleton
- Storage manages the semantic index
- Encoding should not duplicate embedding infrastructure
- Single point of embedding model configuration

### 7.2 Encoding's Role

Encoding prepares the text for embedding but delegates actual embedding to Storage:

```typescript
interface EmbeddingPreparation {
  title: string;
  tags: string[];
  content: string;
}

function prepare_embedding_text(input: EmbeddingPreparation): string {
  // Compose embedding text per Storage's embedding composition rules
  const tagString = input.tags.join(', ');
  const contentTruncated = input.content.slice(0, MAX_EMBEDDING_CONTENT_CHARS);

  return `${input.title}\n\n${tagString}\n\n${contentTruncated}`;
}

const MAX_EMBEDDING_CONTENT_CHARS = 8000;
```

> **Note:** The `prepare_embedding_text()` function above is shown for reference to illustrate what Storage will embed. In practice, **Storage owns embedding composition** — Encoding passes structured fields (title, content, tags) to `Storage.store_entry()`, which composes the embedding text internally per its own rules (see [`01-storage.md`](01-storage.md) Part 8.4).

### 7.3 Storage.store_entry Contract

When Encoding calls Storage.store_entry, Storage handles:
1. Writing markdown file
2. Generating embedding
3. Storing embedding in vector index
4. Storing metadata in metadata store

Encoding receives back `indexed: boolean` to know if embedding succeeded.

---

## Part 8: Integration Contracts

### 8.1 Encoding → Storage Contract

**Operation:** `store_entry`

```typescript
// Encoding prepares this input
const storeInput: StoreEntryInput = {
  title: formattedEntry.title,
  content: formattedEntry.content,
  category: categorizationResult.category,
  tags: mergedTags,
  source_type: computedSourceType,
  source_ref: sessionId,
  confidence: computedConfidence,
  salience: computedSalience.salience,
  related_entries: relatedEntries,
  supersedes: supersedesEntry,
};

// Call Storage
const result = await storage.store_entry(storeInput);

// Result includes:
// - entry_id: string
// - file_path: string
// - indexed: boolean
```

### 8.2 Consolidation → Encoding Contract

Consolidation's Integration agent produces proposals that result in `encode_episode` calls:

```typescript
// Integration proposal becomes encoding input
async function handle_create_proposal(proposal: IntegrationProposal): Promise<void> {
  if (proposal.action !== 'create') return;

  const result = await encoding.encode_episode({
    episode: proposal.source_episode,
    category_override: proposal.proposed_metadata?.category,
    related_entries: proposal.proposed_metadata?.related_entries,
    supersedes: proposal.supersedes,
  });

  // Log result for verification
  log_encoding_result(proposal.proposal_id, result);
}
```

### 8.3 MCP Tool → Encoding Contract

The `kahuna_learn` tool calls `encode_user_input`:

```typescript
// MCP tool handler
async function handle_kahuna_learn(params: LearnToolParams): Promise<ToolResult> {
  try {
    const result = await encoding.encode_user_input({
      content: params.content,
      title: params.title,
      category: params.category,
      tags: params.tags,
      importance: params.importance,
      session_id: getCurrentSessionId(),
      mode: getCurrentMode(),
    });

    return {
      success: true,
      entry_id: result.entry_id,
      category: result.category,
      message: `Learned: "${result.entry_id}" in category "${result.category}"`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

---

## Part 9: Error Handling

### 9.1 Error Types

```typescript
class EncodingError extends Error {
  constructor(
    public code: EncodingErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EncodingError';
  }
}

type EncodingErrorCode =
  | 'INVALID_CONTENT'
  | 'INVALID_CATEGORY'
  | 'CATEGORIZATION_FAILED'
  | 'STORAGE_FAILED'
  | 'EMBEDDING_FAILED';
```

### 9.2 Error Handling Strategy

| Error | Detection | Recovery |
|-------|-----------|----------|
| `INVALID_CONTENT` | Empty or whitespace-only content | Reject with clear error |
| `INVALID_CATEGORY` | Category not in taxonomy | Fall back to inference |
| `CATEGORIZATION_FAILED` | LLM timeout or error | Use 'facts' as fallback |
| `STORAGE_FAILED` | Storage.store_entry fails | Propagate error (cannot recover) |
| `EMBEDDING_FAILED` | Index update fails | Entry stored, flag for later reindex |

### 9.3 Validation Rules

```typescript
function validate_content(content: string): void {
  if (!content || !content.trim()) {
    throw new EncodingError('INVALID_CONTENT', 'Content cannot be empty');
  }

  if (content.length > MAX_CONTENT_SIZE) {
    throw new EncodingError(
      'INVALID_CONTENT',
      `Content exceeds maximum size of ${MAX_CONTENT_SIZE} bytes`,
      { size: content.length, max: MAX_CONTENT_SIZE }
    );
  }
}

function validate_category(category: string, validCategories: string[]): void {
  if (!validCategories.includes(category)) {
    throw new EncodingError(
      'INVALID_CATEGORY',
      `Category "${category}" is not in taxonomy`,
      { category, valid: validCategories }
    );
  }
}

/**
 * Validate metadata ranges before calling Storage.
 * Pre-validation prevents confusing INVALID_METADATA errors from Storage.
 */
function validate_metadata(confidence: number, salience: number): void {
  if (confidence < 0 || confidence > 1) {
    throw new EncodingError(
      'INVALID_METADATA',
      'Confidence must be between 0.0 and 1.0',
      { field: 'confidence', value: confidence }
    );
  }
  if (salience < 0 || salience > 1) {
    throw new EncodingError(
      'INVALID_METADATA',
      'Salience must be between 0.0 and 1.0',
      { field: 'salience', value: salience }
    );
  }
}

const MAX_CONTENT_SIZE = 1_000_000; // 1MB
```

---

## Part 10: Implementation Considerations

### 10.1 LLM Integration

For categorization, Encoding needs LLM access:

```typescript
interface LLMService {
  complete(prompt: string): Promise<string>;
}

// Encoding receives LLM service as dependency
class EncodingService {
  constructor(
    private storage: StorageService,
    private llm: LLMService,
    private config: EncodingConfig
  ) {}
}
```

### 10.2 Configuration

```typescript
interface EncodingConfig {
  // === Categorization ===
  categorization_confidence_threshold: number; // Default: 0.6
  fallback_category: string;                   // Default: 'facts'

  // === Salience ===
  initial_salience_weights: {
    source_type: number;
    confidence: number;
    explicit_signal: number;
  };

  // === Content ===
  max_content_size: number;                    // Default: 1MB
  max_embedding_content_chars: number;         // Default: 8000
}
```

### 10.3 Performance Targets

| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| `encode_user_input` (no LLM) | < 100ms | Category provided |
| `encode_user_input` (with LLM) | < 2s | Category inferred |
| `encode_episode` | < 100ms | Category derived from type |
| `encode_system_entry` | < 50ms | No inference needed |

### 10.4 Testing Strategy

#### Unit Tests

| Component | Test Focus |
|-----------|------------|
| **Categorizer** | Category validation, inference mocking, fallback behavior |
| **Salience Computer** | Factor computation, weight combination, edge cases |
| **Entry Formatter** | ID generation, markdown structure, frontmatter correctness |
| **Title Extractor** | Various content formats, truncation, sanitization |

#### Integration Tests

| Scenario | Verification |
|----------|--------------|
| Full user learn flow | Content → Storage, entry retrievable |
| Episode encoding | Episode metadata preserved, category mapped |
| Storage failure | Error propagated, no partial state |
| LLM categorization | Correct category inferred, confidence tracked |

---

## Summary

### What This Document Establishes

1. **Component architecture** — Four components (Categorizer, Initial Salience Computer, Entry Formatter, Embedding Generator) with clear responsibilities
2. **Input types** — Three input sources (user, episode, system) with distinct handling
3. **Categorization logic** — LLM-based inference when category not provided, GRSO-structured agent
4. **Initial salience computation** — Three-factor formula using source_type, confidence, explicit_signal
5. **Entry formatting** — Markdown with YAML frontmatter, ID generation, title extraction
6. **Embedding delegation** — Text preparation in Encoding, actual embedding in Storage
7. **Integration contracts** — How MCP tools and Consolidation call Encoding
8. **Error handling** — Validation, fallbacks, error types

### Bayesian Role Summary

Encoding expands P(H) by transforming raw information into hypothesis entries:
- **Input** = new evidence or explicit teaching
- **Category** = places hypothesis in hypothesis space
- **Salience** = initial weight in prior distribution
- **Confidence** = belief strength for this hypothesis

### Dependencies

| Depends On | For |
|------------|-----|
| Storage | Persisting entries, embedding generation |
| LLM Service | Category inference |
| Episode Schema | Consolidation integration |

| Depended On By | For |
|----------------|-----|
| MCP Tools | `kahuna_learn` tool |
| Consolidation | Creating entries from episodes |
| Initialization | System entry creation |

---

## Changelog

- v1.1 (2026-03-08): Integration alignment fixes
  - Added note clarifying `consolidated` source type is set by Storage, not Encoding (Part 5.3)
  - Clarified that Storage owns embedding composition; `prepare_embedding_text()` is illustrative only (Part 7.2)
  - Added `validate_metadata()` function for pre-validation of confidence/salience ranges (Part 9.3)
- v1.0 (2026-03-08): Initial Encoding subsystem design
