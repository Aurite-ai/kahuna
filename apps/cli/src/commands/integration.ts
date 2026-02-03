import chalk from 'chalk';
/**
 * Integration Commands - Manage workflow integrations (GitHub, Slack, etc.)
 */
import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { getCurrentUserId } from '../lib/config.js';
import { prisma } from '../lib/db.js';
import { getConnector } from '../services/connectors/index.js';
import { integrationService } from '../services/integration.service.js';
import * as ui from '../ui/messages.js';
import { formatIntegrationDetail, formatIntegrationsTable } from '../ui/tables.js';

export function registerIntegrationCommands(program: Command): void {
  const integration = program
    .command('integration')
    .description('Manage workflow integrations (GitHub, Slack, etc.)');

  // kahuna integration list
  integration
    .command('list')
    .description('List all configured integrations')
    .action(async () => {
      try {
        const userId = await getCurrentUserId(prisma);
        const integrations = await integrationService.list(userId);

        ui.header('🔧 Workflow Integrations');
        console.log(formatIntegrationsTable(integrations));
        console.log('');

        if (integrations.length === 0) {
          ui.info('Add your first integration with: kahuna integration add');
        } else {
          ui.info(`Run ${chalk.cyan('kahuna integration show <name>')} for details`);
        }
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to list integrations');
        process.exit(1);
      }
    });

  // kahuna integration add
  integration
    .command('add')
    .description('Add a new integration')
    .option('-t, --type <type>', 'Integration type (e.g., github, slack)')
    .action(async (options) => {
      try {
        const userId = await getCurrentUserId(prisma);

        // For now, only GitHub is implemented
        const integrationType = options.type?.toUpperCase() || 'GITHUB';

        if (integrationType !== 'GITHUB') {
          ui.error(`Integration type ${integrationType} is not yet implemented`);
          ui.info('Currently supported: github');
          process.exit(1);
        }

        ui.header('🔌 Add GitHub Integration');

        // Gather integration information (one prompt at a time so Enter advances correctly)
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Integration name:',
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

        const connector = getConnector(integrationType);
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

        // Save integration
        ui.section('Saving Integration');
        const savingSpinner = ora('Creating integration...').start();

        const integration = await integrationService.create(userId, {
          name: answers.name,
          description: answers.description || undefined,
          integrationType,
          configuration: { baseUrl: answers.baseUrl },
          credentials: { token: answers.token },
        });

        // Update test status
        await integrationService.updateTestStatus(integration.id, 'success');

        savingSpinner.succeed('Integration created successfully');

        ui.successBox('Integration Added!', [
          `Name: ${integration.name}`,
          `Type: ${integration.integrationType}`,
          `Status: ${chalk.green('✓')} Connected`,
          '',
          `Use: ${chalk.cyan(`kahuna integration test ${integration.name}`)} to test again`,
        ]);
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to add integration');
        process.exit(1);
      }
    });

  // kahuna integration show <name>
  integration
    .command('show <name>')
    .description('Show integration details')
    .action(async (name: string) => {
      try {
        const userId = await getCurrentUserId(prisma);
        const integration = await integrationService.getByName(name, userId);

        if (!integration) {
          ui.error(`Integration not found: ${name}`);
          process.exit(1);
        }

        ui.header('🔧 Integration Details');
        const details = formatIntegrationDetail(integration);

        for (const line of details) {
          console.log(line);
        }
        console.log('');
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to show integration');
        process.exit(1);
      }
    });

  // kahuna integration test <name>
  integration
    .command('test <name>')
    .description('Test integration connection')
    .action(async (name: string) => {
      try {
        const userId = await getCurrentUserId(prisma);
        const integration = await integrationService.getByName(name, userId);

        if (!integration) {
          ui.error(`Integration not found: ${name}`);
          process.exit(1);
        }

        ui.header('🔌 Testing Connection');
        const spinner = ora(`Testing ${integration.name}...`).start();

        const connector = getConnector(integration.integrationType);
        if (!connector) {
          spinner.fail(`No connector available for ${integration.integrationType}`);
          process.exit(1);
        }

        const result = await connector.testConnection(
          integration.configuration as Record<string, unknown>,
          integration.credentials
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
          await integrationService.updateTestStatus(integration.id, 'success');

          console.log('');
          ui.success('Connection test passed');
        } else {
          spinner.fail('Connection failed');

          // Update test status
          await integrationService.updateTestStatus(integration.id, 'failed');

          ui.errorBox('Connection Error', [
            result.message || 'Unknown error',
            '',
            result.error || '',
          ]);
          process.exit(1);
        }
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to test integration');
        process.exit(1);
      }
    });

  // kahuna integration delete <name>
  integration
    .command('delete <name>')
    .description('Delete an integration')
    .action(async (name: string) => {
      try {
        const userId = await getCurrentUserId(prisma);
        const integration = await integrationService.getByName(name, userId);

        if (!integration) {
          ui.error(`Integration not found: ${name}`);
          process.exit(1);
        }

        // Confirm deletion
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to delete "${integration.name}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          ui.info('Deletion cancelled');
          return;
        }

        await integrationService.delete(integration.id, userId);
        ui.success(`Integration "${integration.name}" deleted successfully`);
      } catch (error) {
        ui.error(error instanceof Error ? error.message : 'Failed to delete integration');
        process.exit(1);
      }
    });
}
