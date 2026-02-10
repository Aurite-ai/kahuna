/**
 * Tests for context writer
 *
 * Tests clearContextDir, writeContextFile, writeContextReadme, listContextFiles.
 * Uses real temp directories for filesystem tests.
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearContextDir,
  listContextFiles,
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
});
