/**
 * CLI Configuration management
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CONFIG_DIR = path.join(os.homedir(), '.kahuna');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export interface CliConfig {
  currentUserId?: string;
  database?: string;
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load CLI configuration
 */
export function loadConfig(): CliConfig {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load config:', error);
    return {};
  }
}

/**
 * Save CLI configuration
 */
export function saveConfig(config: CliConfig): void {
  ensureConfigDir();

  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

/**
 * Get current user ID (create default user if needed)
 */
export async function getCurrentUserId(prisma: any): Promise<string> {
  const config = loadConfig();

  if (config.currentUserId) {
    return config.currentUserId;
  }

  // Create default user
  const user = await prisma.user.create({
    data: {
      email: 'cli@kahuna.local',
      password: 'cli-user', // Not used for authentication
    },
  });

  config.currentUserId = user.id;
  saveConfig(config);

  return user.id;
}
