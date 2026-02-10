/**
 * Tests for knowledge storage utility functions
 *
 * Based on existing storage/__tests__/utils.test.ts,
 * updated for simplified types and new stripFrontmatter function.
 */

import { describe, expect, it } from 'vitest';
import type { KnowledgeEntryFrontmatter } from '../types.js';
import {
  generateMdcFile,
  generateSlug,
  parseMdcFile,
  stripFrontmatter,
  validateCategory,
} from '../utils.js';

describe('generateSlug', () => {
  it('converts basic title to lowercase hyphenated slug', () => {
    expect(generateSlug('API Design Guidelines')).toBe('api-design-guidelines');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
    expect(generateSlug('Test@#$%File')).toBe('testfile');
    expect(generateSlug('Price: $100')).toBe('price-100');
  });

  it('handles multiple spaces', () => {
    expect(generateSlug('  Multiple   Spaces  ')).toBe('multiple-spaces');
  });

  it('handles multiple hyphens', () => {
    expect(generateSlug('test--double---hyphens')).toBe('test-double-hyphens');
  });

  it('handles unicode characters', () => {
    expect(generateSlug('Café Résumé')).toBe('cafe-resume');
    expect(generateSlug('日本語タイトル')).toBe(''); // Non-latin chars removed
    expect(generateSlug('Mixed 日本語 Title')).toBe('mixed-title');
  });

  it('handles edge cases', () => {
    expect(generateSlug('')).toBe('');
    expect(generateSlug('   ')).toBe('');
    expect(generateSlug('---')).toBe('');
    expect(generateSlug('a')).toBe('a');
  });

  it('preserves numbers', () => {
    expect(generateSlug('Version 2.0 Release')).toBe('version-20-release');
    expect(generateSlug('123 Test')).toBe('123-test');
  });
});

describe('validateCategory', () => {
  it('accepts all valid knowledge categories', () => {
    expect(validateCategory('policy')).toBe('policy');
    expect(validateCategory('requirement')).toBe('requirement');
    expect(validateCategory('reference')).toBe('reference');
    expect(validateCategory('decision')).toBe('decision');
    expect(validateCategory('pattern')).toBe('pattern');
    expect(validateCategory('context')).toBe('context');
  });

  it('handles case insensitivity', () => {
    expect(validateCategory('POLICY')).toBe('policy');
    expect(validateCategory('Reference')).toBe('reference');
    expect(validateCategory('PATTERN')).toBe('pattern');
  });

  it('returns context for unknown categories', () => {
    expect(validateCategory('unknown')).toBe('context');
    expect(validateCategory('')).toBe('context');
    expect(validateCategory('random-category')).toBe('context');
  });
});

describe('parseMdcFile', () => {
  // New format: simplified (no tags, no entities)
  const validMdcContent = `---
type: knowledge
title: API Design Guidelines
summary: REST API design standards for the organization.
created_at: "2026-02-06T14:30:00.000Z"
updated_at: "2026-02-06T14:30:00.000Z"
source:
  file: api-guidelines.md
  project: test-project
  path: /docs/api-guidelines.md
classification:
  category: policy
  confidence: 0.92
  reasoning: Contains API design standards
  topics:
    - API Design
    - REST Conventions
status: active
---

# API Design Guidelines

This is the content body.`;

  it('parses valid .mdc file (new format)', () => {
    const result = parseMdcFile(validMdcContent);

    expect(result.frontmatter.type).toBe('knowledge');
    expect(result.frontmatter.title).toBe('API Design Guidelines');
    expect(result.frontmatter.summary).toBe('REST API design standards for the organization.');
    expect(result.frontmatter.classification.category).toBe('policy');
    expect(result.frontmatter.classification.confidence).toBe(0.92);
    expect(result.frontmatter.classification.topics).toEqual(['API Design', 'REST Conventions']);
    expect(result.body).toBe('# API Design Guidelines\n\nThis is the content body.');
  });

  it('parses old format with tags/entities without errors (backward compatible)', () => {
    const oldFormatContent = `---
type: knowledge
title: Old Format Entry
summary: An entry in the old format.
created_at: "2026-02-06T14:30:00.000Z"
updated_at: "2026-02-06T14:30:00.000Z"
source:
  file: old.md
  project: test-project
  path: /docs/old.md
classification:
  category: reference
  confidence: 0.85
  reasoning: Contains reference info
  tags:
    - rest
    - api
  topics:
    - api-design
  entities:
    technologies:
      - REST
    frameworks: []
    libraries: []
    apis: []
status: active
---

Old content here.`;

    // Should not throw — old fields silently ignored by the type
    const result = parseMdcFile(oldFormatContent);
    expect(result.frontmatter.title).toBe('Old Format Entry');
    expect(result.frontmatter.classification.category).toBe('reference');
    expect(result.body).toBe('Old content here.');
  });

  it('throws on missing frontmatter', () => {
    expect(() => parseMdcFile('No frontmatter here')).toThrow('missing frontmatter delimiters');
  });

  it('throws on invalid YAML', () => {
    const invalidYaml = `---
type: knowledge
title: [invalid yaml
---

Content`;
    expect(() => parseMdcFile(invalidYaml)).toThrow('failed to parse YAML');
  });

  it('throws on missing type field', () => {
    const missingType = `---
title: Test
summary: Test summary
---

Content`;
    expect(() => parseMdcFile(missingType)).toThrow('type must be "knowledge"');
  });

  it('throws on missing title', () => {
    const missingTitle = `---
type: knowledge
summary: Test
---

Content`;
    expect(() => parseMdcFile(missingTitle)).toThrow('missing required field "title"');
  });

  it('handles empty body', () => {
    const emptyBody = `---
type: knowledge
title: Empty Body Test
summary: Test
created_at: "2026-02-06T14:30:00.000Z"
updated_at: "2026-02-06T14:30:00.000Z"
source:
  file: test.md
  project: null
  path: null
classification:
  category: context
  confidence: 0.5
  reasoning: Test
  topics: []
status: active
---
`;
    const result = parseMdcFile(emptyBody);
    expect(result.body).toBe('');
    expect(result.frontmatter.title).toBe('Empty Body Test');
  });

  it('handles Windows-style line endings', () => {
    const windowsContent = validMdcContent.replace(/\n/g, '\r\n');
    const result = parseMdcFile(windowsContent);
    expect(result.frontmatter.title).toBe('API Design Guidelines');
  });
});

describe('generateMdcFile', () => {
  const sampleFrontmatter: KnowledgeEntryFrontmatter = {
    type: 'knowledge',
    title: 'Test Entry',
    summary: 'A test knowledge entry.',
    created_at: '2026-02-06T14:30:00.000Z',
    updated_at: '2026-02-06T14:30:00.000Z',
    source: {
      file: 'test.md',
      project: 'test-project',
      path: '/docs/test.md',
    },
    classification: {
      category: 'reference',
      confidence: 0.85,
      reasoning: 'Contains technical reference information',
      topics: ['documentation', 'testing'],
    },
    status: 'active',
  };

  it('generates valid .mdc content', () => {
    const content = generateMdcFile(sampleFrontmatter, '# Test Content\n\nBody text.');

    expect(content).toContain('---\n');
    expect(content).toContain('type: knowledge');
    expect(content).toContain('title: Test Entry');
    expect(content).toContain('# Test Content\n\nBody text.');
  });

  it('round-trips through parse and generate', () => {
    const body = '# Original Content\n\nWith multiple paragraphs.\n\n- List item';
    const generated = generateMdcFile(sampleFrontmatter, body);
    const parsed = parseMdcFile(generated);

    expect(parsed.frontmatter.type).toBe(sampleFrontmatter.type);
    expect(parsed.frontmatter.title).toBe(sampleFrontmatter.title);
    expect(parsed.frontmatter.summary).toBe(sampleFrontmatter.summary);
    expect(parsed.frontmatter.classification.category).toBe(
      sampleFrontmatter.classification.category
    );
    expect(parsed.frontmatter.classification.topics).toEqual(
      sampleFrontmatter.classification.topics
    );
    expect(parsed.body).toBe(body);
  });

  it('handles special characters in content', () => {
    const specialBody = '# Code Example\n\n```typescript\nconst x: string = "hello";\n```';
    const generated = generateMdcFile(sampleFrontmatter, specialBody);
    const parsed = parseMdcFile(generated);

    expect(parsed.body).toBe(specialBody);
  });

  it('handles null source fields', () => {
    const frontmatterWithNulls: KnowledgeEntryFrontmatter = {
      ...sampleFrontmatter,
      source: {
        file: 'test.md',
        project: null,
        path: null,
      },
    };

    const generated = generateMdcFile(frontmatterWithNulls, 'Content');
    const parsed = parseMdcFile(generated);

    expect(parsed.frontmatter.source.project).toBeNull();
    expect(parsed.frontmatter.source.path).toBeNull();
  });

  it('preserves array order in topics', () => {
    const frontmatterWithTopics: KnowledgeEntryFrontmatter = {
      ...sampleFrontmatter,
      classification: {
        ...sampleFrontmatter.classification,
        topics: ['topic-a', 'topic-b', 'topic-c'],
      },
    };

    const generated = generateMdcFile(frontmatterWithTopics, 'Content');
    const parsed = parseMdcFile(generated);

    expect(parsed.frontmatter.classification.topics).toEqual([
      'topic-a',
      'topic-b',
      'topic-c',
    ]);
  });
});

describe('stripFrontmatter', () => {
  it('strips YAML frontmatter and returns body', () => {
    const mdc = `---
type: knowledge
title: Test
---

# Content Here

Body text.`;
    const result = stripFrontmatter(mdc);
    expect(result).toBe('# Content Here\n\nBody text.');
  });

  it('returns content as-is when no frontmatter present', () => {
    const plain = '# Just Markdown\n\nNo frontmatter.';
    const result = stripFrontmatter(plain);
    expect(result).toBe(plain);
  });

  it('handles empty body after frontmatter', () => {
    const mdc = `---
type: knowledge
title: Empty
---
`;
    const result = stripFrontmatter(mdc);
    expect(result).toBe('');
  });

  it('handles Windows-style line endings', () => {
    const mdc = '---\r\ntype: knowledge\r\ntitle: Test\r\n---\r\n\r\n# Content';
    const result = stripFrontmatter(mdc);
    expect(result).toBe('# Content');
  });

  it('strips whitespace from result', () => {
    const mdc = `---
type: knowledge
title: Test
---

   Indented content   `;
    const result = stripFrontmatter(mdc);
    expect(result).toBe('Indented content');
  });
});
