import chalk from 'chalk';
/**
 * Tool Commands - Manage workflow tools (GitHub, Slack, etc.)
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { getCurrentUserId } from '../lib/config.js';
import { prisma } from '../lib/db.js';
import { getConnector } from '../services/connectors/index.js';
import { toolService } from '../services/tool.service.js';
import * as ui from '../ui/messages.js';
import { formatToolDetail, formatToolsTable } from '../ui/tables.js';

export function registerToolCommands(program: Command): void {
  const tool = program.command('tool').description('Manage workflow tools (GitHub, Slack, etc.)');

  // kahuna tool list
  tool
    .command('list')
    .description('List all configured tools')
    .action(async () => {
      try {
        const userId = await getCurrentUserId(prisma);
        const tools = await toolService.list(userId);

        ui.header('🔧 Workflow Tools');
        console.log(formatToolsTable(tools));
        console.log('');

        if (tools.length === 0) {
          ui.info('Add your first tool with: kahuna tool add');
        } else {
          ui.info(`Run ${chalk.cyan('kahuna tool show <name>')} for details`);
        }
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to list tools');
        process.exit(1);
      }
    });

  // kahuna tool add
  tool
    .command('add')
    .description('Add a new tool')
    .option('-t, --type <type>', 'Tool type (e.g., github, slack)')
    .action(async (options) => {
      try {
        const userId = await getCurrentUserId(prisma);

        // For now, only GitHub is implemented
        const toolType = options.type?.toUpperCase() || 'GITHUB';

        if (toolType !== 'GITHUB') {
          ui.error(`Tool type ${toolType} is not yet implemented`);
          ui.info('Currently supported: github');
          process.exit(1);
        }

        ui.header('🔌 Add GitHub Tool');

        // Gather tool information (one prompt at a time so Enter advances correctly)
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Tool name:',
            default: 'GitHub Personal',
            validate: (input: string) => (input.trim().length > 0 ? true : 'Name is required'),
          },
        ]);
        const { description } = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):',
          },
        ]);
        const { baseUrl } = await inquirer.prompt([
          {
            type: 'input',
            name: 'baseUrl',
            message: 'GitHub API URL:',
            default: 'https://api.github.com',
          },
        ]);
        const { token } = await inquirer.prompt([
          {
            type: 'password',
            name: 'token',
            message: 'GitHub Personal Access Token:',
            validate: (input: string) => (input.length > 0 ? true : 'Token is required'),
          },
        ]);
        const answers = { name, description, baseUrl, token };

        // Test connection before saving
        ui.section('Testing Connection');
        const spinner = ora('Connecting to GitHub...').start();

        const connector = getConnector(toolType);
        if (!connector) {
          spinner.fail('No connector available for GitHub');
          process.exit(1);
        }

        const testResult = await connector.testConnection(
          { baseUrl: answers.baseUrl },
          { token: answers.token }
        );

        if (!testResult.success) {
          spinner.fail('Connection failed');
          ui.errorBox('Connection Error', [
            testResult.message || 'Unknown error',
            '',
            testResult.error || '',
          ]);
          process.exit(1);
        }

        spinner.succeed(`Connected in ${testResult.responseTime}ms`);

        if (testResult.details) {
          console.log('');
          console.log(chalk.dim(`  Username: ${testResult.details.username}`));
          console.log(chalk.dim(`  Name: ${testResult.details.name || 'N/A'}`));
          console.log(chalk.dim(`  Type: ${testResult.details.type}`));
        }

        // Save tool
        ui.section('Saving Tool');
        const savingSpinner = ora('Creating tool...').start();

        const tool = await toolService.create(userId, {
          name: answers.name,
          description: answers.description || undefined,
          toolType,
          configuration: { baseUrl: answers.baseUrl },
          credentials: { token: answers.token },
        });

        // Update test status
        await toolService.updateTestStatus(tool.id, 'success');

        savingSpinner.succeed('Tool created successfully');

        ui.successBox('Tool Added!', [
          `Name: ${tool.name}`,
          `Type: ${tool.toolType}`,
          `Status: ${chalk.green('✓')} Connected`,
          '',
          `Use: ${chalk.cyan(`kahuna tool test ${tool.name}`)} to test again`,
        ]);
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to add tool');
        process.exit(1);
      }
    });

  // kahuna tool show <name>
  tool
    .command('show <name>')
    .description('Show tool details')
    .action(async (name: string) => {
      try {
        const userId = await getCurrentUserId(prisma);
        const tool = await toolService.getByName(name, userId);

        if (!tool) {
          ui.error(`Tool not found: ${name}`);
          process.exit(1);
        }

        ui.header('🔧 Tool Details');
        const details = formatToolDetail(tool);

        for (const line of details) {
          console.log(line);
        }
        console.log('');
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to show tool');
        process.exit(1);
      }
    });

  // kahuna tool test <name>
  tool
    .command('test <name>')
    .description('Test tool connection')
    .action(async (name: string) => {
      try {
        const userId = await getCurrentUserId(prisma);
        const tool = await toolService.getByName(name, userId);

        if (!tool) {
          ui.error(`Tool not found: ${name}`);
          process.exit(1);
        }

        ui.header('🔌 Testing Connection');
        const spinner = ora(`Testing ${tool.name}...`).start();

        const connector = getConnector(tool.toolType);
        if (!connector) {
          spinner.fail(`No connector available for ${tool.toolType}`);
          process.exit(1);
        }

        const result = await connector.testConnection(
          tool.configuration as Record<string, unknown>,
          tool.credentials
        );

        if (result.success) {
          spinner.succeed(`Connected in ${result.responseTime}ms`);

          if (result.details) {
            console.log('');
            for (const [key, value] of Object.entries(result.details)) {
              console.log(chalk.dim(`  ${key}: ${value}`));
            }
          }

          // Update test status
          await toolService.updateTestStatus(tool.id, 'success');

          console.log('');
          ui.success('Connection test passed');
        } else {
          spinner.fail('Connection failed');

          // Update test status
          await toolService.updateTestStatus(tool.id, 'failed');

          ui.errorBox('Connection Error', [
            result.message || 'Unknown error',
            '',
            result.error || '',
          ]);
          process.exit(1);
        }
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to test tool');
        process.exit(1);
      }
    });

  // kahuna tool delete <name>
  tool
    .command('delete <name>')
    .description('Delete a tool')
    .action(async (name: string) => {
      try {
        const userId = await getCurrentUserId(prisma);
        const tool = await toolService.getByName(name, userId);

        if (!tool) {
          ui.error(`Tool not found: ${name}`);
          process.exit(1);
        }

        // Confirm deletion
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete "${tool.name}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          ui.info('Deletion cancelled');
          return;
        }

        await toolService.delete(tool.id, userId);
        ui.success(`Tool "${tool.name}" deleted successfully`);
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to delete tool');
        process.exit(1);
      }
    });
}
