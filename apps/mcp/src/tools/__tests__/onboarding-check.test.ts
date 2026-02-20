/**
 * Tests for onboarding status checker
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { KnowledgeEntry, KnowledgeStorageService } from '../../knowledge/storage/types.js';
import {
  type OnboardingStatus,
  buildMissingOrgContextMarkdown,
  buildMissingProjectContextMarkdown,
  buildOnboardingHints,
  checkOnboardingStatus,
  generateProjectHash,
} from '../onboarding-check.js';

// Mock storage
function createMockStorage(): KnowledgeStorageService {
  return {
    list: vi.fn(),
    get: vi.fn(),
    save: vi.fn(),
    exists: vi.fn(),
    delete: vi.fn(),
    healthCheck: vi.fn(),
  };
}

// Helper to create mock KB entries
function createMockEntry(slug: string): KnowledgeEntry {
  return {
    slug,
    type: 'knowledge',
    title: `Entry: ${slug}`,
    summary: 'Test entry',
    content: 'Test content',
    created_at: '2026-02-19T00:00:00.000Z',
    updated_at: '2026-02-19T00:00:00.000Z',
    source: { file: 'test.md', project: '/test', path: null },
    classification: {
      category: 'context',
      confidence: 0.9,
      reasoning: 'Test',
      topics: [],
    },
    status: 'active',
  };
}

describe('generateProjectHash', () => {
  it('generates consistent 6-character hex hash', () => {
    const hash = generateProjectHash('/Users/dev/projects/my-app');
    expect(hash).toHaveLength(6);
    expect(hash).toMatch(/^[0-9a-f]{6}$/);
  });

  it('generates same hash for same path', () => {
    const path = '/Users/dev/projects/my-app';
    const hash1 = generateProjectHash(path);
    const hash2 = generateProjectHash(path);
    expect(hash1).toBe(hash2);
  });

  it('generates different hashes for different paths', () => {
    const hash1 = generateProjectHash('/Users/dev/project-a');
    const hash2 = generateProjectHash('/Users/dev/project-b');
    expect(hash1).not.toBe(hash2);
  });
});

describe('checkOnboardingStatus', () => {
  let storage: KnowledgeStorageService;

  beforeEach(() => {
    storage = createMockStorage();
  });

  it('returns both false when KB is empty', async () => {
    vi.mocked(storage.list).mockResolvedValue([]);

    const status = await checkOnboardingStatus(storage, '/test/project');

    expect(status.hasOrgContext).toBe(false);
    expect(status.hasProjectContext).toBe(false);
    expect(status.orgContextSlug).toBeUndefined();
    expect(status.projectContextSlug).toBeUndefined();
  });

  it('detects org context by slug prefix', async () => {
    vi.mocked(storage.list).mockResolvedValue([
      createMockEntry('org-context'),
      createMockEntry('unrelated-doc'),
    ]);

    const status = await checkOnboardingStatus(storage, '/test/project');

    expect(status.hasOrgContext).toBe(true);
    expect(status.orgContextSlug).toBe('org-context');
    expect(status.hasProjectContext).toBe(false);
  });

  it('detects org context with suffix variations', async () => {
    vi.mocked(storage.list).mockResolvedValue([
      createMockEntry('org-context-1'), // In case of multiple versions
    ]);

    const status = await checkOnboardingStatus(storage, '/test/project');

    expect(status.hasOrgContext).toBe(true);
    expect(status.orgContextSlug).toBe('org-context-1');
  });

  it('detects project context by exact hash match', async () => {
    const projectPath = '/test/project';
    const expectedHash = generateProjectHash(projectPath);
    const expectedSlug = `project-context-${expectedHash}`;

    vi.mocked(storage.list).mockResolvedValue([createMockEntry(expectedSlug)]);

    const status = await checkOnboardingStatus(storage, projectPath);

    expect(status.hasProjectContext).toBe(true);
    expect(status.projectContextSlug).toBe(expectedSlug);
    expect(status.expectedProjectSlug).toBe(expectedSlug);
  });

  it('does not match project context with different hash', async () => {
    // Create a project context for a different project
    const otherHash = generateProjectHash('/other/project');
    vi.mocked(storage.list).mockResolvedValue([createMockEntry(`project-context-${otherHash}`)]);

    const status = await checkOnboardingStatus(storage, '/test/project');

    expect(status.hasProjectContext).toBe(false);
    expect(status.projectContextSlug).toBeUndefined();
  });

  it('detects both contexts when present', async () => {
    const projectPath = '/test/project';
    const expectedHash = generateProjectHash(projectPath);
    const expectedSlug = `project-context-${expectedHash}`;

    vi.mocked(storage.list).mockResolvedValue([
      createMockEntry('org-context'),
      createMockEntry(expectedSlug),
      createMockEntry('other-doc'),
    ]);

    const status = await checkOnboardingStatus(storage, projectPath);

    expect(status.hasOrgContext).toBe(true);
    expect(status.hasProjectContext).toBe(true);
    expect(status.orgContextSlug).toBe('org-context');
    expect(status.projectContextSlug).toBe(expectedSlug);
  });

  it('provides expected project slug for reference', async () => {
    vi.mocked(storage.list).mockResolvedValue([]);

    const projectPath = '/my/specific/path';
    const status = await checkOnboardingStatus(storage, projectPath);

    const expectedHash = generateProjectHash(projectPath);
    expect(status.expectedProjectSlug).toBe(`project-context-${expectedHash}`);
  });
});

describe('buildMissingOrgContextMarkdown', () => {
  it('includes instruction to say "set up org context"', () => {
    const markdown = buildMissingOrgContextMarkdown();
    expect(markdown).toContain('set up org context');
    expect(markdown).toContain('Organization Context Required');
  });

  it('includes hints section', () => {
    const markdown = buildMissingOrgContextMarkdown();
    expect(markdown).toContain('<hints>');
    expect(markdown).toContain('</hints>');
  });
});

describe('buildMissingProjectContextMarkdown', () => {
  it('includes instruction to say "set up project context"', () => {
    const markdown = buildMissingProjectContextMarkdown();
    expect(markdown).toContain('set up project context');
    expect(markdown).toContain('Project Context Required');
  });

  it('mentions org context exists', () => {
    const markdown = buildMissingProjectContextMarkdown();
    expect(markdown).toContain('organization context');
  });
});

describe('buildOnboardingHints', () => {
  it('returns empty string when both contexts exist', () => {
    const status: OnboardingStatus = {
      hasOrgContext: true,
      hasProjectContext: true,
      orgContextSlug: 'org-context',
      projectContextSlug: 'project-context-abc123',
      expectedProjectSlug: 'project-context-abc123',
    };

    const hints = buildOnboardingHints(status);
    expect(hints).toBe('');
  });

  it('returns org context hint when missing', () => {
    const status: OnboardingStatus = {
      hasOrgContext: false,
      hasProjectContext: true,
      projectContextSlug: 'project-context-abc123',
      expectedProjectSlug: 'project-context-abc123',
    };

    const hints = buildOnboardingHints(status);
    expect(hints).toContain('set up org context');
    expect(hints).not.toContain('set up project context');
  });

  it('returns project context hint when missing', () => {
    const status: OnboardingStatus = {
      hasOrgContext: true,
      hasProjectContext: false,
      orgContextSlug: 'org-context',
      expectedProjectSlug: 'project-context-abc123',
    };

    const hints = buildOnboardingHints(status);
    expect(hints).toContain('set up project context');
    expect(hints).not.toContain('set up org context');
  });

  it('returns both hints when both missing', () => {
    const status: OnboardingStatus = {
      hasOrgContext: false,
      hasProjectContext: false,
      expectedProjectSlug: 'project-context-abc123',
    };

    const hints = buildOnboardingHints(status);
    expect(hints).toContain('set up org context');
    expect(hints).toContain('set up project context');
  });
});
