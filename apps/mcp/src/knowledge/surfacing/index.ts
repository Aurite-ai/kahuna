/**
 * Context surfacing module
 *
 * Manages the project's context/ directory for copilot access.
 */

export {
  clearContextDir,
  writeContextFile,
  writeContextReadme,
  listContextFiles,
  type ContextSelection,
} from './context-writer.js';

export {
  copyFrameworkBoilerplate,
  resolveFrameworkTemplateDir,
  FrameworkError,
  type FrameworkCopyResult,
} from './framework-copier.js';
