/**
 * Initialize tool tests
 *
 * Validates that KB seed files are well-formed .mdc files
 * parseable by the knowledge storage utilities.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseMdcFile } from '../../knowledge/storage/utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Resolve the seed templates directory (now at apps/mcp/templates/) */
const seedTemplatesDir = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'templates',
  'knowledge-base'
);

describe('KB seed files', () => {
  it('seed templates directory exists', async () => {
    const stat = await fs.stat(seedTemplatesDir);
    expect(stat.isDirectory()).toBe(true);
  });

  it('contains at least one .mdc file', async () => {
    const files = await fs.readdir(seedTemplatesDir);
    const mdcFiles = files.filter((f) => f.endsWith('.mdc'));
    expect(mdcFiles.length).toBeGreaterThan(0);
  });

  it('langgraph-best-practices.mdc is a valid .mdc file with correct frontmatter', async () => {
    const filePath = path.join(seedTemplatesDir, 'langgraph-best-practices.mdc');
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = parseMdcFile(content);

    // Frontmatter validation
    expect(parsed.frontmatter.type).toBe('knowledge');
    expect(parsed.frontmatter.title).toBe('LangGraph Best Practices');
    expect(parsed.frontmatter.summary).toBeTruthy();
    expect(parsed.frontmatter.classification.category).toBe('reference');
    expect(parsed.frontmatter.classification.confidence).toBe(1.0);
    expect(parsed.frontmatter.classification.topics).toContain('LangGraph');
    expect(parsed.frontmatter.source.file).toBe('langgraph-best-practices.mdc');
    expect(parsed.frontmatter.source.project).toBeNull();
    expect(parsed.frontmatter.status).toBe('active');

    // Body content validation
    expect(parsed.body).toContain('# LangGraph Best Practices');
    expect(parsed.body).toContain('## Core Concepts');
    expect(parsed.body.length).toBeGreaterThan(100);
  });

  it('all .mdc seed files are parseable', async () => {
    const files = await fs.readdir(seedTemplatesDir);
    const mdcFiles = files.filter((f) => f.endsWith('.mdc'));

    for (const file of mdcFiles) {
      const filePath = path.join(seedTemplatesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');

      // Should not throw
      const parsed = parseMdcFile(content);
      expect(parsed.frontmatter.type).toBe('knowledge');
      expect(parsed.frontmatter.title).toBeTruthy();
      expect(parsed.body.length).toBeGreaterThan(0);
    }
  });
});
