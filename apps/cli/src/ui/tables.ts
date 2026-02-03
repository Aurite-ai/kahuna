import type { WorkflowTool } from '@prisma/client';
import chalk from 'chalk';
/**
 * Table formatting utilities
 */
import Table from 'cli-table3';

export function formatToolsTable(tools: WorkflowTool[]): string {
  if (tools.length === 0) {
    return chalk.yellow('No tools found');
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

  for (const tool of tools) {
    const status =
      tool.lastTestStatus === 'success'
        ? chalk.green('✓')
        : tool.lastTestStatus === 'failed'
          ? chalk.red('✗ Failed')
          : chalk.gray('-');

    const lastTested = tool.lastTestedAt
      ? formatRelativeTime(tool.lastTestedAt)
      : chalk.gray('Never');

    table.push([tool.name, tool.toolType, status, lastTested]);
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

export function formatToolDetail(tool: WorkflowTool): string[] {
  const lines: string[] = [];

  lines.push(chalk.bold('Name: ') + tool.name);
  lines.push(chalk.bold('Type: ') + tool.toolType);

  if (tool.description) {
    lines.push(chalk.bold('Description: ') + tool.description);
  }

  lines.push('');
  lines.push(chalk.bold('Status:'));

  if (tool.lastTestStatus === 'success') {
    lines.push(`  ${chalk.green('✓')} Connected (${formatRelativeTime(tool.lastTestedAt!)})`);
  } else if (tool.lastTestStatus === 'failed') {
    lines.push(`  ${chalk.red('✗')} Connection failed (${formatRelativeTime(tool.lastTestedAt!)})`);
  } else {
    lines.push(`  ${chalk.gray('○')} Not tested yet`);
  }

  lines.push('');
  lines.push(chalk.bold('Configuration:'));
  const config = tool.configuration as Record<string, unknown>;
  for (const [key, value] of Object.entries(config)) {
    lines.push(`  ${key}: ${value}`);
  }

  lines.push('');
  lines.push(chalk.dim(`ID: ${tool.id}`));
  lines.push(chalk.dim(`Created: ${new Date(tool.createdAt).toLocaleString()}`));
  lines.push(chalk.dim(`Updated: ${new Date(tool.updatedAt).toLocaleString()}`));

  return lines;
}
