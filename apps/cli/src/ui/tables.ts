import type { WorkflowIntegration } from '@prisma/client';
import chalk from 'chalk';
/**
 * Table formatting utilities
 */
import Table from 'cli-table3';

export function formatIntegrationsTable(integrations: WorkflowIntegration[]): string {
  if (integrations.length === 0) {
    return chalk.yellow('No integrations found');
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Name'),
      chalk.cyan.bold('Type'),
      chalk.cyan.bold('Status'),
      chalk.cyan.bold('Last Tested'),
    ],
    style: {
      head: [],
      border: ['grey'],
    },
  });

  for (const integration of integrations) {
    const status =
      integration.lastTestStatus === 'success'
        ? chalk.green('✓')
        : integration.lastTestStatus === 'failed'
          ? chalk.red('✗ Failed')
          : chalk.gray('-');

    const lastTested = integration.lastTestedAt
      ? formatRelativeTime(integration.lastTestedAt)
      : chalk.gray('Never');

    table.push([integration.name, integration.integrationType, status, lastTested]);
  }

  return table.toString();
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export function formatIntegrationDetail(integration: WorkflowIntegration): string[] {
  const lines: string[] = [];

  lines.push(chalk.bold('Name: ') + integration.name);
  lines.push(chalk.bold('Type: ') + integration.integrationType);

  if (integration.description) {
    lines.push(chalk.bold('Description: ') + integration.description);
  }

  lines.push('');
  lines.push(chalk.bold('Status:'));

  if (integration.lastTestStatus === 'success') {
    lines.push(
      `  ${chalk.green('✓')} Connected (${formatRelativeTime(integration.lastTestedAt!)})`
    );
  } else if (integration.lastTestStatus === 'failed') {
    lines.push(
      `  ${chalk.red('✗')} Connection failed (${formatRelativeTime(integration.lastTestedAt!)})`
    );
  } else {
    lines.push(`  ${chalk.gray('○')} Not tested yet`);
  }

  lines.push('');
  lines.push(chalk.bold('Configuration:'));
  const config = integration.configuration as Record<string, unknown>;
  for (const [key, value] of Object.entries(config)) {
    lines.push(`  ${key}: ${value}`);
  }

  lines.push('');
  lines.push(chalk.dim(`ID: ${integration.id}`));
  lines.push(chalk.dim(`Created: ${new Date(integration.createdAt).toLocaleString()}`));
  lines.push(chalk.dim(`Updated: ${new Date(integration.updatedAt).toLocaleString()}`));

  return lines;
}
