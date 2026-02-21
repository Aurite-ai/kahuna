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
  buildOnboardingWarningBanner,
  checkOnboardingStatus,
  generateProjectHash,
  isOrgContextSlug,
  isProjectContextSlug,
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

describe('isOrgContextSlug', () => {
  it('matches canonical "org-context" slug', () => {
    expect(isOrgContextSlug('org-context')).toBe(true);
  });

  it('matches "organization-context" slug', () => {
    expect(isOrgContextSlug('organization-context')).toBe(true);
  });

  it('matches "organization-wide-context" slug (real-world case)', () => {
    expect(isOrgContextSlug('organization-wide-context')).toBe(true);
  });

  it('matches "org-context-1" (versioned)', () => {
    expect(isOrgContextSlug('org-context-1')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(isOrgContextSlug('ORG-CONTEXT')).toBe(true);
    expect(isOrgContextSlug('Organization-Context')).toBe(true);
  });

  it('does not match unrelated slugs', () => {
    expect(isOrgContextSlug('project-context-abc123')).toBe(false);
    expect(isOrgContextSlug('api-design-guidelines')).toBe(false);
    expect(isOrgContextSlug('context-only')).toBe(false);
    expect(isOrgContextSlug('org-only')).toBe(false);
  });
});

describe('isProjectContextSlug', () => {
  it('matches canonical "project-context-{hash}" slug', () => {
    expect(isProjectContextSlug('project-context-abc123', 'abc123')).toBe(true);
  });

  it('matches verbose title slugs with hash (real-world case)', () => {
    // This is the actual slug that caused the bug
    expect(
      isProjectContextSlug('project-business-context-and-success-criteria-36d725ab', '36d725')
    ).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(isProjectContextSlug('PROJECT-CONTEXT-ABC123', 'abc123')).toBe(true);
  });

  it('does not match without hash', () => {
    expect(isProjectContextSlug('project-context', 'abc123')).toBe(false);
  });

  it('does not match with different hash', () => {
    expect(isProjectContextSlug('project-context-xyz789', 'abc123')).toBe(false);
  });

  it('does not match org context', () => {
    expect(isProjectContextSlug('org-context', 'abc123')).toBe(false);
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

  it('detects org context with verbose title (real-world bug fix)', async () => {
    // This is the actual slug that caused the original bug
    vi.mocked(storage.list).mockResolvedValue([createMockEntry('organization-wide-context')]);

    const status = await checkOnboardingStatus(storage, '/test/project');

    expect(status.hasOrgContext).toBe(true);
    expect(status.orgContextSlug).toBe('organization-wide-context');
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

  it('detects project context with verbose title (real-world bug fix)', async () => {
    const projectPath = '/test/project';
    const expectedHash = generateProjectHash(projectPath);
    // This is the actual slug pattern that caused the original bug
    const verboseSlug = `project-business-context-and-success-criteria-${expectedHash}ab`;

    vi.mocked(storage.list).mockResolvedValue([createMockEntry(verboseSlug)]);

    const status = await checkOnboardingStatus(storage, projectPath);

    expect(status.hasProjectContext).toBe(true);
    expect(status.projectContextSlug).toBe(verboseSlug);
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

describe('buildOnboardingWarningBanner', () => {
  it('returns empty string when both contexts exist', () => {
    const status: OnboardingStatus = {
      hasOrgContext: true,
      hasProjectContext: true,
      orgContextSlug: 'org-context',
      projectContextSlug: 'project-context-abc123',
      expectedProjectSlug: 'project-context-abc123',
    };

    const banner = buildOnboardingWarningBanner(status);
    expect(banner).toBe('');
  });

  it('returns org context warning banner when missing', () => {
    const status: OnboardingStatus = {
      hasOrgContext: false,
      hasProjectContext: true,
      projectContextSlug: 'project-context-abc123',
      expectedProjectSlug: 'project-context-abc123',
    };

    const banner = buildOnboardingWarningBanner(status);
    expect(banner).toContain('⚠️ Organization Context Missing');
    expect(banner).toContain('set up org context');
    expect(banner).toContain('---'); // Contains separator
    expect(banner).not.toContain('⚠️ Project Context Missing');
  });

  it('returns project context warning banner when missing', () => {
    const status: OnboardingStatus = {
      hasOrgContext: true,
      hasProjectContext: false,
      orgContextSlug: 'org-context',
      expectedProjectSlug: 'project-context-abc123',
    };

    const banner = buildOnboardingWarningBanner(status);
    expect(banner).toContain('⚠️ Project Context Missing');
    expect(banner).toContain('set up project context');
    expect(banner).toContain('You have organization context, but no project context');
    expect(banner).not.toContain('⚠️ Organization Context Missing');
  });

  it('returns both warning banners when both missing', () => {
    const status: OnboardingStatus = {
      hasOrgContext: false,
      hasProjectContext: false,
      expectedProjectSlug: 'project-context-abc123',
    };

    const banner = buildOnboardingWarningBanner(status);
    expect(banner).toContain('⚠️ Organization Context Missing');
    expect(banner).toContain('⚠️ Project Context Missing');
    expect(banner).toContain('set up org context');
    expect(banner).toContain('set up project context');
  });

  it('project context message differs based on org context status', () => {
    const statusWithOrg: OnboardingStatus = {
      hasOrgContext: true,
      hasProjectContext: false,
      orgContextSlug: 'org-context',
      expectedProjectSlug: 'project-context-abc123',
    };

    const statusWithoutOrg: OnboardingStatus = {
      hasOrgContext: false,
      hasProjectContext: false,
      expectedProjectSlug: 'project-context-abc123',
    };

    const bannerWithOrg = buildOnboardingWarningBanner(statusWithOrg);
    const bannerWithoutOrg = buildOnboardingWarningBanner(statusWithoutOrg);

    expect(bannerWithOrg).toContain('You have organization context, but no project context');
    expect(bannerWithoutOrg).toContain('No project context exists');
    expect(bannerWithoutOrg).not.toContain('You have organization context');
  });
});
