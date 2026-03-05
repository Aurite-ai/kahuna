/**
 * Set Mode Tool
 *
 * MCP tool for setting and querying the execution mode.
 * Allows users to set a session-wide mode or check the current mode status.
 */

import {
  type ExecutionMode,
  clearSessionMode,
  getAuditLogger,
  getSessionState,
  isValidExecutionMode,
  resolveMode,
  setSessionMode,
} from '../integrations/execution/modes/index.js';
import { type MCPToolResponse, type ToolContext, markdownResponse } from './types.js';

/**
 * Tool definition for MCP registration
 */
export const setModeToolDefinition = {
  name: 'kahuna_set_mode',
  description: `Set or query the execution mode for integration operations.

**Execution Modes:**
- simulation: No network calls, returns mock responses (safe, free, instant)
- sandbox: Real API calls using test/sandbox credentials (safe testing)
- production: Real API calls using production credentials (real operations)

When you set a mode, it becomes the default for all subsequent kahuna_use_integration calls in this session.

Examples:
- Set sandbox mode: action="set", mode="sandbox"
- Check current mode: action="get"
- Clear session mode: action="clear"
- View audit stats: action="stats"`,
  inputSchema: {
    type: 'object' as const,
    properties: {
      action: {
        type: 'string',
        enum: ['set', 'get', 'clear', 'stats'],
        description:
          'Action to perform: "set" (change mode), "get" (show current), "clear" (reset to default), "stats" (show usage stats)',
      },
      mode: {
        type: 'string',
        enum: ['simulation', 'sandbox', 'production'],
        description: 'The mode to set (required when action="set")',
      },
    },
    required: ['action'],
  },
};

/**
 * Handler for set mode tool
 */
export async function setModeToolHandler(
  args: Record<string, unknown>,
  _ctx: ToolContext
): Promise<MCPToolResponse> {
  const action = args.action as string;
  const mode = args.mode as string | undefined;

  switch (action) {
    case 'set':
      return handleSetMode(mode);
    case 'get':
      return handleGetMode();
    case 'clear':
      return handleClearMode();
    case 'stats':
      return handleGetStats();
    default:
      return markdownResponse(
        `Error: Invalid action "${action}". Valid actions: set, get, clear, stats`,
        true
      );
  }
}

/**
 * Handle setting the session mode
 */
function handleSetMode(mode: string | undefined): MCPToolResponse {
  if (!mode) {
    return markdownResponse('Error: mode is required when action="set"', true);
  }

  if (!isValidExecutionMode(mode)) {
    return markdownResponse(
      `Error: Invalid mode "${mode}". Valid modes: simulation, sandbox, production`,
      true
    );
  }

  setSessionMode(mode as ExecutionMode);

  const modeEmoji = mode === 'simulation' ? '⚡' : mode === 'sandbox' ? '🧪' : '🚀';

  return markdownResponse(`# ${modeEmoji} Mode Set: ${mode.toUpperCase()}

Session mode has been set to **${mode}**.

All subsequent \`kahuna_use_integration\` calls will use this mode unless explicitly overridden.

## What This Means

${
  mode === 'simulation'
    ? `- **No network calls** will be made
- **Mock responses** will be returned
- **$0 cost** - no API usage
- Great for learning and testing logic`
    : mode === 'sandbox'
      ? `- **Real API calls** using test credentials
- Uses credentials from \`~/.kahuna/vault/sandbox/\`
- Safe to experiment - won't affect production
- May incur minimal test API costs`
      : `- **Real API calls** using production credentials
- Uses credentials from \`~/.kahuna/vault/production/\`
- ⚠️ **Real consequences** - be careful!
- Real costs will be incurred`
}

## To Change Mode

\`\`\`
kahuna_set_mode(action="set", mode="sandbox")  // or "simulation" or "production"
\`\`\``);
}

/**
 * Handle getting the current mode
 */
function handleGetMode(): MCPToolResponse {
  const sessionState = getSessionState();
  const resolved = resolveMode();

  const sessionMode = sessionState.currentMode;
  const effectiveMode = resolved.mode;
  const modeSource = resolved.source.replace(/_/g, ' ');

  const modeEmoji =
    effectiveMode === 'simulation' ? '⚡' : effectiveMode === 'sandbox' ? '🧪' : '🚀';

  return markdownResponse(`# ${modeEmoji} Current Mode: ${effectiveMode.toUpperCase()}

## Mode Resolution

| Source | Mode |
|--------|------|
| Session | ${sessionMode ?? '_(not set)_'} |
| Effective | **${effectiveMode}** |
| Resolved via | ${modeSource} |

## Allowed Modes

${resolved.allowed ? '✅ Current mode is allowed' : `❌ Current mode is NOT allowed: ${resolved.denialReason}`}

## Quick Actions

- Set mode: \`kahuna_set_mode(action="set", mode="sandbox")\`
- Clear session: \`kahuna_set_mode(action="clear")\`
- View stats: \`kahuna_set_mode(action="stats")\``);
}

/**
 * Handle clearing the session mode
 */
function handleClearMode(): MCPToolResponse {
  const previousState = getSessionState();
  const previousMode = previousState.currentMode;

  clearSessionMode();

  const newResolved = resolveMode();

  return markdownResponse(`# 🔄 Session Mode Cleared

${previousMode ? `Previous session mode **${previousMode}** has been cleared.` : 'No session mode was set.'}

Mode will now be resolved from project or global configuration.

## New Effective Mode

**${newResolved.mode}** (via ${newResolved.source.replace(/_/g, ' ')})`);
}

/**
 * Handle getting audit stats
 */
function handleGetStats(): MCPToolResponse {
  const auditLogger = getAuditLogger();
  const stats = auditLogger.getStats();

  const totalOps = stats.total;
  const successRate = totalOps > 0 ? ((stats.bySuccess.success / totalOps) * 100).toFixed(1) : 0;
  const avgDuration = stats.averageDuration.toFixed(0);

  return markdownResponse(`# 📊 Mode Usage Statistics

## Overview

| Metric | Value |
|--------|-------|
| Total Operations | ${totalOps} |
| Success Rate | ${successRate}% |
| Avg Duration | ${avgDuration}ms |

## By Mode

| Mode | Count | Percentage |
|------|-------|------------|
| ⚡ Simulation | ${stats.byMode.simulation} | ${totalOps > 0 ? ((stats.byMode.simulation / totalOps) * 100).toFixed(1) : 0}% |
| 🧪 Sandbox | ${stats.byMode.sandbox} | ${totalOps > 0 ? ((stats.byMode.sandbox / totalOps) * 100).toFixed(1) : 0}% |
| 🚀 Production | ${stats.byMode.production} | ${totalOps > 0 ? ((stats.byMode.production / totalOps) * 100).toFixed(1) : 0}% |

## Success/Failure

| Status | Count |
|--------|-------|
| ✅ Success | ${stats.bySuccess.success} |
| ❌ Failure | ${stats.bySuccess.failure} |

---
_Statistics are from the current session's audit log._`);
}

/**
 * Export the tool definition and handler together
 */
export const setModeTool = {
  definition: setModeToolDefinition,
  handler: setModeToolHandler,
};
