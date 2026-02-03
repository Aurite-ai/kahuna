import boxen from 'boxen';
/**
 * UI Messages - Success, error, and info messages with beautiful formatting
 */
import chalk from 'chalk';

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.log(chalk.red('✗'), message);
}

export function warning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function successBox(title: string, lines: string[]): void {
  const content = [chalk.bold.green(`✓ ${title}`), '', ...lines].join('\n');

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    })
  );
}

export function errorBox(title: string, lines: string[]): void {
  const content = [chalk.bold.red(`✗ ${title}`), '', ...lines].join('\n');

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'red',
    })
  );
}

export function header(text: string): void {
  console.log(
    boxen(chalk.bold.cyan(text), {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      margin: { top: 1, bottom: 1 },
      borderStyle: 'round',
      borderColor: 'cyan',
    })
  );
}

export function section(title: string): void {
  console.log('');
  console.log(chalk.bold.cyan(`━━━ ${title} ━━━`));
  console.log('');
}
