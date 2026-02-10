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

// Constants for test paths
const MOCK_VCK_DIR = '/mocked/vck-templates';
const MOCK_TEMPLATES_DIR = `${MOCK_VCK_DIR}/templates`;
const MOCK_FRAMEWORK_DIR = `${MOCK_TEMPLATES_DIR}/frameworks/langgraph`;

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

    it('copies all files from template directory', async () => {
      // Mock fs.access to succeed for template dir and shared files, fail for dest files
      vi.mocked(fs.access).mockImplementation(async (pathArg) => {
        const pathStr = String(pathArg);
        if (pathStr === MOCK_FRAMEWORK_DIR) {
          return; // Template dir exists
        }
        // Shared project files exist
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-env`) {
          return;
        }
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-gitignore`) {
          return;
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
        if (dirStr === MOCK_FRAMEWORK_DIR) {
          return [
            { name: 'src', isDirectory: () => true, isFile: () => false },
            { name: 'main.py', isDirectory: () => false, isFile: () => true },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        if (dirStr === path.join(MOCK_FRAMEWORK_DIR, 'src')) {
          return [
            { name: 'agent', isDirectory: () => true, isFile: () => false },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        if (dirStr === path.join(MOCK_FRAMEWORK_DIR, 'src', 'agent')) {
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
      // Framework files
      expect(result.copiedFiles).toContain('main.py');
      expect(result.copiedFiles).toContain(path.join('src', 'agent', 'graph.py'));
      // Shared project files (renamed)
      expect(result.copiedFiles).toContain('.env');
      expect(result.copiedFiles).toContain('.gitignore');
      expect(result.skippedFiles).toHaveLength(0);
      expect(result.success).toBe(true);
    });

    it('copies shared project files with renaming (project-env → .env, project-gitignore → .gitignore)', async () => {
      // Mock fs.access
      vi.mocked(fs.access).mockImplementation(async (pathArg) => {
        const pathStr = String(pathArg);
        if (pathStr === MOCK_FRAMEWORK_DIR) {
          return; // Template dir exists
        }
        // Shared project files exist
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-env`) {
          return;
        }
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-gitignore`) {
          return;
        }
        if (pathStr.startsWith('/test/project/')) {
          // Destination files don't exist
          throw new Error('ENOENT');
        }
        return;
      });

      // Mock fs.readdir - empty framework directory
      vi.mocked(fs.readdir).mockResolvedValue([]);

      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await copyFrameworkBoilerplate('langgraph', mockProjectDir);

      // Verify copyFile was called with correct source and destination
      expect(fs.copyFile).toHaveBeenCalledWith(
        `${MOCK_TEMPLATES_DIR}/project-env`,
        `${mockProjectDir}/.env`
      );
      expect(fs.copyFile).toHaveBeenCalledWith(
        `${MOCK_TEMPLATES_DIR}/project-gitignore`,
        `${mockProjectDir}/.gitignore`
      );

      expect(result.copiedFiles).toContain('.env');
      expect(result.copiedFiles).toContain('.gitignore');
    });

    it('skips shared project files if they already exist', async () => {
      vi.mocked(fs.access).mockImplementation(async (pathArg) => {
        const pathStr = String(pathArg);
        if (pathStr === MOCK_FRAMEWORK_DIR) {
          return; // Template dir exists
        }
        // Shared project files exist in template
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-env`) {
          return;
        }
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-gitignore`) {
          return;
        }
        // .env already exists in project, .gitignore doesn't
        if (pathStr === `${mockProjectDir}/.env`) {
          return;
        }
        if (pathStr.startsWith('/test/project/')) {
          throw new Error('ENOENT');
        }
        return;
      });

      vi.mocked(fs.readdir).mockResolvedValue([]);
      vi.mocked(fs.mkdir).mockResolvedValue(undefined);
      vi.mocked(fs.copyFile).mockResolvedValue(undefined);

      const result = await copyFrameworkBoilerplate('langgraph', mockProjectDir);

      expect(result.skippedFiles).toContain('.env');
      expect(result.copiedFiles).toContain('.gitignore');
    });

    it('skips existing framework files', async () => {
      // Mock fs.access to succeed for both template and some dest files
      vi.mocked(fs.access).mockImplementation(async (pathArg) => {
        const pathStr = String(pathArg);
        if (pathStr === MOCK_FRAMEWORK_DIR) {
          return; // Template dir exists
        }
        // Shared project files don't exist in template (for this test)
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-env`) {
          throw new Error('ENOENT');
        }
        if (pathStr === `${MOCK_TEMPLATES_DIR}/project-gitignore`) {
          throw new Error('ENOENT');
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
        if (dirStr === MOCK_FRAMEWORK_DIR) {
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
        if (dirStr === MOCK_FRAMEWORK_DIR) {
          return [
            { name: 'existing.py', isDirectory: () => false, isFile: () => true },
          ] as unknown as Awaited<ReturnType<typeof fs.readdir>>;
        }
        return [];
      });

      const result = await copyFrameworkBoilerplate('langgraph', mockProjectDir);

      // All files skipped (including shared project files which exist due to mockResolvedValue)
      expect(result.skippedFiles).toContain('existing.py');
      expect(result.success).toBe(true);
    });
  });
});
