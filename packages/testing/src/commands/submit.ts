/**
 * test:submit command - Submit test results
 *
 * Collects code, docs, and tests from a project folder in projects/
 * and submits them to the API, completing the feedback loop.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { createTestClient } from '../client.js';
import type { BuildResultInput, FileContentMap } from '../types.js';
import { SEED_DATA } from '../types.js';
import { loadConfig } from './init.js';

/**
 * Find the repository root by looking for package.json with workspaces
 */
function findRepoRoot(): string {
  let dir = process.cwd();
  while (dir !== '/') {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.workspaces || fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  throw new Error('Could not find repository root');
}

/**
 * List available projects in the projects/ folder
 */
function listAvailableProjects(repoRoot: string): string[] {
  const projectsDir = path.join(repoRoot, 'projects');
  if (!fs.existsSync(projectsDir)) {
    return [];
  }
  return fs
    .readdirSync(projectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

/**
 * Collect all files from a directory into a FileContentMap
 * Returns relative paths as keys
 */
function collectFilesFromDir(baseDir: string, subDir: string): FileContentMap {
  const targetDir = path.join(baseDir, subDir);
  const result: FileContentMap = {};

  if (!fs.existsSync(targetDir)) {
    return result;
  }

  function walkDir(currentPath: string, relativePath: string): void {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        // Skip node_modules and other common excludes
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        walkDir(fullPath, relPath);
      } else if (entry.isFile()) {
        // Only include text files (skip binaries, images, etc.)
        const ext = path.extname(entry.name).toLowerCase();
        const textExtensions = [
          '.ts',
          '.js',
          '.tsx',
          '.jsx',
          '.json',
          '.md',
          '.txt',
          '.yaml',
          '.yml',
          '.toml',
          '.py',
          '.sh',
          '.css',
          '.html',
          '.env',
          '.gitignore',
          '',
        ];
        if (textExtensions.includes(ext)) {
          try {
            result[relPath] = fs.readFileSync(fullPath, 'utf-8');
          } catch {
            // Skip files that can't be read as text
          }
        }
      }
    }
  }

  walkDir(targetDir, '');
  return result;
}

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Execute the submit command
 */
export async function submitCommand(options: {
  project?: string;
  name?: string;
  conversationLog?: string;
}): Promise<void> {
  console.log('');
  console.log('📤 Submitting test results...');
  console.log('');

  const repoRoot = findRepoRoot();

  // Load config for API URL
  const config = loadConfig();
  const apiUrl = config?.api.url || 'http://localhost:3000';

  // Determine project folder name
  let projectFolderName = options.name;
  if (!projectFolderName) {
    const availableProjects = listAvailableProjects(repoRoot);
    if (availableProjects.length === 0) {
      console.error('❌ No projects found in projects/ folder');
      console.error('');
      console.error('Create a project first with: pnpm test:create <scenario>');
      console.error('');
      process.exit(1);
    }

    console.log('Available projects:');
    for (const proj of availableProjects) {
      console.log(`  - ${proj}`);
    }
    console.log('');
    projectFolderName = await prompt('Enter project folder name: ');
  }

  const projectPath = path.join(repoRoot, 'projects', projectFolderName);
  if (!fs.existsSync(projectPath)) {
    console.error(`❌ Project folder not found: projects/${projectFolderName}`);
    console.error('');
    process.exit(1);
  }

  // Determine project ID from API
  const projectId = options.project || SEED_DATA.SAMPLE_PROJECT_ID;

  // Create API client
  const client = createTestClient({
    baseUrl: apiUrl,
    testUserId: SEED_DATA.TEST_USER_1_ID,
  });

  try {
    // Check API health first
    console.log('Checking API connection...');
    try {
      const health = await client.healthCheck();
      console.log(`  API status: ${health.status}`);
    } catch {
      console.error('');
      console.error('❌ Cannot connect to API');
      console.error(`   Make sure the API is running at ${apiUrl}`);
      console.error('   Start it with: pnpm dev:api');
      console.error('');
      process.exit(1);
    }

    // Verify project exists
    console.log('');
    console.log(`Verifying project: ${projectId}`);
    try {
      const project = await client.getProject(projectId);
      console.log(`  Project name: ${project.name}`);
    } catch {
      console.error('');
      console.error('❌ Project not found or access denied');
      console.error('   Check the project ID and try again.');
      console.error('');
      process.exit(1);
    }

    // Collect files from the project folder
    console.log('');
    console.log(`Collecting files from: projects/${projectFolderName}`);

    const code = collectFilesFromDir(projectPath, 'src');
    const docs = collectFilesFromDir(projectPath, 'docs');
    const tests = collectFilesFromDir(projectPath, 'tests');

    console.log(`  Code files (src/): ${Object.keys(code).length}`);
    console.log(`  Doc files (docs/): ${Object.keys(docs).length}`);
    console.log(`  Test files (tests/): ${Object.keys(tests).length}`);

    // Check for conversation log
    let conversationLog: string | undefined;
    if (options.conversationLog) {
      if (fs.existsSync(options.conversationLog)) {
        conversationLog = fs.readFileSync(options.conversationLog, 'utf-8');
        console.log(`  Conversation log: ${options.conversationLog}`);
      } else {
        console.warn(`  ⚠️  Conversation log not found: ${options.conversationLog}`);
      }
    }

    // Build the input
    const input: BuildResultInput = {
      projectId,
      code,
      docs,
      tests,
      conversationLog,
    };

    // Submit results
    console.log('');
    console.log('Submitting build results...');
    const result = await client.submitResults(input);
    console.log(`  Result ID: ${result.id}`);
    console.log(`  Created at: ${result.createdAt}`);

    // List all results for this project
    console.log('');
    console.log('All results for this project:');
    const allResults = await client.listResults(projectId);
    for (const r of allResults) {
      const codeCount = Object.keys(r.code).length;
      const docsCount = Object.keys(r.docs).length;
      const testsCount = Object.keys(r.tests).length;
      console.log(`  - ${r.id}: ${codeCount} code, ${docsCount} docs, ${testsCount} tests`);
    }

    console.log('');
    console.log('✅ Build results submitted successfully!');
    console.log('');
    console.log('The feedback loop is now complete:');
    console.log('  1. ✓ Project created');
    console.log('  2. ✓ Context uploaded');
    console.log('  3. ✓ VCK generated');
    console.log('  4. ✓ Results captured');
    console.log('');
  } catch (error) {
    console.error('');
    console.error(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('');
    process.exit(1);
  }
}
