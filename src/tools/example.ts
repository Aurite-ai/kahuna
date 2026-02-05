/**
 * Example Tool Stub
 *
 * This file demonstrates the complete pattern for implementing a Kahuna MCP tool.
 * Use this as a template when creating new tools.
 *
 * DELETE THIS FILE once real tools are implemented.
 *
 * ============================================================================
 * TOOL IMPLEMENTATION PATTERN
 * ============================================================================
 *
 * Each tool file exports two things:
 *   1. `definition` - The tool schema (name, description, inputSchema)
 *   2. `handler` - The async function that executes when the tool is called
 *
 * The tool registry (src/tools/index.ts) imports these and registers them
 * with the MCP server.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ValidationError, formatErrorResult } from '../lib/errors.js';
import { formatResponse } from '../lib/response.js';

// =============================================================================
// TOOL DEFINITION
// =============================================================================

/**
 * Tool definition following MCP schema.
 *
 * IMPORTANT: The `description` field is your PRIMARY steering mechanism.
 * Invest tokens here to guide the copilot on WHEN and HOW to use this tool.
 *
 * Include:
 *   - USE THIS TOOL WHEN: Clear triggers for when this tool applies
 *   - <examples>: Concrete usage examples
 *   - <hints>: Tips for effective use
 */
export const definition = {
  name: 'example_tool',
  description: `Example tool demonstrating the Kahuna tool pattern.

USE THIS TOOL WHEN:
- You want to see how Kahuna tools work
- Testing that the MCP server is responding correctly
- Learning the tool implementation pattern

DO NOT USE THIS TOOL WHEN:
- You need actual functionality (this is just a demo)

<examples>
### Basic usage
example_tool(message="Hello, Kahuna!")

### With all parameters
example_tool(
  message="Testing the example tool",
  uppercase=true
)
</examples>

<hints>
- This is a demonstration tool - delete it when implementing real tools
- Use this pattern for all new tool implementations
- The description above is parsed by the copilot to understand when to use this tool
</hints>`,

  inputSchema: {
    type: 'object' as const,
    properties: {
      message: {
        type: 'string',
        description: 'A message to echo back (required)',
      },
      uppercase: {
        type: 'boolean',
        description: 'Convert message to uppercase (optional, default: false)',
      },
    },
    required: ['message'],
  },
};

// =============================================================================
// INPUT TYPES
// =============================================================================

/**
 * Typed interface for the tool's input arguments.
 * This provides type safety in the handler function.
 */
interface ExampleToolInput {
  message: string;
  uppercase?: boolean;
}

// =============================================================================
// TOOL HANDLER
// =============================================================================

/**
 * Handle the example_tool call.
 *
 * @param args - The validated input arguments
 * @returns CallToolResult with formatted response
 *
 * IMPLEMENTATION NOTES:
 * 1. Always validate inputs early (even though MCP validates against schema)
 * 2. Use try/catch with formatErrorResult for consistent error handling
 * 3. Use formatResponse for consistent response formatting
 * 4. Include hints in the response to guide the copilot's next action
 */
export async function handler(args: Record<string, unknown>): Promise<CallToolResult> {
  try {
    // -------------------------------------------------------------------------
    // 1. VALIDATE AND PARSE INPUTS
    // -------------------------------------------------------------------------
    // Cast to our typed interface. MCP validates against schema, but we may
    // want additional validation here.

    const input = args as unknown as ExampleToolInput;

    if (!input.message || typeof input.message !== 'string') {
      throw new ValidationError('message is required and must be a string', {
        hints: ['Provide a message parameter', 'Example: example_tool(message="Hello!")'],
      });
    }

    // -------------------------------------------------------------------------
    // 2. EXECUTE TOOL LOGIC
    // -------------------------------------------------------------------------
    // This is where the actual tool work happens. For the example tool,
    // we just process the message.

    let processedMessage = input.message;
    if (input.uppercase) {
      processedMessage = processedMessage.toUpperCase();
    }

    // -------------------------------------------------------------------------
    // 3. BUILD RESPONSE
    // -------------------------------------------------------------------------
    // Use formatResponse for consistent formatting. Always include hints
    // to guide the copilot's next action.

    return formatResponse({
      title: 'Example Tool Response',
      summary: 'Successfully processed your message.',
      body: `## Your Message

> ${processedMessage}

## Tool Pattern Demonstrated

This response shows:
- **Title** - Clear heading for the response
- **Summary** - Brief description of what happened
- **Body** - Structured content with markdown
- **Hints** - Steering for what to do next (see below)`,
      hints: [
        'This is a demo tool - delete src/tools/example.ts when implementing real tools',
        'Look at the source code to understand the implementation pattern',
        'Copy this file as a starting point for new tools',
      ],
    });
  } catch (error) {
    // -------------------------------------------------------------------------
    // 4. ERROR HANDLING
    // -------------------------------------------------------------------------
    // Always use formatErrorResult for consistent error responses.
    // ToolError subclasses will include their hints automatically.

    return formatErrorResult(error);
  }
}
