/**
 * Knowledge Storage Service implementation
 *
 * Provides file-based storage for knowledge entries in .mdc format.
 * See: docs/internal/tasks/mcp-mvp/design/local-storage-design.md
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type {
  HealthCheckResult,
  KnowledgeEntry,
  KnowledgeEntryFilter,
  KnowledgeEntryFrontmatter,
  KnowledgeStorageService,
  SaveKnowledgeEntryInput,
} from './types.js';
import { KnowledgeStorageError } from './types.js';
import { generateMdcFile, generateSlug, mapCategory, parseMdcFile } from './utils.js';

/**
 * Default base directory for knowledge storage
 */
const DEFAULT_BASE_DIR = '.kahuna/knowledge';

/**
 * File-based implementation of KnowledgeStorageService
 *
 * Stores knowledge entries as .mdc files (markdown with YAML frontmatter).
 * Files are named by title-derived slug for semantic naming.
 * Designed for ~1000 entries with on-demand file scanning.
 */
export class FileKnowledgeStorageService implements KnowledgeStorageService {
  private readonly baseDir: string;
  private dirEnsured = false;

  /**
   * Create a new FileKnowledgeStorageService
   *
   * @param baseDir - Directory for storing .mdc files (defaults to .kahuna/knowledge/)
   */
  constructor(baseDir: string = DEFAULT_BASE_DIR) {
    this.baseDir = baseDir;
  }

  /**
   * Ensure the knowledge directory exists (lazy initialization)
   */
  private async ensureDir(): Promise<void> {
    if (this.dirEnsured) return;

    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      this.dirEnsured = true;
    } catch (error) {
      throw new KnowledgeStorageError(
        `Failed to create knowledge directory: ${this.baseDir}`,
        'DIR_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get the file path for a given slug
   */
  private getFilePath(slug: string): string {
    return path.join(this.baseDir, `${slug}.mdc`);
  }

  /**
   * Create or update a knowledge entry
   *
   * If a file with the same slug exists, it will be updated (preserving created_at).
   * Returns the complete entry with slug derived from title.
   */
  async save(input: SaveKnowledgeEntryInput): Promise<KnowledgeEntry> {
    await this.ensureDir();

    // Generate slug from title
    const slug = generateSlug(input.title);
    if (!slug) {
      throw new KnowledgeStorageError(
        `Invalid title: "${input.title}" generates empty slug`,
        'WRITE_ERROR'
      );
    }

    const filepath = this.getFilePath(slug);
    const now = new Date().toISOString();

    // Check if file exists to preserve created_at
    let createdAt = now;
    try {
      const existing = await this.get(slug);
      if (existing) {
        createdAt = existing.created_at;
      }
    } catch {
      // File doesn't exist, use current time for created_at
    }

    // Build frontmatter
    const frontmatter: KnowledgeEntryFrontmatter = {
      type: 'knowledge',
      title: input.title,
      summary: input.metadata?.summary ?? '',
      created_at: createdAt,
      updated_at: now,
      source: {
        file: input.sourceFile,
        project: input.projectId ?? null,
        path: input.sourcePath ?? null,
      },
      classification: {
        category: mapCategory(input.category),
        confidence: input.confidence,
        reasoning: input.reasoning,
        tags: input.metadata?.tags ?? [],
        topics: input.metadata?.topics ?? [],
        entities: {
          technologies: input.metadata?.entities?.technologies ?? [],
          frameworks: input.metadata?.entities?.frameworks ?? [],
          libraries: input.metadata?.entities?.libraries ?? [],
          apis: input.metadata?.entities?.apis ?? [],
        },
      },
      status: 'active',
    };

    // Generate .mdc content
    const mdcContent = generateMdcFile(frontmatter, input.content);

    // Write file
    try {
      await fs.writeFile(filepath, mdcContent, 'utf-8');
    } catch (error) {
      throw new KnowledgeStorageError(
        `Failed to write knowledge entry: ${filepath}`,
        'WRITE_ERROR',
        error instanceof Error ? error : undefined
      );
    }

    return { ...frontmatter, slug, content: input.content };
  }

  /**
   * List all knowledge entries with optional filtering
   *
   * Reads all .mdc files from the directory, parses them,
   * and applies filters in memory.
   */
  async list(filter?: KnowledgeEntryFilter): Promise<KnowledgeEntry[]> {
    await this.ensureDir();

    // Read directory contents
    let files: string[];
    try {
      files = await fs.readdir(this.baseDir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw new KnowledgeStorageError(
        `Failed to read knowledge directory: ${this.baseDir}`,
        'DIR_ERROR',
        error instanceof Error ? error : undefined
      );
    }

    // Filter for .mdc files
    const mdcFiles = files.filter((f) => f.endsWith('.mdc'));

    // Parse all files
    const entries: KnowledgeEntry[] = [];
    for (const filename of mdcFiles) {
      try {
        const slug = filename.replace(/\.mdc$/, '');
        const content = await fs.readFile(path.join(this.baseDir, filename), 'utf-8');
        const parsed = parseMdcFile(content);
        entries.push({ ...parsed.frontmatter, slug, content: parsed.body });
      } catch (error) {
        // Log warning but don't fail the entire operation
        console.warn(`Failed to parse ${filename}:`, error);
      }
    }

    // Apply filters if provided
    if (!filter) return entries;

    return entries.filter((entry) => {
      // Filter by project
      if (filter.project && entry.source.project !== filter.project) {
        return false;
      }

      // Filter by status
      if (filter.status && entry.status !== filter.status) {
        return false;
      }

      // Filter by category (can be single or array)
      if (filter.category) {
        const categories = Array.isArray(filter.category)
          ? filter.category
          : [filter.category];
        if (!categories.includes(entry.classification.category)) {
          return false;
        }
      }

      // Filter by tags (entries must have at least one matching tag)
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some((tag) =>
          entry.classification.tags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      // Filter by content search (simple substring match)
      if (filter.contentSearch) {
        const searchLower = filter.contentSearch.toLowerCase();
        const contentLower = entry.content.toLowerCase();
        const titleLower = entry.title.toLowerCase();
        const summaryLower = entry.summary.toLowerCase();

        // Search in content, title, and summary
        if (
          !contentLower.includes(searchLower) &&
          !titleLower.includes(searchLower) &&
          !summaryLower.includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get a single entry by slug
   *
   * @param slug - Filename without extension (e.g., "api-design-guidelines")
   * @returns Entry or null if not found
   */
  async get(slug: string): Promise<KnowledgeEntry | null> {
    const filepath = this.getFilePath(slug);

    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const parsed = parseMdcFile(content);
      return { ...parsed.frontmatter, slug, content: parsed.body };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw new KnowledgeStorageError(
        `Failed to read knowledge entry: ${filepath}`,
        'PARSE_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if an entry exists
   *
   * @param slug - Filename without extension
   */
  async exists(slug: string): Promise<boolean> {
    const filepath = this.getFilePath(slug);

    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete an entry (or mark as archived)
   *
   * @param slug - Filename without extension
   * @param permanent - If true, delete file; if false, set status to archived
   */
  async delete(slug: string, permanent = false): Promise<void> {
    const filepath = this.getFilePath(slug);

    if (permanent) {
      // Hard delete - remove file
      try {
        await fs.unlink(filepath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new KnowledgeStorageError(`Entry not found: ${slug}`, 'NOT_FOUND');
        }
        throw new KnowledgeStorageError(
          `Failed to delete knowledge entry: ${filepath}`,
          'WRITE_ERROR',
          error instanceof Error ? error : undefined
        );
      }
    } else {
      // Soft delete - mark as archived
      const existing = await this.get(slug);
      if (!existing) {
        throw new KnowledgeStorageError(`Entry not found: ${slug}`, 'NOT_FOUND');
      }

      // Update status to archived
      const frontmatter: KnowledgeEntryFrontmatter = {
        type: existing.type,
        title: existing.title,
        summary: existing.summary,
        created_at: existing.created_at,
        updated_at: new Date().toISOString(),
        source: existing.source,
        classification: existing.classification,
        status: 'archived',
      };

      const mdcContent = generateMdcFile(frontmatter, existing.content);

      try {
        await fs.writeFile(filepath, mdcContent, 'utf-8');
      } catch (error) {
        throw new KnowledgeStorageError(
          `Failed to archive knowledge entry: ${filepath}`,
          'WRITE_ERROR',
          error instanceof Error ? error : undefined
        );
      }
    }
  }

  /**
   * Check if the knowledge base directory exists and is accessible
   */
  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.ensureDir();

      const files = await fs.readdir(this.baseDir);
      const mdcFiles = files.filter((f) => f.endsWith('.mdc'));

      return {
        ok: true,
        path: this.baseDir,
        entryCount: mdcFiles.length,
      };
    } catch (error) {
      return {
        ok: false,
        path: this.baseDir,
        entryCount: 0,
      };
    }
  }

  /**
   * Remove all .mdc files from the directory
   *
   * Used primarily for testing. Use with caution in production.
   */
  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.baseDir);
      const mdcFiles = files.filter((f) => f.endsWith('.mdc'));

      await Promise.all(
        mdcFiles.map((filename) => fs.unlink(path.join(this.baseDir, filename)))
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Directory doesn't exist, nothing to clear
        return;
      }
      throw new KnowledgeStorageError(
        `Failed to clear knowledge directory: ${this.baseDir}`,
        'WRITE_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }
}
