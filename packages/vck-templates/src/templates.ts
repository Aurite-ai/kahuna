/**
 * Template access utilities
 *
 * Functions for accessing VCK template files.
 * Phase 1: Read templates from filesystem at runtime.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CopilotConfigTemplate, FrameworkTemplate, TemplateFile } from './types.js';

// Get the directory where this module is located
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const currentDir = path.dirname(currentFilePath);

// Templates directory is at packages/vck-templates/templates relative to src/
const TEMPLATES_DIR = path.join(currentDir, '..', 'templates');

/**
 * Available framework templates.
 */
export const FRAMEWORK_TEMPLATES: FrameworkTemplate[] = [
  {
    id: 'langgraph',
    name: 'LangGraph',
    description: 'Python agent framework using LangGraph for stateful workflows',
    path: 'frameworks/langgraph',
  },
];

/**
 * Available copilot configuration templates.
 */
export const COPILOT_CONFIG_TEMPLATES: CopilotConfigTemplate[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    description: 'Configuration for Claude Code (formerly Cline)',
    path: 'copilot-configs/claude-code',
  },
];

/**
 * Get a framework template by ID.
 */
export function getFrameworkTemplate(id: string): FrameworkTemplate | undefined {
  return FRAMEWORK_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get a copilot config template by ID.
 */
export function getCopilotConfigTemplate(id: string): CopilotConfigTemplate | undefined {
  return COPILOT_CONFIG_TEMPLATES.find((t) => t.id === id);
}

/**
 * List all available frameworks.
 */
export function listFrameworks(): FrameworkTemplate[] {
  return [...FRAMEWORK_TEMPLATES];
}

/**
 * List all available copilot configs.
 */
export function listCopilotConfigs(): CopilotConfigTemplate[] {
  return [...COPILOT_CONFIG_TEMPLATES];
}

// =============================================================================
// Filesystem Template Loading
// =============================================================================

/**
 * Recursively read all files from a directory and return them as TemplateFile[].
 * File paths are relative to the given base directory.
 */
function readDirectoryRecursive(dirPath: string, basePath = ''): TemplateFile[] {
  const files: TemplateFile[] = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = basePath ? path.join(basePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      // Recursively read subdirectory
      files.push(...readDirectoryRecursive(fullPath, relativePath));
    } else if (entry.isFile()) {
      // Read file content
      const content = fs.readFileSync(fullPath, 'utf-8');
      files.push({
        path: relativePath,
        content,
      });
    }
  }

  return files;
}

/**
 * Get Claude Code configuration files from the templates directory.
 */
export function getClaudeCodeFiles(): TemplateFile[] {
  const templateDir = path.join(TEMPLATES_DIR, 'copilot-configs', 'claude-code');
  return readDirectoryRecursive(templateDir);
}

// =============================================================================
// Embedded Templates (LangGraph boilerplate - kept as strings for now)
// =============================================================================

/**
 * LangGraph boilerplate - main.py
 */
const LANGGRAPH_MAIN = `"""
Main entry point for the LangGraph agent.
"""

from src.agent.graph import create_graph


def main():
    """Run the agent."""
    graph = create_graph()

    # Example invocation
    result = graph.invoke({
        "messages": [],
        "context": {}
    })

    print("Agent completed:")
    print(result)


if __name__ == "__main__":
    main()
`;

/**
 * LangGraph boilerplate - graph.py
 */
const LANGGRAPH_GRAPH = `"""
LangGraph graph definition.

This module defines the main agent graph structure.
"""

from langgraph.graph import StateGraph, END
from .state import AgentState


def create_graph() -> StateGraph:
    """
    Create and return the agent graph.

    Returns:
        Compiled StateGraph ready for invocation.
    """
    # Create the graph with our state schema
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("process", process_node)

    # Set entry point
    graph.set_entry_point("process")

    # Add edges
    graph.add_edge("process", END)

    return graph.compile()


def process_node(state: AgentState) -> AgentState:
    """
    Main processing node.

    Args:
        state: Current agent state

    Returns:
        Updated agent state
    """
    # TODO: Implement your agent logic here
    return state
`;

/**
 * LangGraph boilerplate - state.py
 */
const LANGGRAPH_STATE = `"""
Agent state schema definitions.

This module defines the state that flows through the graph.
"""

from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class AgentState(TypedDict):
    """
    State schema for the agent.

    Attributes:
        messages: Conversation history with automatic message merging
        context: Additional context data for the agent
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    context: dict
`;

/**
 * LangGraph boilerplate - tools.py
 */
const LANGGRAPH_TOOLS = `"""
Tool implementations for the agent.

This module contains the tools that the agent can use.
"""

from langchain_core.tools import tool


@tool
def example_tool(query: str) -> str:
    """
    An example tool that processes a query.

    Args:
        query: The input query to process

    Returns:
        Processed result string
    """
    # TODO: Implement your tool logic here
    return f"Processed: {query}"
`;

/**
 * LangGraph boilerplate - __init__.py
 */
const LANGGRAPH_INIT = `"""
Agent package initialization.
"""

from .graph import create_graph
from .state import AgentState

__all__ = ["create_graph", "AgentState"]
`;

/**
 * LangGraph boilerplate - pyproject.toml
 */
const LANGGRAPH_PYPROJECT = `[project]
name = "kahuna-agent"
version = "0.1.0"
description = "AI agent built with LangGraph"
requires-python = ">=3.10"
dependencies = [
    "langgraph>=0.2.0",
    "langchain-core>=0.3.0",
    "langchain-openai>=0.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
`;

/**
 * LangGraph boilerplate - README.md
 */
const LANGGRAPH_README = `# LangGraph Agent

An AI agent built with LangGraph.

## Setup

1. Create a virtual environment:
   \`\`\`bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   pip install -e .
   \`\`\`

3. Set your API key:
   \`\`\`bash
   export OPENAI_API_KEY=your-key-here
   \`\`\`

## Usage

Run the agent:
\`\`\`bash
python main.py
\`\`\`

## Project Structure

- \`main.py\` - Entry point
- \`src/agent/\` - Agent implementation
  - \`graph.py\` - Graph definition
  - \`state.py\` - State schemas
  - \`tools.py\` - Tool implementations

## Development

Run tests:
\`\`\`bash
pytest
\`\`\`
`;

/**
 * Get LangGraph boilerplate files.
 */
export function getLangGraphFiles(): TemplateFile[] {
  return [
    { path: 'main.py', content: LANGGRAPH_MAIN },
    { path: 'pyproject.toml', content: LANGGRAPH_PYPROJECT },
    { path: 'README.md', content: LANGGRAPH_README },
    { path: 'src/agent/__init__.py', content: LANGGRAPH_INIT },
    { path: 'src/agent/graph.py', content: LANGGRAPH_GRAPH },
    { path: 'src/agent/state.py', content: LANGGRAPH_STATE },
    { path: 'src/agent/tools.py', content: LANGGRAPH_TOOLS },
  ];
}

/**
 * Get template files for a framework.
 */
export function getFrameworkFiles(frameworkId: string): TemplateFile[] {
  switch (frameworkId) {
    case 'langgraph':
      return getLangGraphFiles();
    default:
      throw new Error(`Unknown framework: ${frameworkId}`);
  }
}

/**
 * Get config files for a copilot.
 */
export function getCopilotConfigFiles(copilotId: string): TemplateFile[] {
  switch (copilotId) {
    case 'claude-code':
      return getClaudeCodeFiles();
    default:
      throw new Error(`Unknown copilot: ${copilotId}`);
  }
}
