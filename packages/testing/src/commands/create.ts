/**
 * test:create command - Create a VCK instance from templates and scenarios
 *
 * Creates a project folder in `projects/` by combining:
 * 1. Framework boilerplate (from vck-templates)
 * 2. Copilot configuration (from vck-templates)
 * 3. Scenario context (CLAUDE.md and knowledge-base/ from testing/scenarios)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { createTestClient } from '../client.js';
import { SEED_DATA } from '../types.js';
import { loadConfig } from './init.js';

/**
 * Find the repository root by looking for package.json with workspaces
 */
function findRepoRoot(): string {
  let current = process.cwd();

  while (current !== '/') {
    const packageJsonPath = path.join(current, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (pkg.workspaces || pkg.name === 'kahuna') {
          return current;
        }
      } catch {
        // Continue searching
      }
    }
    current = path.dirname(current);
  }

  return process.cwd();
}

/**
 * Copy a directory recursively
 */
function copyDirRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Copy a single file
 */
function copyFile(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    return;
  }
  const destDir = path.dirname(dest);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
}

/**
 * List available scenarios
 */
function listAvailableScenarios(repoRoot: string): string[] {
  const scenariosDir = path.join(repoRoot, 'packages', 'testing', 'scenarios');
  if (!fs.existsSync(scenariosDir)) {
    return [];
  }

  return fs
    .readdirSync(scenariosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('level-'))
    .map((entry) => entry.name);
}

/**
 * Execute the create command
 */
export async function createCommand(options: {
  scenario?: string;
  name?: string;
}): Promise<void> {
  console.log('');
  console.log('📦 Creating VCK instance...');
  console.log('');

  const repoRoot = findRepoRoot();
  const config = loadConfig();

  // Determine framework and copilot
  const framework = config?.defaults.framework || 'langgraph';
  const copilot = config?.defaults.copilot || 'claude-code';

  // Get available scenarios
  const availableScenarios = listAvailableScenarios(repoRoot);

  // Determine scenario
  let scenario = options.scenario || config?.defaults.scenario;
  if (!scenario) {
    // Default to first available scenario
    if (availableScenarios.length > 0) {
      scenario = availableScenarios[0];
    } else {
      console.error('❌ No scenarios available');
      console.error('   Scenarios should be in packages/testing/scenarios/');
      process.exit(1);
    }
  }

  // Validate scenario exists
  if (!availableScenarios.includes(scenario)) {
    console.error(`❌ Scenario not found: ${scenario}`);
    console.error('');
    console.error('Available scenarios:');
    for (const s of availableScenarios) {
      console.error(`  - ${s}`);
    }
    console.error('');
    process.exit(1);
  }

  // Generate project name
  const projectName = options.name || `${scenario}-${Date.now().toString(36)}`;

  // Define paths
  const templatesDir = path.join(repoRoot, 'packages', 'vck-templates', 'templates');
  const scenariosDir = path.join(repoRoot, 'packages', 'testing', 'scenarios');
  const projectsDir = path.join(repoRoot, 'projects');
  const projectPath = path.join(projectsDir, projectName);

  // Check if project already exists
  if (fs.existsSync(projectPath)) {
    console.error(`❌ Project folder already exists: projects/${projectName}`);
    console.error('   Use a different name or delete the existing folder.');
    process.exit(1);
  }

  console.log(`Scenario: ${scenario}`);
  console.log(`Framework: ${framework}`);
  console.log(`Copilot: ${copilot}`);
  console.log(`Project name: ${projectName}`);
  console.log('');

  // 1. Copy framework files
  const frameworkSrc = path.join(templatesDir, 'frameworks', framework);
  if (fs.existsSync(frameworkSrc)) {
    console.log('Copying framework boilerplate...');
    copyDirRecursive(frameworkSrc, projectPath);
    console.log('  ✓ Framework files copied');
  } else {
    console.error(`❌ Framework not found: ${framework}`);
    console.error(`   Expected at: ${frameworkSrc}`);
    process.exit(1);
  }

  // 2. Copy copilot configuration (.claude/)
  const copilotSrc = path.join(templatesDir, 'copilot-configs', copilot, '.claude');
  const copilotDest = path.join(projectPath, '.claude');
  if (fs.existsSync(copilotSrc)) {
    console.log('Copying copilot configuration...');
    copyDirRecursive(copilotSrc, copilotDest);
    console.log('  ✓ Copilot config copied');
  } else {
    console.warn(`⚠ Copilot config not found: ${copilot}`);
    console.warn(`  Expected at: ${copilotSrc}`);
  }

  // 3. Copy scenario CLAUDE.md
  const scenarioDir = path.join(scenariosDir, scenario);
  const claudeMdSrc = path.join(scenarioDir, 'CLAUDE.md');
  const claudeMdDest = path.join(projectPath, 'CLAUDE.md');
  if (fs.existsSync(claudeMdSrc)) {
    console.log('Copying scenario context (CLAUDE.md)...');
    copyFile(claudeMdSrc, claudeMdDest);
    console.log('  ✓ CLAUDE.md copied');
  } else {
    console.warn(`⚠ Scenario CLAUDE.md not found: ${claudeMdSrc}`);
  }

  // 4. Copy scenario knowledge-base/
  const knowledgeBaseSrc = path.join(scenarioDir, 'knowledge-base');
  const knowledgeBaseDest = path.join(projectPath, 'knowledge-base');
  if (fs.existsSync(knowledgeBaseSrc)) {
    console.log('Copying knowledge base...');
    copyDirRecursive(knowledgeBaseSrc, knowledgeBaseDest);
    console.log('  ✓ Knowledge base copied');
  } else {
    console.log('  (No knowledge-base folder for this scenario)');
  }

  // 5. Copy .env template
  const envTemplateSrc = path.join(templatesDir, 'project-env');
  const envDest = path.join(projectPath, '.env');
  if (fs.existsSync(envTemplateSrc)) {
    console.log('Copying .env template...');
    copyFile(envTemplateSrc, envDest);
    console.log('  ✓ .env template copied');
  }

  // 6. Copy .gitignore template
  const gitignoreSrc = path.join(templatesDir, 'project-gitignore');
  const gitignoreDest = path.join(projectPath, '.gitignore');
  if (fs.existsSync(gitignoreSrc)) {
    console.log('Copying .gitignore...');
    copyFile(gitignoreSrc, gitignoreDest);
    console.log('  ✓ .gitignore copied');
  }

  // 5. Optionally register with API (if running)
  const apiUrl = config?.api.url || 'http://localhost:3000';
  let projectId: string | undefined;

  try {
    const client = createTestClient({
      baseUrl: apiUrl,
      testUserId: SEED_DATA.TEST_USER_1_ID,
    });

    // Check API health
    await client.healthCheck();

    // Create project in database
    console.log('');
    console.log('Registering with API...');
    const project = await client.createProject(projectName);
    projectId = project.id;
    console.log(`  ✓ Project registered (ID: ${projectId})`);
  } catch {
    console.log('');
    console.log('  (API not available - project created locally only)');
  }

  // Report success
  console.log('');
  console.log('✅ VCK instance created successfully!');
  console.log('');
  console.log(`📁 Location: projects/${projectName}/`);
  console.log('');
  console.log('Project structure:');
  console.log('  .claude/           - Copilot configuration');
  console.log('  src/agent/         - Agent source code');
  console.log('  knowledge-base/    - Business context files');
  console.log('  CLAUDE.md          - Project instructions');
  console.log('  main.py            - Entry point');
  console.log('  pyproject.toml     - Dependencies');
  console.log('');
  console.log('Next steps:');
  console.log(`  1. cd projects/${projectName}`);
  console.log('  2. Open in your coding copilot (Claude Code, Cursor, etc.)');
  console.log('  3. Follow instructions in README.md');
  if (projectId) {
    console.log('');
    console.log('When done, submit results:');
    console.log(`  pnpm test:submit --project ${projectId}`);
  }
  console.log('');
}
