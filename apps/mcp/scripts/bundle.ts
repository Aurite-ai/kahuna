#!/usr/bin/env tsx
/**
 * Bundle the MCP server into a single executable JavaScript file.
 *
 * This script uses esbuild to:
 * - Bundle all source code and dependencies into one file
 * - Target Node 20 LTS for broad compatibility
 * - Add shebang for CLI execution
 * - Output to dist/kahuna-mcp.cjs
 * - Copy templates to dist/templates/
 *
 * Usage: pnpm bundle
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

/**
 * Recursively copy a directory.
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

async function bundle() {
  console.log('🔨 Building MCP server bundle...\n');

  const startTime = Date.now();

  try {
    const result = await esbuild.build({
      // Entry point
      entryPoints: [path.join(rootDir, 'src/index.ts')],

      // Output - use .cjs extension so Node recognizes it as CommonJS
      // (package.json has "type": "module" which would make .js be ESM)
      outfile: path.join(rootDir, 'dist/kahuna-mcp.cjs'),
      bundle: true,

      // Target Node 20 LTS
      platform: 'node',
      target: 'node20',

      // Use CJS format - ESM has issues with dotenv's dynamic requires
      format: 'cjs',

      // Bundle everything - no external dependencies
      // This makes the output fully self-contained
      packages: 'bundle',

      // Shebang is preserved from source file (src/index.ts has #!/usr/bin/env node)

      // Generate sourcemap for debugging
      sourcemap: true,

      // Minify for smaller bundle size
      minify: true,

      // Tree shaking
      treeShaking: true,

      // Keep names for better error messages
      keepNames: true,

      // Log level
      logLevel: 'info',

      // Metafile for analysis
      metafile: true,
    });

    // Write metafile for bundle analysis
    const metafilePath = path.join(rootDir, 'dist/metafile.json');
    fs.writeFileSync(metafilePath, JSON.stringify(result.metafile, null, 2));

    // Copy templates to dist/templates/
    console.log('\n📁 Copying templates...');
    const templatesSrc = path.join(rootDir, 'templates');
    const templatesDest = path.join(rootDir, 'dist/templates');
    await copyDir(templatesSrc, templatesDest);
    console.log('   Copied templates/ to dist/templates/');

    // Calculate bundle size
    const bundlePath = path.join(rootDir, 'dist/kahuna-mcp.cjs');
    const stats = fs.statSync(bundlePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Bundle created successfully!\n');
    console.log('   Output: dist/kahuna-mcp.cjs');
    console.log('   Assets: dist/templates/');
    console.log(`   Size:   ${sizeKB} KB (${sizeMB} MB)`);
    console.log(`   Time:   ${elapsed}s`);
    console.log('\n   Run with: node dist/kahuna-mcp.cjs');
    console.log('   Or:       ./dist/kahuna-mcp.cjs (after chmod +x)');
  } catch (error) {
    console.error('❌ Bundle failed:', error);
    process.exit(1);
  }
}

bundle();
