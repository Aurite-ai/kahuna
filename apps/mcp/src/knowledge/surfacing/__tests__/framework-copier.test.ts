/**
 * Tests for the framework boilerplate copier
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fs/promises before importing the module
vi.mock('node:fs/promises');

// Mock node:module to control require.resolve behavior
vi.mock('node:module', () => ({
  createRequire: () => ({
    resolve: (specifier: string) => {
      if (specifier === '@kahuna/vck-templates/package.json') {
        return '/mocked/vck-templates/package.json';
      }
      throw new Error(`Cannot resolve ${specifier}`);
    },
  }),
}));

// Mock the config
vi.mock('../../../config.js', () => ({
  FRAMEWORKS: {
    langgraph: {
      id: 'langgraph',
      displayName: 'LangGraph',
      kbDocSlug: 'langgraph-best-practices',
    },
  },
  getFrameworkIds: () => ['langgraph'],
}));

// Import after mocks are set up
import {
  FrameworkError,
  copyFrameworkBoilerplate,
  resolveFrameworkTemplateDir,
} from '../framework-copier.js';

describe('framework-copier', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveFrameworkTemplateDir', () => {
    it('returns path for valid framework', () => {
      const result = resolveFrameworkTemplateDir('langgraph');
      expect(result).toContain('templates');
      expect(result).toContain('frameworks');
      expect(result).toContain('langgraph');
    });

    it('throws FrameworkError for invalid framework', () => {
      expect(() => resolveFrameworkTemplateDir('invalid-framework')).toThrow(FrameworkError);
      expect(() => resolveFrameworkTemplateDir('invalid-framework')).toThrow(/Unknown framework/);
    });
  });

  describe('copyFrameworkBoilerplate', () => {
    const mockProjectDir = '/test/project';
    const mockTemplateDir = '/mocked/vck-templates/templates/frameworks/langgraph';

    it('copies all files from template directory', async () => {
      // Mock fs.access to succeed for template dir, fail for dest files
      vi.mocked(fs.access).mockImplementation(async (pathArg) => {
        const pathStr = String(pathArg);
        if (pathStr === mockTemplateDir) {
          return; // Template dir exists
        }
        if (pathStr.startsWith('/test/project/')) {
          // Destination files don't exist
          throw new Error('ENOENT');
        }
        return;
      });

      // Mock fs.readdir to return template structure
      vi.mocked(fs.readdir).mockImplementation(async (dir) => {
        const dirStr = String(dir);
        if (dirStr === mockTemplateDir) {
          return [
            { name: 'src', isDirectory: () => true, isFile: () => false },
            { name: 'main.py', isDirectory: () => false, isFile: () => true },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        if (dirStr === path.join(mockTemplateDir, 'src')) {
          return [
            { name: 'agent', isDirectory: () => true, isFile: () => false },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        if (dirStr === path.join(mockTemplateDir, 'src', 'agent')) {
          return [
            { name: 'graph.py', isDirectory: () => false, isFile: () => true },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        return [];
      });

      // Mock mkdir and copyFile
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await copyFrameworkBoilerplate('langgraph', mockProjectDir);

      expect(result.framework).toBe('langgraph');
      expect(result.displayName).toBe('LangGraph');
      expect(result.copiedFiles).toContain('main.py');
      expect(result.copiedFiles).toContain(path.join('src', 'agent', 'graph.py'));
      expect(result.skippedFiles).toHaveLength(0);
      expect(result.success).toBe(true);
    });

    it('skips existing files', async () => {
      // Mock fs.access to succeed for both template and some dest files
      vi.mocked(fs.access).mockImplementation(async (pathArg) => {
        const pathStr = String(pathArg);
        if (pathStr === mockTemplateDir) {
          return; // Template dir exists
        }
        // main.py already exists in project
        if (pathStr === path.join(mockProjectDir, 'main.py')) {
          return; // File exists
        }
        if (pathStr.startsWith('/test/project/')) {
          // Other files don't exist
          throw new Error('ENOENT');
        }
        return;
      });

      // Mock fs.readdir
      vi.mocked(fs.readdir).mockImplementation(async (dir) => {
        const dirStr = String(dir);
        if (dirStr === mockTemplateDir) {
          return [
            { name: 'main.py', isDirectory: () => false, isFile: () => true },
            { name: 'README.md', isDirectory: () => false, isFile: () => true },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        return [];
      });

      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await copyFrameworkBoilerplate('langgraph', mockProjectDir);

      expect(result.skippedFiles).toContain('main.py');
      expect(result.copiedFiles).toContain('README.md');
      expect(result.success).toBe(true);
    });

    it('throws FrameworkError for invalid framework', async () => {
      await expect(copyFrameworkBoilerplate('nonexistent', mockProjectDir)).rejects.toThrow(
        FrameworkError
      );
    });

    it('throws FrameworkError when template directory not found', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      await expect(copyFrameworkBoilerplate('langgraph', mockProjectDir)).rejects.toThrow(
        FrameworkError
      );
      await expect(copyFrameworkBoilerplate('langgraph', mockProjectDir)).rejects.toThrow(
        /template directory not found/
      );
    });

    it('returns success even when all files skipped', async () => {
      // Template dir exists, all dest files also exist
      vi.mocked(fs.access).mockResolvedValue(undefined);

      vi.mocked(fs.readdir).mockImplementation(async (dir) => {
        const dirStr = String(dir);
        if (dirStr === mockTemplateDir) {
          return [
            { name: 'existing.py', isDirectory: () => false, isFile: () => true },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        return [];
      });

      const result = await copyFrameworkBoilerplate('langgraph', mockProjectDir);

      expect(result.copiedFiles).toHaveLength(0);
      expect(result.skippedFiles).toContain('existing.py');
      expect(result.success).toBe(true);
    });
  });
});
