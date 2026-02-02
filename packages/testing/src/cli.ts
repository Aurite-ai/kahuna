#!/usr/bin/env node
/**
 * Kahuna Testing CLI
 *
 * Provides commands for programmatic testing of the feedback loop:
 * - test:init   - Initialize testing configuration
 * - test:create - Create a test project with context and generate VCK
 * - test:submit - Submit test results to complete the loop
 */

import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { initCommand } from './commands/init.js';
import { submitCommand } from './commands/submit.js';

const program = new Command();

program
  .name('kahuna-test')
  .description('CLI for testing the Kahuna feedback loop')
  .version('0.0.0');

// test:init - Initialize configuration
program
  .command('init')
  .description('Initialize testing configuration (.kahuna file)')
  .action(async () => {
    await initCommand();
  });

// test:create - Create VCK instance from scenario
program
  .command('create [scenario]')
  .description('Create a VCK instance from a scenario template')
  .option('-n, --name <name>', 'Project folder name')
  .action(async (scenario: string | undefined, options: { name?: string }) => {
    await createCommand({ scenario, name: options.name });
  });

// test:submit - Submit test results
program
  .command('submit [name]')
  .description('Submit test results from a project folder')
  .option('-p, --project <id>', 'Project ID (default: seed data project)')
  .option('-l, --conversation-log <path>', 'Path to conversation log file')
  .action(
    async (name: string | undefined, options: { project?: string; conversationLog?: string }) => {
      await submitCommand({ name, ...options });
    }
  );

// Parse arguments and run
program.parse();
