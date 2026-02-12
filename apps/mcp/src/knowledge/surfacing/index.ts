/**
 * Context surfacing module
 *
 * Manages the project's context/ directory for copilot access.
 */

export {
  clearContextDir,
  writeContextReadme,
  getKBPath,
  hasLocalSource,
  getLocalSourcePath,
  type KBFileReference,
  type ReferencedFile,
} from './context-writer.js';

export {
  copyFrameworkBoilerplate,
  resolveFrameworkTemplateDir,
  FrameworkError,
  type FrameworkCopyResult,
} from './framework-copier.js';

export { generateFileTree, type FileTreeOptions } from './file-tree.js';
