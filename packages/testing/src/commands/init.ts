/**
 * test:init command - Initialize testing configuration
 *
 * Creates a .kahuna configuration file at the repository root
 * with tester preferences for VCK quality testing.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";
import { DEFAULT_CONFIG, type KahunaConfig } from "../types.js";

/**
 * Find the repository root by looking for package.json with workspaces
 */
function findRepoRoot(): string {
  let current = process.cwd();

  while (current !== "/") {
    const packageJsonPath = path.join(current, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        // Root package.json has workspaces or is named "kahuna"
        if (pkg.workspaces || pkg.name === "kahuna") {
          return current;
        }
      } catch {
        // Continue searching
      }
    }
    current = path.dirname(current);
  }

  // Fallback to current directory
  return process.cwd();
}

/**
 * Get the path to the .kahuna config file
 */
export function getConfigPath(): string {
  return path.join(findRepoRoot(), ".kahuna");
}

/**
 * Load existing configuration if it exists
 */
export function loadConfig(): KahunaConfig | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(content);

    // Merge with defaults for any missing fields
    return {
      tester: {
        name: parsed?.tester?.name ?? DEFAULT_CONFIG.tester.name,
        email: parsed?.tester?.email,
      },
      defaults: {
        copilot: parsed?.defaults?.copilot ?? DEFAULT_CONFIG.defaults.copilot,
        framework:
          parsed?.defaults?.framework ?? DEFAULT_CONFIG.defaults.framework,
        scenario: parsed?.defaults?.scenario,
      },
      api: {
        url: parsed?.api?.url ?? DEFAULT_CONFIG.api.url,
      },
    };
  } catch (error) {
    throw new Error(
      `Invalid .kahuna file: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Save configuration to .kahuna file
 */
export function saveConfig(config: KahunaConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Prompt user for input
 */
function prompt(
  rl: readline.Interface,
  question: string,
  defaultValue?: string,
): Promise<string> {
  const displayQuestion = defaultValue
    ? `${question} [${defaultValue}]: `
    : `${question}: `;

  return new Promise((resolve) => {
    rl.question(displayQuestion, (answer) => {
      resolve(answer.trim() || defaultValue || "");
    });
  });
}

/**
 * Execute the init command
 */
export async function initCommand(): Promise<void> {
  console.log("");
  console.log("🔧 Kahuna Testing Setup");
  console.log("");

  // Check for existing config
  const existingConfig = loadConfig();
  if (existingConfig) {
    console.log("Found existing .kahuna configuration.");
    console.log("");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Gather tester info
    const name = await prompt(
      rl,
      "What's your name?",
      existingConfig?.tester.name || DEFAULT_CONFIG.tester.name,
    );
    const email = await prompt(
      rl,
      "What's your email? (optional)",
      existingConfig?.tester.email,
    );

    // Copilot selection
    console.log("");
    console.log("Select your coding copilot:");
    console.log("  1. Claude Code (default)");
    console.log("  2. Cursor");
    console.log("  3. OpenAI Codex");
    const copilotChoice = await prompt(rl, "Enter choice (1-3)", "1");

    const copilotMap: Record<string, KahunaConfig["defaults"]["copilot"]> = {
      "1": "claude-code",
      "2": "cursor",
      "3": "codex",
    };
    const copilot =
      copilotMap[copilotChoice] ||
      existingConfig?.defaults.copilot ||
      DEFAULT_CONFIG.defaults.copilot;

    // Framework selection (only langgraph for MVP)
    console.log("");
    console.log("Select your agent framework:");
    console.log("  1. LangGraph (default)");
    // For MVP, only langgraph is supported, so we ignore the user's choice
    await prompt(rl, "Enter choice (1)", "1");
    const framework: KahunaConfig["defaults"]["framework"] = "langgraph";

    // API URL
    console.log("");
    const apiUrl = await prompt(
      rl,
      "API URL",
      existingConfig?.api.url || DEFAULT_CONFIG.api.url,
    );

    // Build config
    const config: KahunaConfig = {
      tester: {
        name,
        ...(email && { email }),
      },
      defaults: {
        copilot,
        framework,
        scenario: existingConfig?.defaults.scenario,
      },
      api: {
        url: apiUrl,
      },
    };

    // Save config
    saveConfig(config);

    console.log("");
    console.log("✅ Created .kahuna configuration file");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Start the API server: pnpm dev:api");
    console.log("  2. Create a test project: pnpm test:create");
    console.log("");
  } finally {
    rl.close();
  }
}
