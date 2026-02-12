/**
 * Tests for context writer
 *
 * Tests clearContextDir, writeContextFile, writeContextReadme, listContextFiles,
 * shouldReferenceLocally, and getRelativeLocalPath.
 * Uses real temp directories for filesystem tests.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry } from '../../storage/types.js';
import {
  clearContextDir,
  getRelativeLocalPath,
  listContextFiles,
  shouldReferenceLocally,
  writeContextFile,
  writeContextReadme,
} from '../context-writer.js';

describe('context-writer', () => {
  let contextDir: string;

  beforeEach(async () => {
    contextDir = path.join(
      os.tmpdir(),
      `kahuna-context-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(contextDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('clearContextDir', () => {
    it('creates directory if it does not exist', async () => {
      await clearContextDir(contextDir);

      const stat = await fs.stat(contextDir);
      expect(stat.isDirectory()).toBe(true);
    });

    it('removes all files from existing directory', async () => {
      await fs.mkdir(contextDir, { recursive: true });
      await fs.writeFile(path.join(contextDir, 'file1.md'), 'content1');
      await fs.writeFile(path.join(contextDir, 'file2.md'), 'content2');
      await fs.writeFile(path.join(contextDir, 'README.md'), 'readme');

      await clearContextDir(contextDir);

      const files = await fs.readdir(contextDir);
      expect(files).toHaveLength(0);
    });

    it('handles empty directory without error', async () => {
      await fs.mkdir(contextDir, { recursive: true });

      await expect(clearContextDir(contextDir)).resolves.not.toThrow();
    });
  });

  describe('writeContextFile', () => {
    beforeEach(async () => {
      await fs.mkdir(contextDir, { recursive: true });
    });

    it('strips frontmatter and writes .md file', async () => {
      const mdcContent = `---
type: knowledge
title: API Guidelines
summary: API standards.
created_at: "2026-02-10T00:00:00.000Z"
updated_at: "2026-02-10T00:00:00.000Z"
source:
  file: api.md
  project: /test
  path: /test/api.md
classification:
  category: policy
  confidence: 0.9
  reasoning: Contains rules
  topics:
    - API
status: active
---

# API Design Guidelines

Follow these rules for API design.`;

      await writeContextFile(contextDir, 'api-guidelines', mdcContent);

      const filepath = path.join(contextDir, 'api-guidelines.md');
      const content = await fs.readFile(filepath, 'utf-8');

      expect(content).toBe('# API Design Guidelines\n\nFollow these rules for API design.');
      expect(content).not.toContain('---');
      expect(content).not.toContain('type: knowledge');
    });

    it('handles content without frontmatter', async () => {
      const plainContent = '# Just Markdown\n\nNo frontmatter here.';

      await writeContextFile(contextDir, 'plain-file', plainContent);

      const filepath = path.join(contextDir, 'plain-file.md');
      const content = await fs.readFile(filepath, 'utf-8');

      expect(content).toBe(plainContent);
    });
  });

  describe('writeContextReadme', () => {
    beforeEach(async () => {
      await fs.mkdir(contextDir, { recursive: true });
    });

    it('generates README.md with file table', async () => {
      const selections = [
        { slug: 'api-guidelines', reason: 'Contains rate limiting rules' },
        { slug: 'error-patterns', reason: 'Error handling for rate limits' },
      ];

      await writeContextReadme(contextDir, 'Add rate limiting to search', selections);

      const readme = await fs.readFile(path.join(contextDir, 'README.md'), 'utf-8');

      expect(readme).toContain('# Context for: Add rate limiting to search');
      expect(readme).toContain('| File | Why Relevant |');
      expect(readme).toContain('api-guidelines.md');
      expect(readme).toContain('Contains rate limiting rules');
      expect(readme).toContain('error-patterns.md');
      expect(readme).toContain('Error handling for rate limits');
    });

    it('includes Start Here section with first 3 items', async () => {
      const selections = [
        { slug: 'file-a', reason: 'Reason A' },
        { slug: 'file-b', reason: 'Reason B' },
        { slug: 'file-c', reason: 'Reason C' },
        { slug: 'file-d', reason: 'Reason D' },
      ];

      await writeContextReadme(contextDir, 'Test task', selections);

      const readme = await fs.readFile(path.join(contextDir, 'README.md'), 'utf-8');

      expect(readme).toContain('## Start Here');
      expect(readme).toContain('1. Review file-a.md');
      expect(readme).toContain('2. Review file-b.md');
      expect(readme).toContain('3. Review file-c.md');
      // 4th item should not be in Start Here
      expect(readme).not.toContain('4. Review file-d.md');
    });

    it('includes date and Kahuna attribution', async () => {
      await writeContextReadme(contextDir, 'Test', [{ slug: 'test', reason: 'Test reason' }]);

      const readme = await fs.readFile(path.join(contextDir, 'README.md'), 'utf-8');

      expect(readme).toContain('Surfaced from Kahuna knowledge base on');
      expect(readme).toContain('Prepared by Kahuna');
      expect(readme).toContain('kahuna_ask');
    });

    it('includes Local Project Files section when referencedFiles provided', async () => {
      const selections = [{ slug: 'copied-file', reason: 'Copied to context' }];
      const referencedFiles = [
        { slug: 'local-doc', reason: 'From local project', localPath: 'docs/api-design.md' },
      ];

      await writeContextReadme(contextDir, 'Test with local files', selections, referencedFiles);

      const readme = await fs.readFile(path.join(contextDir, 'README.md'), 'utf-8');

      expect(readme).toContain('## Local Project Files');
      expect(readme).toContain('These KB entries originated from files in your project');
      expect(readme).toContain('local-doc');
      expect(readme).toContain('docs/api-design.md');
      expect(readme).toContain('../docs/api-design.md'); // Link format
    });

    it('includes Framework section when frameworkResult provided with copied files', async () => {
      const selections = [{ slug: 'test-file', reason: 'Test' }];
      const frameworkResult = {
        framework: 'langgraph',
        displayName: 'LangGraph',
        copiedFiles: ['src/agent.py', 'src/tools.py'],
        skippedFiles: [] as string[],
        success: true,
        kbDocSlug: 'langgraph-best-practices',
      };

      await writeContextReadme(contextDir, 'Build agent', selections, undefined, frameworkResult);

      const readme = await fs.readFile(path.join(contextDir, 'README.md'), 'utf-8');

      expect(readme).toContain('## Framework');
      expect(readme).toContain('Framework: **LangGraph**');
      expect(readme).toContain('Boilerplate files added to your project');
      expect(readme).toContain('[README.md](../README.md)');
    });

    it('does not include Framework section when no files were copied', async () => {
      const selections = [{ slug: 'test-file', reason: 'Test' }];
      const frameworkResult = {
        framework: 'langgraph',
        displayName: 'LangGraph',
        copiedFiles: [] as string[],
        skippedFiles: ['src/agent.py'], // All files skipped
        success: true,
        kbDocSlug: 'langgraph-best-practices',
      };

      await writeContextReadme(contextDir, 'Build agent', selections, undefined, frameworkResult);

      const readme = await fs.readFile(path.join(contextDir, 'README.md'), 'utf-8');

      expect(readme).not.toContain('## Framework');
    });
  });

  describe('listContextFiles', () => {
    it('returns .md filenames from context directory', async () => {
      await fs.mkdir(contextDir, { recursive: true });
      await fs.writeFile(path.join(contextDir, 'api-guidelines.md'), 'content');
      await fs.writeFile(path.join(contextDir, 'error-patterns.md'), 'content');
      await fs.writeFile(path.join(contextDir, 'README.md'), 'readme');

      const files = await listContextFiles(contextDir);

      expect(files).toHaveLength(3);
      expect(files).toContain('api-guidelines.md');
      expect(files).toContain('error-patterns.md');
      expect(files).toContain('README.md');
    });

    it('returns empty array if directory does not exist', async () => {
      const nonExistent = path.join(os.tmpdir(), `nonexistent-${Date.now()}`);

      const files = await listContextFiles(nonExistent);

      expect(files).toEqual([]);
    });

    it('excludes non-.md files', async () => {
      await fs.mkdir(contextDir, { recursive: true });
      await fs.writeFile(path.join(contextDir, 'file.md'), 'md content');
      await fs.writeFile(path.join(contextDir, 'file.txt'), 'txt content');
      await fs.writeFile(path.join(contextDir, 'file.json'), 'json content');

      const files = await listContextFiles(contextDir);

      expect(files).toEqual(['file.md']);
    });

    it('returns empty array for empty directory', async () => {
      await fs.mkdir(contextDir, { recursive: true });

      const files = await listContextFiles(contextDir);

      expect(files).toEqual([]);
    });
  });

  describe('shouldReferenceLocally', () => {
    let inProjectDir: string;
    let inProjectFile: string;
    let inProjectRelativePath: string;
    let externalDir: string;
    let externalFile: string;
    let externalRelativePath: string;

    beforeEach(async () => {
      // Create a file inside cwd for testing (should be referenced)
      inProjectDir = path.join(process.cwd(), 'test-local-ref');
      await fs.mkdir(inProjectDir, { recursive: true });
      inProjectFile = path.join(inProjectDir, 'test.md');
      inProjectRelativePath = path.relative(process.cwd(), inProjectFile);
      await fs.writeFile(inProjectFile, '# Test content');

      // Create a file outside cwd for testing (should NOT be referenced)
      externalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kahuna-external-'));
      externalFile = path.join(externalDir, 'external.md');
      externalRelativePath = path.relative(process.cwd(), externalFile);
      await fs.writeFile(externalFile, '# External content');
    });

    afterEach(async () => {
      try {
        await fs.rm(inProjectDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
      try {
        await fs.rm(externalDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    });

    function createMockEntry(overrides?: Partial<KnowledgeEntry>): KnowledgeEntry {
      return {
        slug: 'test-entry',
        type: 'knowledge',
        title: 'Test Entry',
        summary: 'Test summary',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: {
          file: 'test.md',
          project: null,
          path: null,
        },
        classification: {
          category: 'reference',
          confidence: 0.9,
          reasoning: 'Test',
          topics: ['test'],
        },
        status: 'active',
        content: '# Test',
        ...overrides,
      };
    }

    it('returns false when source.path is null', async () => {
      const entry = createMockEntry({
        source: { file: 'test.md', project: process.cwd(), path: null },
      });

      const result = await shouldReferenceLocally(entry);

      expect(result).toBe(false);
    });

    it('returns false when source.path file does not exist', async () => {
      const entry = createMockEntry({
        source: { file: 'nonexistent.md', project: process.cwd(), path: 'nonexistent/file.md' },
      });

      const result = await shouldReferenceLocally(entry);

      expect(result).toBe(false);
    });

    it('returns true when source.path exists inside cwd', async () => {
      const entry = createMockEntry({
        source: { file: 'test.md', project: '/some/other/project', path: inProjectRelativePath },
      });

      const result = await shouldReferenceLocally(entry);

      expect(result).toBe(true);
    });

    it('returns false when source.path exists but is outside cwd', async () => {
      const entry = createMockEntry({
        source: { file: 'external.md', project: '/external/project', path: externalRelativePath },
      });

      const result = await shouldReferenceLocally(entry);

      // File exists but is outside the project directory - should NOT be referenced
      expect(result).toBe(false);
    });
  });

  describe('getRelativeLocalPath', () => {
    it('returns source.path when available', () => {
      const entry = {
        slug: 'test',
        title: 'Test',
        summary: 'Test',
        content: 'content',
        source: {
          file: 'api-design.md',
          path: 'docs/api-design.md',
          project: process.cwd(),
        },
      } as KnowledgeEntry;

      const result = getRelativeLocalPath(entry);

      expect(result).toBe('docs/api-design.md');
    });

    it('falls back to source.file when source.path is not available', () => {
      const entry = {
        slug: 'test',
        title: 'Test',
        summary: 'Test',
        content: 'content',
        source: {
          file: 'api-design.md',
          project: process.cwd(),
        },
      } as KnowledgeEntry;

      const result = getRelativeLocalPath(entry);

      expect(result).toBe('api-design.md');
    });

    it('converts absolute path to relative path from cwd', () => {
      const absolutePath = path.join(process.cwd(), 'docs', 'api-design.md');
      const entry = {
        slug: 'test',
        title: 'Test',
        summary: 'Test',
        content: 'content',
        source: {
          file: 'api-design.md',
          path: absolutePath,
          project: process.cwd(),
        },
      } as KnowledgeEntry;

      const result = getRelativeLocalPath(entry);

      expect(result).toBe(path.join('docs', 'api-design.md'));
    });

    it('returns empty string when no source', () => {
      const entry = {
        slug: 'test',
        title: 'Test',
        summary: 'Test',
        content: 'content',
      } as KnowledgeEntry;

      const result = getRelativeLocalPath(entry);

      expect(result).toBe('');
    });
  });
});
