/**
 * Answer Cache Service
 *
 * Provides caching for kahuna_ask responses to avoid redundant LLM calls.
 * Cache is invalidated when the knowledge base changes.
 *
 * Cache Strategy:
 * - Key: hash(question + kb_version)
 * - KB Version: hash of all entry slugs + updated_at timestamps
 * - Storage: .kahuna-knowledge/.cache/answers.json
 * - Eviction: LRU with max 100 entries
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { KnowledgeEntry } from './types.js';

/**
 * Cached answer entry
 */
export interface CachedAnswer {
  questionHash: string;
  question: string;
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  sources: Array<{
    title: string;
    slug: string;
    relevanceScore: number;
    excerpt: string;
    category: string;
  }>;
  suggestedFollowups: string[];
  kbVersion: string;
  timestamp: string;
  accessCount: number;
  lastAccessed: string;
}

/**
 * Cache file structure
 */
interface CacheFile {
  version: '1.0';
  kbVersion: string;
  entries: Record<string, CachedAnswer>;
  metadata: {
    createdAt: string;
    lastUpdated: string;
    totalQueries: number;
    cacheHits: number;
  };
}

/**
 * Options for AnswerCache
 */
export interface AnswerCacheOptions {
  maxEntries?: number;
  cacheDir?: string;
}

const DEFAULT_MAX_ENTRIES = 100;
const CACHE_FILENAME = 'answers.json';

/**
 * Generate a hash for a string
 */
function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
}

/**
 * Generate KB version hash from entries
 */
export function generateKbVersion(entries: KnowledgeEntry[]): string {
  const versionData = entries
    .map((e) => `${e.slug}:${e.updated_at}`)
    .sort()
    .join('|');
  return hashString(versionData);
}

/**
 * Answer Cache Service
 *
 * Manages caching of kahuna_ask responses with automatic invalidation
 * when the knowledge base changes.
 */
export class AnswerCacheService {
  private readonly cacheDir: string;
  private readonly cacheFilePath: string;
  private readonly maxEntries: number;
  private cache: CacheFile | null = null;
  private dirEnsured = false;

  constructor(baseDir: string, options: AnswerCacheOptions = {}) {
    this.cacheDir = path.join(baseDir, '.cache');
    this.cacheFilePath = path.join(this.cacheDir, CACHE_FILENAME);
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureDir(): Promise<void> {
    if (this.dirEnsured) return;

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.dirEnsured = true;
    } catch (error) {
      // Directory might already exist
      this.dirEnsured = true;
    }
  }

  /**
   * Load cache from disk
   */
  private async loadCache(): Promise<CacheFile> {
    if (this.cache) return this.cache;

    await this.ensureDir();

    try {
      const content = await fs.readFile(this.cacheFilePath, 'utf-8');
      this.cache = JSON.parse(content) as CacheFile;
      return this.cache;
    } catch (error) {
      // Cache doesn't exist or is corrupted, create new
      const newCache: CacheFile = {
        version: '1.0',
        kbVersion: '',
        entries: {},
        metadata: {
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          totalQueries: 0,
          cacheHits: 0,
        },
      };
      this.cache = newCache;
      return newCache;
    }
  }

  /**
   * Save cache to disk
   */
  private async saveCache(): Promise<void> {
    if (!this.cache) return;

    await this.ensureDir();
    this.cache.metadata.lastUpdated = new Date().toISOString();

    await fs.writeFile(this.cacheFilePath, JSON.stringify(this.cache, null, 2), 'utf-8');
  }

  /**
   * Generate cache key from question and KB version
   */
  private generateCacheKey(question: string, kbVersion: string): string {
    return hashString(`${question.toLowerCase().trim()}:${kbVersion}`);
  }

  /**
   * Get cached answer if available and valid
   *
   * @param question - The question to look up
   * @param currentKbVersion - Current KB version hash
   * @returns Cached answer or null if not found/invalid
   */
  async get(question: string, currentKbVersion: string): Promise<CachedAnswer | null> {
    const cache = await this.loadCache();

    // Check if KB version changed (invalidates entire cache)
    if (cache.kbVersion !== currentKbVersion) {
      // KB changed, invalidate cache
      cache.entries = {};
      cache.kbVersion = currentKbVersion;
      await this.saveCache();
      return null;
    }

    const key = this.generateCacheKey(question, currentKbVersion);
    const entry = cache.entries[key];

    if (!entry) {
      cache.metadata.totalQueries++;
      await this.saveCache();
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = new Date().toISOString();
    cache.metadata.totalQueries++;
    cache.metadata.cacheHits++;
    await this.saveCache();

    return entry;
  }

  /**
   * Store an answer in cache
   *
   * @param question - The question
   * @param answer - Answer data to cache
   * @param currentKbVersion - Current KB version hash
   */
  async set(
    question: string,
    answer: Omit<
      CachedAnswer,
      'questionHash' | 'kbVersion' | 'timestamp' | 'accessCount' | 'lastAccessed'
    >,
    currentKbVersion: string
  ): Promise<void> {
    const cache = await this.loadCache();

    // Update KB version
    cache.kbVersion = currentKbVersion;

    const key = this.generateCacheKey(question, currentKbVersion);
    const now = new Date().toISOString();

    cache.entries[key] = {
      ...answer,
      questionHash: key,
      kbVersion: currentKbVersion,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    };

    // Enforce max entries with LRU eviction
    const entries = Object.entries(cache.entries);
    if (entries.length > this.maxEntries) {
      // Sort by lastAccessed (oldest first)
      entries.sort(
        (a, b) => new Date(a[1].lastAccessed).getTime() - new Date(b[1].lastAccessed).getTime()
      );

      // Remove oldest entries
      const toRemove = entries.length - this.maxEntries;
      for (let i = 0; i < toRemove; i++) {
        delete cache.entries[entries[i][0]];
      }
    }

    await this.saveCache();
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    this.cache = null;

    try {
      await fs.unlink(this.cacheFilePath);
    } catch {
      // File might not exist
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    entryCount: number;
    hitRate: number;
    totalQueries: number;
    cacheHits: number;
    kbVersion: string;
  }> {
    const cache = await this.loadCache();
    const hitRate =
      cache.metadata.totalQueries > 0 ? cache.metadata.cacheHits / cache.metadata.totalQueries : 0;

    return {
      entryCount: Object.keys(cache.entries).length,
      hitRate,
      totalQueries: cache.metadata.totalQueries,
      cacheHits: cache.metadata.cacheHits,
      kbVersion: cache.kbVersion,
    };
  }
}
