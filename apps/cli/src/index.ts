#!/usr/bin/env node
import chalk from 'chalk';
/**
 * Kahuna CLI - Professional command-line interface
 */
import { Command } from 'commander';
import { config } from 'dotenv';
import figlet from 'figlet';
import gradient from 'gradient-string';
import { registerIntegrationCommands } from './commands/integration.js';

// Load environment variables
config();

// ASCII art banner
function showBanner(): void {
  const banner = figlet.textSync('KAHUNA', {
    font: 'Standard',
    horizontalLayout: 'default',
  });
  console.log(gradient.pastel.multiline(banner));
  console.log(chalk.dim('  Professional VCK Generation & Infrastructure Management'));
  console.log('');
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('kahuna')
    .description('Kahuna CLI - VCK Generation & Infrastructure Management')
    .version('0.1.0')
    .hook('preAction', () => {
      // Show banner for non-help commands
      if (!process.argv.includes('--help') && !process.argv.includes('-h')) {
        showBanner();
      }
    });

  // Register command groups
  registerIntegrationCommands(program);

  // TODO: Add more command groups
  // registerDataSourceCommands(program);
  // registerProjectCommands(program);
  // registerConfigCommands(program);

  // Parse command-line arguments
  await program.parseAsync(process.argv);

  // Show help if no command provided
  if (!process.argv.slice(2).length) {
    showBanner();
    program.outputHelp();
  }
}

// Run CLI
main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});
