/**
 * create command - Assemble a test project from VCK templates + scenario
 *
 * Creates a project folder in `projects/` by combining:
 * 1. Framework boilerplate (from vck-templates)
 * 2. Copilot configuration (from vck-templates)
 * 3. Scenario context (CLAUDE.md and knowledge-base/ from testing/scenarios)
 * 4. Environment files (.env, .gitignore)
 *
 * The resulting project looks like a real development project —
 * no test artifacts are visible to the copilot.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { findRepoRoot } from '../utils.js';

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
 * Copy a single file, creating parent directories as needed
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
 * List available scenarios from the scenarios/ directory
 */
function listAvailableScenarios(repoRoot: string): string[] {
  const scenariosDir = path.join(repoRoot, 'packages', 'testing', 'scenarios');
  if (!fs.existsSync(scenariosDir)) {
    return [];
  }

  return fs
    .readdirSync(scenariosDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/**
 * Execute the create command.
 *
 * Assembles a clean project folder from VCK templates + scenario content.
 * The output project contains zero test artifacts — the copilot sees
 * only what looks like a real development project.
 */
export async function createCommand(options: {
  scenario?: string;
  name?: string;
}): Promise<void> {
  console.log('');
  console.log('📦 Creating test project...');
  console.log('');

  const repoRoot = findRepoRoot();

  // Hardcoded for MVP — only langgraph + claude-code supported
  const framework = 'langgraph';
  const copilot = 'claude-code';

  // Get available scenarios
  const availableScenarios = listAvailableScenarios(repoRoot);

  // Determine scenario
  let scenario = options.scenario;
  if (!scenario) {
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

  // Use scenario name directly as project name (or custom name if provided)
  const projectName = options.name || scenario;

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

  console.log(`  Scenario:  ${scenario}`);
  console.log(`  Framework: ${framework}`);
  console.log(`  Copilot:   ${copilot}`);
  console.log(`  Project:   ${projectName}`);
  console.log('');

  // 1. Copy framework boilerplate
  const frameworkSrc = path.join(templatesDir, 'frameworks', framework);
  if (fs.existsSync(frameworkSrc)) {
    console.log('  Copying framework boilerplate...');
    copyDirRecursive(frameworkSrc, projectPath);
    console.log('    ✓ Framework files');
  } else {
    console.error(`❌ Framework not found: ${framework}`);
    console.error(`   Expected at: ${frameworkSrc}`);
    process.exit(1);
  }

  // 2. Copy copilot configuration (.claude/)
  const copilotSrc = path.join(templatesDir, 'copilot-configs', copilot, '.claude');
  const copilotDest = path.join(projectPath, '.claude');
  if (fs.existsSync(copilotSrc)) {
    console.log('  Copying copilot configuration...');
    copyDirRecursive(copilotSrc, copilotDest);
    console.log('    ✓ Copilot config (.claude/)');
  } else {
    console.warn(`  ⚠ Copilot config not found at: ${copilotSrc}`);
  }

  // 3. Copy scenario project-context.md (copilot-visible project context)
  const scenarioDir = path.join(scenariosDir, scenario);
  const projectContextSrc = path.join(scenarioDir, 'project-context.md');
  const projectContextDest = path.join(projectPath, 'project-context.md');
  if (fs.existsSync(projectContextSrc)) {
    console.log('  Copying scenario context...');
    copyFile(projectContextSrc, projectContextDest);
    console.log('    ✓ project-context.md');
  } else {
    console.warn(`  ⚠ Scenario project-context.md not found: ${projectContextSrc}`);
  }

  // 4. Copy scenario knowledge-base/ (copilot-visible business context)
  const knowledgeBaseSrc = path.join(scenarioDir, 'knowledge-base');
  const knowledgeBaseDest = path.join(projectPath, 'knowledge-base');
  if (fs.existsSync(knowledgeBaseSrc)) {
    console.log('  Copying knowledge base...');
    copyDirRecursive(knowledgeBaseSrc, knowledgeBaseDest);
    console.log('    ✓ knowledge-base/');
  } else {
    console.log('    (No knowledge-base for this scenario)');
  }

  // 5. Copy .env template
  const envTemplateSrc = path.join(templatesDir, 'project-env');
  const envDest = path.join(projectPath, '.env');
  if (fs.existsSync(envTemplateSrc)) {
    copyFile(envTemplateSrc, envDest);
    console.log('    ✓ .env template');
  }

  // 6. Copy .gitignore template
  const gitignoreSrc = path.join(templatesDir, 'project-gitignore');
  const gitignoreDest = path.join(projectPath, '.gitignore');
  if (fs.existsSync(gitignoreSrc)) {
    copyFile(gitignoreSrc, gitignoreDest);
    console.log('    ✓ .gitignore');
  }

  // Write a hidden metadata file for the collect command to use later
  const metadataPath = path.join(projectPath, '.kahuna-test.json');
  const metadata = {
    scenario,
    copilot,
    framework,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  // Report success
  console.log('');
  console.log('✅ Test project created!');
  console.log('');
  console.log(`📁 projects/${projectName}/`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Read the scenario prompts: packages/testing/scenarios/${scenario}/user-prompts.md`);
  console.log(`  2. cd projects/${projectName}`);
  console.log('  3. Open Claude Code (or your copilot) and follow the user prompts');
  console.log(`  4. When done: pnpm kahuna-test collect ${projectName}`);
  console.log('');
}
