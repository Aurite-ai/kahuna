# Storage Subsystem Design

**Type:** Subsystem Design Document
**Date:** 2026-03-08
**Status:** Draft (v2.0)
**Purpose:** Define the Storage subsystem — persistent storage for KB entries, semantic index, and metadata

**Related:**
- [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) — Parent architecture (subsystem boundaries, contracts)
- [`00-common-schemas.md`](00-common-schemas.md) — Salience Architecture, cross-cutting schemas
- [`static-dynamic-integration.md`](../02-architecture/static-dynamic-integration.md) — Storage as Prior Maintenance

---

## Executive Summary

The Storage subsystem is the **substrate layer** (G0) of Kahuna's memory architecture. It provides persistent storage for the Knowledge Base — the updateable prior distribution P(H) that completes the LLM's inference capability.

**Core Responsibilities:**
- Persist KB entries as markdown files
- Maintain semantic index for similarity-based retrieval
- Store and manage entry metadata (salience, confidence, source, timestamps)
- Provide CRUD operations for KB management
- Support archive and backup operations

**Bayesian Role:** Storage maintains P(H) — the prior distribution. Each KB entry is a hypothesis; the collection of all entries IS the prior. Storage doesn't compute on the prior; it holds it.

**G-Level:** G0 (substrate for patterns) with embedded G3 content (stored rules/strategies)

---

## Part 1: Component Architecture

### 1.1 Component Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              STORAGE SUBSYSTEM                                             │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           PUBLIC API LAYER                                       │   │
│   │                                                                                   │   │
│   │   store_entry()  read_entry()  update_entry()  delete_entry()  semantic_search() │   │
│   │   update_metadata()  archive_entry()  rebuild_index()  get_stats()               │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                        │                                                  │
│              ┌─────────────────────────┼─────────────────────────┐                       │
│              │                         │                         │                       │
│              ▼                         ▼                         ▼                       │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐          │
│   │   KB FILE MANAGER   │   │   SEMANTIC INDEX    │   │   METADATA STORE    │          │
│   │                     │   │                     │   │                     │          │
│   │ • File I/O          │   │ • Vector storage    │   │ • Structured data   │          │
│   │ • Path resolution   │   │ • Similarity search │   │ • Fast lookup       │          │
│   │ • Markdown parse    │   │ • Index rebuild     │   │ • Batch updates     │          │
│   │ • Category routing  │   │ • Embedding mgmt    │   │ • Query support     │          │
│   │                     │   │                     │   │                     │          │
│   └──────────┬──────────┘   └──────────┬──────────┘   └──────────┬──────────┘          │
│              │                         │                         │                       │
│              │                         │                         │                       │
│              ▼                         ▼                         ▼                       │
│   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐          │
│   │    FILE SYSTEM      │   │    VECTOR STORE     │   │    SQLITE/JSON      │          │
│   │    .kahuna/kb/      │   │    .kahuna/index/   │   │    .kahuna/meta/    │          │
│   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘          │
│                                                                                          │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│   │                          ARCHIVE MANAGER                                          │   │
│   │                                                                                   │   │
│   │   • Archive low-salience entries      • Restore archived entries                 │   │
│   │   • Prune old archives                • Backup/restore operations                │   │
│   │                                                                                   │   │
│   │   Storage: .kahuna/archive/                                                       │   │
│   │                                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Responsibilities

#### KB File Manager

**Purpose:** Handle all markdown file I/O operations for KB entries.

| Responsibility | Description |
|----------------|-------------|
| **File I/O** | Read, write, update, delete markdown files |
| **Path Resolution** | Map entry IDs and categories to file paths |
| **Markdown Parsing** | Parse frontmatter + content from markdown files |
| **Category Routing** | Route entries to appropriate subdirectories |
| **File Watching** | Detect external file changes (optional) |

**Owns:**
- File naming conventions
- Directory structure
- Markdown format specification

#### Semantic Index

**Purpose:** Maintain vector embeddings for similarity-based retrieval.

| Responsibility | Description |
|----------------|-------------|
| **Embedding Generation** | Generate embeddings for entry content |
| **Index Storage** | Persist embedding vectors with entry references |
| **Similarity Search** | Find entries similar to a query embedding |
| **Index Maintenance** | Add, update, remove entries from index |
| **Index Rebuild** | Full rebuild from KB files |

**Owns:**
- Embedding model selection
- Index structure and format
- Distance metric configuration

#### Metadata Store

**Purpose:** Persist structured metadata for fast querying without parsing files.

| Responsibility | Description |
|----------------|-------------|
| **Metadata Storage** | Store entry metadata in queryable format |
| **Fast Lookup** | O(1) access to metadata by entry ID |
| **Batch Updates** | Efficient bulk metadata updates |
| **Query Support** | Filter entries by metadata criteria |
| **Sync Management** | Ensure metadata matches file state |

**Owns:**
- Metadata schema definition
- Query interface
- Cache invalidation strategy

#### Archive Manager

**Purpose:** Handle archived entries and backup operations.

| Responsibility | Description |
|----------------|-------------|
| **Entry Archiving** | Move low-salience entries to archive |
| **Archive Restoration** | Restore archived entries to active KB |
| **Archive Pruning** | Delete old archived entries |
| **Backup Creation** | Create full KB backups |
| **Backup Restoration** | Restore KB from backup |

**Owns:**
- Archive directory structure
- Backup format
- Retention policies

---

## Part 2: Data Structures

### 2.1 KBEntry Schema

The core data structure representing a Knowledge Base entry:

```typescript
interface KBEntry {
  // === Identity ===
  id: string;                    // Unique identifier (entry-{uuid-first8})

  // === Content ===
  title: string;                 // Entry title (from frontmatter or first heading)
  content: string;               // Markdown content (body, excluding frontmatter)
  category: string;              // Primary category (maps to subdirectory)
  tags: string[];                // Additional classification tags

  // === Metadata ===
  metadata: EntryMetadata;       // Structured metadata

  // === File Location ===
  file_path: string;             // Relative path from KB root
}

interface EntryMetadata {
  // === Salience (see 00-common-schemas.md) ===
  salience: number;              // 0.0-1.0, current importance

  // === Confidence ===
  confidence: number;            // 0.0-1.0, belief strength

  // === Source Attribution ===
  source_type: SourceType;       // How this knowledge was acquired
  source_ref: string;            // Reference (session ID, file path, etc.)

  // === Timestamps ===
  created_at: string;            // ISO 8601 creation time
  updated_at: string;            // ISO 8601 last modification time
  last_accessed: string;         // ISO 8601 last retrieval time

  // === Access Patterns ===
  access_count: number;          // Total retrieval count

  // === Protection ===
  pinned: boolean;               // User-pinned, exempt from decay

  // === Relations ===
  related_entries: string[];     // IDs of related entries
  supersedes: string | null;     // ID of entry this supersedes (for corrections)
}

type SourceType =
  | 'user_explicit'    // User directly taught via learn tool
  | 'user_implicit'    // Inferred from user behavior
  | 'inferred'         // System inference from patterns
  | 'imported'         // Imported from external source
  | 'consolidated'     // Created/merged during consolidation (storage-specific)
  | 'system';          // System-generated (e.g., defaults)

// Note: Aligns with common-schemas.md Episode source types.
// 'consolidated' and 'system' are storage-specific additions for entries
// that don't originate from episodes.
```

### 2.2 Index Entry Schema

Structure for semantic index entries:

```typescript
interface IndexEntry {
  // === Identity ===
  entry_id: string;              // Reference to KBEntry.id

  // === Embedding ===
  embedding: Float32Array;       // Vector embedding (384 dimensions for all-MiniLM-L6-v2)

  // === Indexed Content ===
  indexed_text: string;          // Text that was embedded (for debugging)

  // === Index Metadata ===
  indexed_at: string;            // ISO 8601 when embedding was generated
  embedding_model: string;       // Model version used (for reindex detection)
}

interface IndexConfig {
  // === Model Configuration ===
  embedding_model: string;       // 'Xenova/all-MiniLM-L6-v2'
  embedding_dimensions: number;  // 384

  // === Distance Metric ===
  distance_metric: 'cosine';     // sqlite-vec DISTANCE_METRIC=cosine

  // === Performance ===
  max_entries: number;           // Capacity limit (~250K practical limit with brute-force KNN)
  index_type: 'flat';            // sqlite-vec uses brute-force KNN (ANN not yet available)
}
```

### 2.2.1 Vector Table Schema (sqlite-vec)

SQL schema for the semantic index vector table:

```sql
-- Vector table for semantic search (sqlite-vec vec0 virtual table)
CREATE VIRTUAL TABLE IF NOT EXISTS vec_entries USING vec0(
  entry_id TEXT PRIMARY KEY,
  embedding FLOAT[384] DISTANCE_METRIC=cosine,
  category TEXT,
  created_at TEXT
);

-- Full-text search table for keyword search (FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS fts_entries USING fts5(
  entry_id,
  title,
  content,
  tags,
  content='entries',
  content_rowid='rowid'
);

-- Triggers to keep FTS in sync with entries table
CREATE TRIGGER entries_ai AFTER INSERT ON entries BEGIN
  INSERT INTO fts_entries(rowid, entry_id, title, content, tags)
  VALUES (NEW.rowid, NEW.entry_id, NEW.title, NEW.content, NEW.tags);
END;

CREATE TRIGGER entries_ad AFTER DELETE ON entries BEGIN
  INSERT INTO fts_entries(fts_entries, rowid, entry_id, title, content, tags)
  VALUES ('delete', OLD.rowid, OLD.entry_id, OLD.title, OLD.content, OLD.tags);
END;

CREATE TRIGGER entries_au AFTER UPDATE ON entries BEGIN
  INSERT INTO fts_entries(fts_entries, rowid, entry_id, title, content, tags)
  VALUES ('delete', OLD.rowid, OLD.entry_id, OLD.title, OLD.content, OLD.tags);
  INSERT INTO fts_entries(rowid, entry_id, title, content, tags)
  VALUES (NEW.rowid, NEW.entry_id, NEW.title, NEW.content, NEW.tags);
END;
```

### 2.3 Search Result Schema

Structure returned from semantic search:

```typescript
interface SearchResult {
  // === Identity ===
  entry_id: string;
  file_path: string;

  // === Relevance ===
  similarity_score: number;      // 0.0-1.0, higher = more similar

  // === Preview ===
  title: string;
  content_preview: string;       // First N characters of content

  // === Metadata (full) ===
  metadata: EntryMetadata;
}

interface SearchQuery {
  // === Query Content ===
  query: string;                 // Natural language query
  query_embedding?: number[];    // Pre-computed embedding (optional)

  // === Filters ===
  filters: SearchFilters;

  // === Pagination ===
  limit: number;                 // Max results (default: 10)
  offset: number;                // Skip first N results (default: 0)
}

interface SearchFilters {
  categories?: string[];         // Include only these categories
  exclude_categories?: string[]; // Exclude these categories
  min_salience?: number;         // Minimum salience threshold
  max_age_days?: number;         // Entries modified within N days
  pinned_only?: boolean;         // Only pinned entries
  source_types?: SourceType[];   // Filter by source type
  tags?: string[];               // Entries with any of these tags
}
```

### 2.4 File Format Specification

KB entries are stored as markdown files with YAML frontmatter:

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
  last_accessed: 2026-03-08T15:45:00Z
  access_count: 3
  pinned: false
  related_entries:
    - entry-def67890
  supersedes: null
---

# Use Result Types for Error Handling

This project uses Result<T, E> types for error handling instead of throwing exceptions.

## Rationale

- Explicit error handling at call sites
- Better composability with functional patterns
- Type-safe error propagation

## Example

```typescript
function parseConfig(path: string): Result<Config, ConfigError> {
  // Implementation
}
```

## Related

- See also: [Error Types](entry-def67890)
```

#### File Naming Convention

```
{category}/{title-slug}-{id-suffix}.md

Examples:
patterns/use-result-types-abc12345.md
decisions/use-postgresql-def67890.md
preferences/code-style-guidelines-123abcde.md
```

#### Directory Structure

```
.kahuna/
├── kb/                          # Active Knowledge Base
│   ├── patterns/                # Pattern category
│   │   ├── error-handling-abc123.md
│   │   └── barrel-exports-def456.md
│   ├── decisions/               # Decision category
│   │   └── use-postgresql-789abc.md
│   ├── preferences/             # Preference category
│   │   └── code-style-123def.md
│   ├── facts/                   # Fact category
│   │   └── api-port-config-456789.md
│   └── errors/                  # Error/correction category
│       └── avoid-default-exports-abcdef.md
│
├── index/                       # Semantic index storage
│   ├── embeddings.bin           # Vector data
│   └── index.json               # Index metadata
│
├── meta/                        # Metadata store
│   └── metadata.sqlite          # SQLite database (or metadata.json)
│
├── archive/                     # Archived entries
│   ├── 2026-03/                 # Organized by archive date
│   │   └── old-entry-xyz789.md
│   └── manifest.json            # Archive manifest
│
├── backups/                     # Backup storage
│   ├── 2026-03-08T00-00-00Z/
│   │   ├── kb.tar.gz
│   │   └── manifest.json
│   └── latest -> 2026-03-08T00-00-00Z/
│
└── config.json                  # Storage configuration
```

---

## Part 3: Public API

### 3.1 Entry Operations

#### store_entry

Store a new KB entry.

```typescript
interface StoreEntryInput {
  // === Content ===
  title: string;
  content: string;
  category: string;
  tags?: string[];

  // === Metadata ===
  source_type: SourceType;
  source_ref: string;
  confidence: number;
  salience: number;

  // === Optional ===
  related_entries?: string[];
  supersedes?: string;
}

interface StoreEntryOutput {
  entry_id: string;
  file_path: string;
  indexed: boolean;
}

function store_entry(input: StoreEntryInput): Promise<StoreEntryOutput>;
```

**Preconditions:**
- Content is non-empty
- Category is valid (from taxonomy)
- Confidence and salience are in [0.0, 1.0]

**Postconditions:**
- Entry file created in appropriate directory
- Entry added to semantic index
- Metadata stored in metadata store
- `created_at`, `updated_at`, `last_accessed` set to current time
- `access_count` set to 0

**Errors:**
- `INVALID_CATEGORY` — Category not in taxonomy
- `INVALID_METADATA` — Metadata values out of range
- `STORAGE_FAILURE` — File system error
- `INDEX_FAILURE` — Embedding or index error (entry still stored)

---

#### read_entry

Read an entry by ID.

```typescript
interface ReadEntryInput {
  entry_id: string;
  include_content?: boolean;     // Default: true
}

interface ReadEntryOutput {
  entry: KBEntry;
}

function read_entry(input: ReadEntryInput): Promise<ReadEntryOutput>;
```

**Postconditions:**
- `last_accessed` updated to current time
- `access_count` incremented (if include_content=true)

**Errors:**
- `ENTRY_NOT_FOUND` — No entry with given ID
- `PARSE_ERROR` — File exists but cannot be parsed

---

#### read_entries_batch

Read multiple entries by ID (batch operation).

```typescript
interface ReadEntriesBatchInput {
  entry_ids: string[];
  include_content?: boolean;
}

interface ReadEntriesBatchOutput {
  entries: KBEntry[];
  not_found: string[];           // IDs that were not found
}

function read_entries_batch(input: ReadEntriesBatchInput): Promise<ReadEntriesBatchOutput>;
```

---

#### update_entry

Update an existing entry's content.

```typescript
interface UpdateEntryInput {
  entry_id: string;

  // === Optional updates ===
  title?: string;
  content?: string;
  category?: string;             // Moving entry to new category
  tags?: string[];

  // === Merge behavior ===
  merge_tags?: boolean;          // True: add to existing; False: replace
}

interface UpdateEntryOutput {
  entry_id: string;
  file_path: string;             // May change if category changed
  reindexed: boolean;
}

function update_entry(input: UpdateEntryInput): Promise<UpdateEntryOutput>;
```

**Postconditions:**
- Entry file updated
- `updated_at` set to current time
- If content changed: entry reindexed
- If category changed: file moved to new directory

**Errors:**
- `ENTRY_NOT_FOUND` — No entry with given ID
- `INVALID_CATEGORY` — New category not in taxonomy
- `STORAGE_FAILURE` — File system error

---

#### delete_entry

Permanently delete an entry.

```typescript
interface DeleteEntryInput {
  entry_id: string;
  force?: boolean;               // Delete even if pinned
}

interface DeleteEntryOutput {
  deleted: boolean;
  file_path: string;             // Path that was deleted
}

function delete_entry(input: DeleteEntryInput): Promise<DeleteEntryOutput>;
```

**Preconditions:**
- If `force=false` and entry is pinned, operation fails

**Postconditions:**
- Entry file deleted
- Entry removed from semantic index
- Entry removed from metadata store
- References from other entries NOT automatically updated

**Errors:**
- `ENTRY_NOT_FOUND` — No entry with given ID
- `ENTRY_PINNED` — Entry is pinned and force=false
- `STORAGE_FAILURE` — File system error

---

### 3.2 Metadata Operations

#### update_metadata

Update entry metadata without modifying content.

```typescript
interface UpdateMetadataInput {
  entry_id: string;

  // === Updateable fields ===
  salience?: number;
  confidence?: number;
  pinned?: boolean;
  related_entries?: string[];

  // === Access tracking ===
  record_access?: boolean;       // Update last_accessed and access_count
}

interface UpdateMetadataOutput {
  entry_id: string;
  metadata: EntryMetadata;
}

function update_metadata(input: UpdateMetadataInput): Promise<UpdateMetadataOutput>;
```

**Notes:**
- Does NOT update `updated_at` (that's for content changes)
- DOES update frontmatter in file to maintain sync
- Can be batched for efficiency (see batch variant)

---

#### update_metadata_batch

Batch update metadata for multiple entries.

```typescript
interface MetadataUpdate {
  entry_id: string;
  salience?: number;
  confidence?: number;
  pinned?: boolean;
}

interface UpdateMetadataBatchInput {
  updates: MetadataUpdate[];
}

interface UpdateMetadataBatchOutput {
  updated: string[];             // IDs successfully updated
  failed: Array<{
    entry_id: string;
    error: string;
  }>;
}

function update_metadata_batch(input: UpdateMetadataBatchInput): Promise<UpdateMetadataBatchOutput>;
```

---

#### query_metadata

Query entries by metadata criteria.

```typescript
interface QueryMetadataInput {
  // === Filters (all optional, combined with AND) ===
  categories?: string[];
  min_salience?: number;
  max_salience?: number;
  min_confidence?: number;
  source_types?: SourceType[];
  pinned?: boolean;

  // === Time filters ===
  created_after?: string;        // ISO 8601
  created_before?: string;
  accessed_after?: string;
  accessed_before?: string;

  // === Pagination ===
  limit?: number;
  offset?: number;

  // === Sorting ===
  sort_by?: 'salience' | 'confidence' | 'created_at' | 'last_accessed' | 'access_count';
  sort_order?: 'asc' | 'desc';
}

interface QueryMetadataOutput {
  entries: Array<{
    entry_id: string;
    file_path: string;
    metadata: EntryMetadata;
  }>;
  total_count: number;           // Total matching (before pagination)
}

function query_metadata(input: QueryMetadataInput): Promise<QueryMetadataOutput>;
```

---

### 3.3 Search Operations

#### semantic_search

Find entries similar to a query using semantic similarity.

```typescript
interface SemanticSearchInput {
  query: string;
  filters?: SearchFilters;
  limit?: number;                // Default: 10
}

interface SemanticSearchOutput {
  results: SearchResult[];
  query_embedding: number[];     // For caching/debugging
}

function semantic_search(input: SemanticSearchInput): Promise<SemanticSearchOutput>;
```

**Algorithm:**
1. Generate embedding for query text
2. Search index for similar vectors
3. Apply filters to candidates
4. Return top N results sorted by similarity

**Postconditions:**
- Does NOT update access timestamps (Retrieval subsystem does that)

**Errors:**
- `INDEX_UNAVAILABLE` — Index not loaded or corrupted
- `EMBEDDING_FAILURE` — Failed to generate query embedding

---

#### hybrid_search

Combine semantic similarity (sqlite-vec) with keyword search (FTS5).

```typescript
interface HybridSearchInput {
  query: string;

  // === Search weights ===
  semantic_weight?: number;      // Default: 0.7
  keyword_weight?: number;       // Default: 0.3

  filters?: SearchFilters;
  limit?: number;
}

interface HybridSearchOutput {
  results: SearchResult[];
}

function hybrid_search(input: HybridSearchInput): Promise<HybridSearchOutput>;
```

**Algorithm:**

1. **Semantic search:** Query `vec_entries` using embedding MATCH
2. **Keyword search:** Query `fts_entries` using FTS5 MATCH
3. **Score normalization:** Normalize both score sets to [0, 1]
4. **Weighted combination:**
   ```
   final_score = (semantic_score × semantic_weight) + (keyword_score × keyword_weight)
   ```
5. **Deduplication:** Merge results by entry_id, keeping highest score
6. **Sort and limit:** Return top N by final_score

**Implementation Pattern:**

```typescript
async function hybrid_search(input: HybridSearchInput): Promise<HybridSearchOutput> {
  const semanticWeight = input.semantic_weight ?? 0.7;
  const keywordWeight = input.keyword_weight ?? 0.3;
  const limit = input.limit ?? 10;

  // Get candidates from both sources (fetch more than limit for merging)
  const candidateLimit = limit * 2;

  // Semantic search via sqlite-vec
  const queryEmbedding = await embeddingService.embed(input.query);
  const semanticResults = db.prepare(`
    SELECT entry_id, distance
    FROM vec_entries
    WHERE embedding MATCH ?
    ORDER BY distance
    LIMIT ?
  `).all(serializeEmbedding(queryEmbedding), candidateLimit);

  // Keyword search via FTS5
  const keywordResults = db.prepare(`
    SELECT entry_id, bm25(fts_entries) as score
    FROM fts_entries
    WHERE fts_entries MATCH ?
    ORDER BY score
    LIMIT ?
  `).all(input.query, candidateLimit);

  // Normalize and combine scores
  const combined = mergeAndScore(
    semanticResults,
    keywordResults,
    semanticWeight,
    keywordWeight
  );

  // Apply filters and return top N
  return applyFiltersAndLimit(combined, input.filters, limit);
}
```

---

### 3.4 Index Operations

#### rebuild_index

Rebuild the semantic index from KB files.

```typescript
interface RebuildIndexInput {
  force?: boolean;               // Rebuild even if up-to-date
  categories?: string[];         // Only rebuild these categories
}

interface RebuildIndexOutput {
  entries_indexed: number;
  duration_ms: number;
  errors: Array<{
    entry_id: string;
    error: string;
  }>;
}

function rebuild_index(input: RebuildIndexInput): Promise<RebuildIndexOutput>;
```

**When to rebuild:**
- After embedding model change
- After manual file edits
- If index corruption detected
- During scheduled maintenance

---

#### index_entry

Add or update a single entry in the index.

```typescript
interface IndexEntryInput {
  entry_id: string;
  content: string;               // Content to embed
}

interface IndexEntryOutput {
  indexed: boolean;
  embedding_model: string;
}

function index_entry(input: IndexEntryInput): Promise<IndexEntryOutput>;
```

---

#### remove_from_index

Remove an entry from the index.

```typescript
interface RemoveFromIndexInput {
  entry_id: string;
}

interface RemoveFromIndexOutput {
  removed: boolean;
}

function remove_from_index(input: RemoveFromIndexInput): Promise<RemoveFromIndexOutput>;
```

---

### 3.5 Composite Operations

#### apply_updates

Batch operation for applying multiple updates atomically (used by Consolidation).

```typescript
interface UpdateOperation {
  type: 'create' | 'update' | 'merge' | 'delete' | 'archive';

  // For create/update
  entry_id?: string;             // Required for update/delete/archive; generated for create
  content?: string;              // New/updated content
  title?: string;
  category?: string;
  tags?: string[];

  // For metadata updates
  metadata_updates?: Partial<EntryMetadata>;

  // For merge
  merge_target_ids?: string[];   // Entries to merge into one
  merge_primary_id?: string;     // Which entry is the "primary" (retains ID)

  // Context
  source_ref?: string;           // Session/episode reference
}

interface ApplyUpdatesInput {
  updates: UpdateOperation[];
  atomic?: boolean;              // Default: false. If true, all-or-nothing
}

interface ApplyUpdatesOutput {
  results: Array<{
    operation_index: number;
    type: string;
    entry_id: string;
    success: boolean;
    error?: string;
  }>;
  summary: {
    created: number;
    updated: number;
    merged: number;
    deleted: number;
    archived: number;
    failed: number;
  };
}

function apply_updates(input: ApplyUpdatesInput): Promise<ApplyUpdatesOutput>;
```

**Semantics:**
- Each operation is processed in order
- If `atomic=false` (default): failures don't affect other operations
- If `atomic=true`: any failure rolls back all operations
- Returns detailed results for logging/debugging

**Error Handling:**
- Invalid operations are skipped with error in results
- Entry-level errors don't affect other entries (unless atomic)
- Transaction isolation per operation (or full batch if atomic)

---

#### list_entries

List/iterate all entries with optional filtering and pagination.

```typescript
interface ListEntriesInput {
  // === Filters ===
  categories?: string[];
  source_types?: SourceType[];
  min_salience?: number;
  max_salience?: number;
  pinned?: boolean;

  // === Time filters ===
  created_after?: string;
  created_before?: string;
  updated_after?: string;
  updated_before?: string;

  // === Pagination ===
  limit?: number;                // Default: 100
  offset?: number;               // Default: 0
  cursor?: string;               // For cursor-based pagination (alternative to offset)

  // === Sorting ===
  sort_by?: 'created_at' | 'updated_at' | 'salience' | 'access_count' | 'title';
  sort_order?: 'asc' | 'desc';

  // === Content control ===
  include_content?: boolean;     // Default: false (metadata only for efficiency)
}

interface ListEntriesOutput {
  entries: Array<{
    entry_id: string;
    file_path: string;
    title: string;
    category: string;
    tags: string[];
    metadata: EntryMetadata;
    content?: string;            // Only if include_content=true
  }>;
  pagination: {
    total_count: number;
    offset: number;
    limit: number;
    has_more: boolean;
    next_cursor?: string;
  };
}

function list_entries(input: ListEntriesInput): Promise<ListEntriesOutput>;
```

**Use Cases:**
- Decay processing (iterate all entries to apply time-based decay)
- Export/backup operations
- Admin/debug inspection
- Batch metadata updates

**Performance Notes:**
- Default excludes content for efficiency (metadata only)
- Use pagination for large KBs
- Indexed columns: `category`, `salience`, `created_at`, `updated_at`

---

### 3.6 Archive Operations

#### archive_entry

Move an entry to the archive.

```typescript
interface ArchiveEntryInput {
  entry_id: string;
  reason?: string;               // Why archived (for manifest)
}

interface ArchiveEntryOutput {
  archived: boolean;
  archive_path: string;
}

function archive_entry(input: ArchiveEntryInput): Promise<ArchiveEntryOutput>;
```

**Postconditions:**
- Entry file moved to archive directory
- Entry removed from semantic index
- Entry removed from active metadata store
- Entry added to archive manifest

---

#### restore_entry

Restore an archived entry to active KB.

```typescript
interface RestoreEntryInput {
  entry_id: string;
  reset_salience?: number;       // New salience value (default: 0.3)
}

interface RestoreEntryOutput {
  restored: boolean;
  file_path: string;
  entry_id: string;
}

function restore_entry(input: RestoreEntryInput): Promise<RestoreEntryOutput>;
```

---

#### list_archived

List archived entries.

```typescript
interface ListArchivedInput {
  archived_after?: string;       // ISO 8601
  archived_before?: string;
  limit?: number;
}

interface ArchivedEntry {
  entry_id: string;
  original_path: string;
  archive_path: string;
  archived_at: string;
  reason?: string;
}

interface ListArchivedOutput {
  entries: ArchivedEntry[];
}

function list_archived(input: ListArchivedInput): Promise<ListArchivedOutput>;
```

---

### 3.7 Utility Operations

#### get_stats

Get storage statistics.

```typescript
interface StorageStats {
  // === Entry counts ===
  total_entries: number;
  entries_by_category: Record<string, number>;
  archived_entries: number;

  // === Size ===
  total_size_bytes: number;
  index_size_bytes: number;

  // === Index health ===
  index_entries: number;
  index_last_rebuilt: string;    // ISO 8601
  index_model: string;

  // === Salience distribution ===
  entries_above_threshold: Record<number, number>;  // threshold -> count
}

function get_stats(): Promise<StorageStats>;
```

---

#### validate_integrity

Check storage integrity.

```typescript
interface IntegrityReport {
  // === Files ===
  files_checked: number;
  parse_errors: Array<{
    file_path: string;
    error: string;
  }>;

  // === Index ===
  missing_from_index: string[];  // Entry IDs not in index
  orphaned_in_index: string[];   // Index entries without files

  // === Metadata ===
  metadata_sync_errors: Array<{
    entry_id: string;
    issue: string;
  }>;

  // === Summary ===
  is_healthy: boolean;
}

function validate_integrity(): Promise<IntegrityReport>;
```

---

## Part 4: Integration Contracts

### 4.1 Encoding → Storage Contract

**Operation:** `store_entry`

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 6.2.

```typescript
// Encoding calls this after categorizing and computing initial salience
const result = await storage.store_entry({
  title: categorizedEntry.title,
  content: categorizedEntry.content,
  category: categorizedEntry.category,
  tags: categorizedEntry.tags,
  source_type: 'user_explicit',
  source_ref: sessionId,
  confidence: computedConfidence,
  salience: initialSalience,
});
```

**Contract:**
- Encoding provides valid, categorized content
- Storage persists and indexes the entry
- Storage returns entry ID for tracking

---

### 4.2 Storage → Retrieval Contract

**Operation:** `semantic_search`

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 6.3.

```typescript
// Retrieval calls this to find relevant entries
const results = await storage.semantic_search({
  query: taskDescription,
  filters: {
    categories: modeRelevantCategories,
    min_salience: 0.1,
  },
  limit: 20,
});
```

**Contract:**
- Retrieval provides query text and filters
- Storage returns ranked candidates by similarity
- Storage does NOT update access timestamps (Retrieval does that via `update_metadata`)

---

### 4.3 Consolidation → Storage Contract

**Operation:** `apply_updates` (composite)

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 6.6.

```typescript
interface ApplyUpdatesInput {
  updates: Array<{
    type: 'create' | 'update' | 'merge' | 'delete' | 'archive';
    entry_id?: string;
    content?: string;
    metadata_updates?: Partial<EntryMetadata>;
  }>;
}

interface ApplyUpdatesOutput {
  results: Array<{
    entry_id: string;
    type: string;
    success: boolean;
    error?: string;
  }>;
}
```

**Implementation:**
- Consolidation batches all updates from a consolidation cycle
- Storage applies each update atomically (per entry)
- Failures on one entry don't affect others
- Returns detailed results for logging

---

### 4.4 Attention → Storage Contract

**Operation:** `update_metadata_batch`

From [`abstract-architecture.md`](../02-architecture/abstract-architecture.md) Part 6.7-6.8.

```typescript
// Access tracking (from Retrieval via Attention)
await storage.update_metadata_batch({
  updates: retrievedEntryIds.map(id => ({
    entry_id: id,
    salience: currentSalience + accessBoost,
  })),
});

// Decay application (from Consolidation via Attention)
await storage.update_metadata_batch({
  updates: decayResults.map(d => ({
    entry_id: d.entry_id,
    salience: d.new_salience,
  })),
});
```

---

## Part 5: Operations Semantics

### 5.1 CRUD Operations

| Operation | Effect on File | Effect on Index | Effect on Metadata |
|-----------|---------------|-----------------|-------------------|
| **store_entry** | Create new file | Add to index | Add to metadata store |
| **read_entry** | None | None | Update last_accessed, access_count |
| **update_entry** | Modify file | Reindex if content changed | Update updated_at |
| **delete_entry** | Remove file | Remove from index | Remove from metadata store |
| **archive_entry** | Move to archive dir | Remove from index | Move to archive manifest |
| **restore_entry** | Move from archive | Add to index | Add to metadata store |

### 5.2 Consistency Model

**Primary Invariant:** File content is the source of truth.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONSISTENCY MODEL                                      │
│                                                                          │
│   SOURCE OF TRUTH                                                         │
│   ───────────────                                                         │
│   KB files (.kahuna/kb/**/*.md) are the authoritative state.              │
│   Index and metadata are derived from files.                              │
│                                                                          │
│   SYNC DIRECTION                                                          │
│   ──────────────                                                          │
│   File → Index: One-way (files determine index content)                  │
│   File → Metadata: Bidirectional with file as primary                    │
│                                                                          │
│   RECOVERY                                                                │
│   ────────                                                                │
│   If index is corrupted: rebuild_index() regenerates from files          │
│   If metadata is corrupted: regenerate from file frontmatter             │
│   If file is corrupted: no recovery (must restore from backup)           │
│                                                                          │
│   WRITE ORDER                                                             │
│   ───────────                                                             │
│   1. Write to file (fsync)                                                │
│   2. Update index                                                         │
│   3. Update metadata store                                                │
│                                                                          │
│   If step 2 or 3 fails: entry exists but may need reindexing             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Metadata Sync Strategy

Metadata lives in two places:
1. **Frontmatter** — Inside each markdown file
2. **Metadata Store** — External database for fast queries

**Sync rules:**
- On file write: frontmatter is updated, metadata store is updated
- On metadata update: frontmatter is updated, metadata store is updated
- Metadata store is a cache — can be rebuilt from frontmatter
- Frontmatter is the authoritative source for recovery

### 5.4 Index Maintenance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INDEX MAINTENANCE STRATEGY                            │
│                                                                          │
│   INCREMENTAL UPDATES                                                     │
│   ───────────────────                                                     │
│   • store_entry: Add embedding to index                                   │
│   • update_entry (content changed): Re-embed and update                   │
│   • delete_entry: Remove from index                                       │
│                                                                          │
│   FULL REBUILD                                                            │
│   ────────────                                                            │
│   Triggered when:                                                         │
│   • Embedding model changes                                               │
│   • Index corruption detected                                             │
│   • Manual files added/modified outside Kahuna                            │
│   • Scheduled maintenance (weekly recommended)                            │
│                                                                          │
│   EMBEDDING MODEL VERSIONING                                              │
│   ──────────────────────────                                              │
│   • Index stores model version used                                       │
│   • On startup: check if model version matches                            │
│   • If mismatch: queue full rebuild                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 6: Constraints and Invariants

### 6.1 System Invariants

| Invariant | Description | Enforcement |
|-----------|-------------|-------------|
| **ID Uniqueness** | Entry IDs are globally unique | UUID generation with collision check |
| **File-Entry Mapping** | Each entry has exactly one file | ID-based naming, no duplicates |
| **Category Validity** | All entries belong to valid categories | Validation on write |
| **Metadata Range** | Salience and confidence in [0.0, 1.0] | Clamping on write |
| **Index Coverage** | All active entries are indexed | Periodic integrity check |
| **Frontmatter Sync** | Frontmatter matches metadata store | Update both together |

### 6.2 Category Taxonomy

```typescript
// Default categories (built-in)
const DEFAULT_CATEGORIES = [
  'patterns',      // Recurring approaches and conventions
  'decisions',     // Explicit architectural/design decisions
  'preferences',   // User preferences and style guidelines
  'facts',         // Factual project knowledge
  'errors',        // Mistakes and corrections
  'context',       // Project context and environment
] as const;

type DefaultCategory = typeof DEFAULT_CATEGORIES[number];

// Runtime configuration for category management
interface CategoryConfig {
  // Built-in categories (always valid)
  default_categories: readonly string[];

  // User-defined custom categories
  custom_categories: string[];

  // Whether to allow uncategorized entries
  allow_uncategorized: boolean;  // Default: false
}

// Full category type (default + custom)
type Category = DefaultCategory | string;
```

**Category Extensibility:**

Categories are **configurable at runtime** via `.kahuna/config.json`:

```json
{
  "categories": {
    "custom_categories": ["workflows", "apis", "testing"],
    "allow_uncategorized": false
  }
}
```

**Extension Rules:**
- Default categories are always valid and cannot be removed
- Custom categories can be added/removed via config
- Existing entries with removed categories remain valid (no migration needed)
- Category validation checks both default and custom lists
- New categories automatically create subdirectories on first use

### 6.3 Capacity Constraints

```typescript
interface CapacityConfig {
  // === Entry limits ===
  max_entries: number;           // Default: 10000
  max_entry_size_bytes: number;  // Default: 1MB per file

  // === Index limits ===
  max_index_entries: number;     // Default: 10000

  // === Archive limits ===
  archive_retention_days: number; // Default: 90
  max_archive_size_bytes: number; // Default: 100MB
}
```

### 6.4 File System Constraints

- **Path length:** Max 255 characters for file names
- **Reserved characters:** Sanitize titles for file naming
- **Encoding:** UTF-8 for all files
- **Line endings:** LF (Unix-style)

---

## Part 7: Error Handling

### 7.1 Error Types

```typescript
type StorageError =
  // === Entry Errors ===
  | { code: 'ENTRY_NOT_FOUND'; entry_id: string }
  | { code: 'ENTRY_PINNED'; entry_id: string }
  | { code: 'PARSE_ERROR'; file_path: string; details: string }

  // === Validation Errors ===
  | { code: 'INVALID_CATEGORY'; category: string }
  | { code: 'INVALID_METADATA'; field: string; value: unknown }
  | { code: 'CONTENT_TOO_LARGE'; size_bytes: number; max_bytes: number }

  // === Index Errors ===
  | { code: 'INDEX_UNAVAILABLE'; reason: string }
  | { code: 'EMBEDDING_FAILURE'; reason: string }

  // === System Errors ===
  | { code: 'STORAGE_FAILURE'; operation: string; reason: string }
  | { code: 'CAPACITY_EXCEEDED'; resource: string; current: number; max: number };
```

### 7.2 Error Recovery Strategies

| Error | Recovery Strategy |
|-------|-------------------|
| `ENTRY_NOT_FOUND` | None — entry doesn't exist |
| `PARSE_ERROR` | Log and skip; offer manual repair |
| `INDEX_UNAVAILABLE` | Fall back to metadata queries; queue rebuild |
| `EMBEDDING_FAILURE` | Retry with backoff; store without embedding |
| `STORAGE_FAILURE` | Retry with backoff; escalate if persistent |
| `CAPACITY_EXCEEDED` | Trigger decay cycle; alert user |

### 7.3 Graceful Degradation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GRACEFUL DEGRADATION                                   │
│                                                                          │
│   INDEX UNAVAILABLE                                                       │
│   ─────────────────                                                       │
│   • semantic_search returns error                                         │
│   • Retrieval can fall back to metadata queries                          │
│   • System continues functioning with reduced capability                  │
│   • Background task attempts rebuild                                      │
│                                                                          │
│   METADATA STORE UNAVAILABLE                                              │
│   ──────────────────────────                                              │
│   • Query operations fail                                                 │
│   • Read operations parse from file frontmatter                          │
│   • Write operations still work (file is primary)                        │
│   • Rebuild metadata from files when available                            │
│                                                                          │
│   EMBEDDING SERVICE UNAVAILABLE                                           │
│   ─────────────────────────────                                           │
│   • store_entry stores file without indexing                              │
│   • Queue entries for indexing when service returns                       │
│   • semantic_search uses existing index (may be stale)                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Part 8: Implementation Considerations

### 8.1 Technology Choices

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **KB Files** | Plain markdown files | Human-readable, git-friendly, portable |
| **SQLite Driver** | `better-sqlite3` | Synchronous, fastest Node.js SQLite driver |
| **Vector Extension** | `sqlite-vec` | Pure SQLite extension, no external services |
| **Embedding Model** | `Xenova/all-MiniLM-L6-v2` | 384 dims, ~23MB, runs locally via ONNX |
| **Embedding Runtime** | `@huggingface/transformers` | Official HF package, TypeScript support |
| **Full-Text Search** | SQLite FTS5 | Built-in, powers keyword search in hybrid |

**Rationale:** This stack provides:
- **No API dependencies** — Embeddings generated locally, works offline
- **Single database** — Vectors, metadata, and FTS in one SQLite file
- **Fast startup** — No external services to wait for
- **Portable** — All data in `.kahuna/` directory

**Performance Expectations:**
- sqlite-vec uses brute-force KNN (scans all vectors)
- Practical limit: ~250K vectors before latency degrades
- For Kahuna's expected scale (10K-100K entries): excellent performance

### 8.2 Embedding Service

Singleton pattern for embedding pipeline (lazy initialization):

```typescript
import { pipeline, type Pipeline } from '@huggingface/transformers';

class EmbeddingService {
  private pipelinePromise: Promise<Pipeline> | null = null;
  private readonly modelId = 'Xenova/all-MiniLM-L6-v2';
  private readonly dimensions = 384;

  /**
   * Initialize the embedding pipeline.
   * First call downloads model (~23MB) and loads ONNX runtime (~1-3s).
   * Subsequent calls return cached pipeline.
   */
  async initialize(): Promise<void> {
    await this.getPipeline();
  }

  private async getPipeline(): Promise<Pipeline> {
    if (!this.pipelinePromise) {
      this.pipelinePromise = pipeline('feature-extraction', this.modelId)
        .catch(err => {
          this.pipelinePromise = null; // Allow retry on failure
          throw err;
        });
    }
    return this.pipelinePromise;
  }

  /**
   * Generate embedding for text.
   * @returns Float32Array of 384 dimensions (normalized)
   */
  async embed(text: string): Promise<Float32Array> {
    const extractor = await this.getPipeline();
    const cleanedText = text.replace(/\n/g, ' ').trim();

    const output = await extractor(cleanedText, {
      pooling: 'mean',      // Average across tokens
      normalize: true,      // L2 normalize for cosine similarity
    });

    return new Float32Array(output.data);
  }

  /**
   * Get embedding dimensions for this model.
   */
  getDimensions(): number {
    return this.dimensions;
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService();
```

### 8.3 Vector Serialization

sqlite-vec requires vectors as binary buffers:

```typescript
/**
 * Serialize embedding to Buffer for sqlite-vec storage.
 */
function serializeEmbedding(embedding: Float32Array): Buffer {
  return Buffer.from(embedding.buffer);
}

/**
 * Deserialize Buffer from sqlite-vec to Float32Array.
 */
function deserializeEmbedding(buffer: Buffer): Float32Array {
  return new Float32Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / 4  // 4 bytes per float32
  );
}
```

### 8.4 Embedding Composition

What gets embedded for each entry:

```typescript
interface EmbeddingConfig {
  model: string;                 // 'Xenova/all-MiniLM-L6-v2'
  dimensions: number;            // 384

  // === What to embed ===
  embed_title: boolean;          // Include title (default: true)
  embed_tags: boolean;           // Include tags (default: true)
  max_content_chars: number;     // Truncate content (default: 8000)
}
```

**Embedding composition:**
```
Embedded text = title + "\n\n" + tags.join(", ") + "\n\n" + content.slice(0, max_content_chars)
```

### 8.5 Performance Considerations

| Operation | Target Latency | Strategy |
|-----------|---------------|----------|
| `read_entry` | < 10ms | File read + memory cache |
| `store_entry` | < 500ms | Includes embedding API call |
| `semantic_search` | < 100ms | In-memory index search |
| `query_metadata` | < 50ms | SQLite indexed queries |
| `update_metadata` | < 20ms | SQLite update + file write |

**Caching strategy:**
- Cache recently accessed entries in memory
- Cache metadata queries with short TTL
- Don't cache search results (query-specific)

### 8.6 Concurrency Handling

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONCURRENCY MODEL                                      │
│                                                                          │
│   SINGLE WRITER, MULTIPLE READERS                                         │
│   ───────────────────────────────                                         │
│   • Only one process writes to KB at a time                              │
│   • Multiple readers can access concurrently                             │
│   • MCP server is the single writer (no external writes)                 │
│                                                                          │
│   LOCKING STRATEGY                                                        │
│   ────────────────                                                        │
│   • File-level locks for write operations                                │
│   • Entry-level mutex for concurrent updates                             │
│   • Index-level lock for rebuild                                         │
│                                                                          │
│   EXTERNAL FILE CHANGES                                                   │
│   ─────────────────────                                                   │
│   If external tools modify KB files:                                      │
│   • File watcher detects changes (optional)                              │
│   • Metadata and index may be stale                                       │
│   • validate_integrity detects inconsistencies                           │
│   • rebuild_index recovers consistent state                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.7 Initialization Sequence

```typescript
async function initialize_storage(config: StorageConfig): Promise<Storage> {
  // 1. Ensure directory structure exists
  await ensure_directories();

  // 2. Load or create configuration
  const storageConfig = await load_or_create_config();

  // 3. Initialize SQLite database with extensions
  const db = new Database('.kahuna/kahuna.db');
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = normal');
  sqliteVec.load(db);

  // 4. Initialize metadata store (SQLite tables)
  const metadataStore = await initialize_metadata_store(db);

  // 5. Initialize vector tables (sqlite-vec)
  await initialize_vector_tables(db);

  // 6. Initialize FTS5 tables (keyword search)
  await initialize_fts_tables(db);

  // 7. Initialize embedding service (lazy - actual model load deferred)
  // Model loads on first embed() call (~1-3s, downloads ~23MB if needed)

  // 8. Validate integrity (optional on startup)
  if (storageConfig.validate_on_startup) {
    const report = await validate_integrity();
    if (!report.is_healthy) {
      await repair_inconsistencies(report);
    }
  }

  // 9. Return storage instance
  return new Storage({
    db,
    fileManager,
    metadataStore,
    embeddingService,
    archiveManager,
  });
}
```

---

## Part 9: Testing Strategy

### 9.1 Unit Tests

| Component | Test Focus |
|-----------|------------|
| **KB File Manager** | File I/O, path resolution, markdown parsing |
| **Semantic Index** | Embedding generation, similarity search, index CRUD |
| **Metadata Store** | Query correctness, batch operations, sync |
| **Archive Manager** | Archive/restore, retention policies |

### 9.2 Integration Tests

| Scenario | Verification |
|----------|--------------|
| Full entry lifecycle | Create → Read → Update → Archive → Restore → Delete |
| Search after modifications | Index reflects content changes |
| Metadata sync | Frontmatter and store stay synchronized |
| Concurrent access | Multiple readers, single writer works correctly |

### 9.3 Failure Tests

| Failure Mode | Expected Behavior |
|--------------|-------------------|
| File system error during write | Transaction rolled back, error returned |
| Embedding service timeout | Entry stored, indexed later |
| Index corruption | Detected by integrity check, rebuild works |
| Metadata corruption | Regenerated from frontmatter |

---

## Summary

### What This Document Establishes

1. **Component architecture** — Four components (KB File Manager, Semantic Index, Metadata Store, Archive Manager) with clear responsibilities
2. **Data structures** — KBEntry, IndexEntry, SearchResult schemas with TypeScript definitions
3. **File format** — Markdown with YAML frontmatter, directory structure, naming conventions
4. **Public API** — Complete CRUD, search, index, and archive operations
5. **Integration contracts** — How Encoding, Retrieval, Consolidation, and Attention interact with Storage
6. **Consistency model** — File as source of truth, sync strategies
7. **Error handling** — Error types, recovery strategies, graceful degradation
8. **Implementation guidance** — Technology choices, performance targets, concurrency handling

### Bayesian Role Reminder

Storage maintains P(H) — the prior distribution:
- **KB entries** are hypotheses
- **Salience** weights the prior
- **Confidence** is belief strength
- **Categories** organize the hypothesis space

Storage doesn't compute on P(H); it persists it. Other subsystems query and update through Storage's API.

### Dependencies

| Depends On | For |
|------------|-----|
| `@huggingface/transformers` | Local embedding generation |
| `better-sqlite3` | SQLite database driver |
| `sqlite-vec` | Vector search extension |
| File system | Persisting KB files |

| Depended On By | For |
|----------------|-----|
| Encoding | Storing new entries |
| Retrieval | Semantic search, reading entries |
| Consolidation | Applying updates, archiving |
| Attention | Updating salience metadata |

---

## Changelog

- v2.0 (2026-03-08): Implementation-ready update
  - Added concrete technology stack: `sqlite-vec` + `@huggingface/transformers` + `better-sqlite3`
  - Added `apply_updates` composite operation (Critical Gap #1 from analysis)
  - Added `list_entries` operation for iteration/scanning (Critical Gap #2)
  - Aligned `SourceType` enum with common schemas
  - Defined hybrid search algorithm (semantic + FTS5 keyword)
  - Clarified category extensibility via runtime configuration
  - Added SQL schemas for vector tables and FTS5
  - Added embedding service singleton pattern
  - Added vector serialization utilities
- v1.0 (2026-03-08): Initial Storage subsystem design
