/**
 * @kahuna/vck-templates - VCK template management and generation
 *
 * This package provides:
 * - Template access functions for frameworks and copilot configs
 * - VCK generator function
 * - Template type definitions
 */

// Types
export * from './types.js';

// Template access
export {
  FRAMEWORK_TEMPLATES,
  COPILOT_CONFIG_TEMPLATES,
  getFrameworkTemplate,
  getCopilotConfigTemplate,
  listFrameworks,
  listCopilotConfigs,
  getFrameworkFiles,
  getCopilotConfigFiles,
} from './templates.js';

// Generator
export { generateVCK, validateGeneratorInput } from './generator.js';
