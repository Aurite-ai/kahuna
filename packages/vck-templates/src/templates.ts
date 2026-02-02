/**
 * Template access utilities
 *
 * Functions for accessing VCK template files.
 * Phase 1: Templates are embedded as strings for simplicity.
 * Future phases may load from filesystem.
 */

import type { CopilotConfigTemplate, FrameworkTemplate, TemplateFile } from './types.js';

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
// Embedded Templates (Phase 1)
// =============================================================================

/**
 * Claude Code rules template.
 * These rules guide the copilot when building agents.
 */
const CLAUDE_CODE_RULES = `# Agent Development Rules

## Overview
You are helping build an AI agent using LangGraph. Follow these rules to ensure quality code.

## Core Principles

1. **Keep it Simple** - Start with the minimal working implementation
2. **Test First** - Write tests before implementing features
3. **Document Intent** - Comments should explain "why", not "what"

## Code Standards

### Python
- Use type hints for all function signatures
- Follow PEP 8 style guidelines
- Use descriptive variable names

### LangGraph Specific
- Define clear state schemas
- Keep tools focused and single-purpose
- Handle errors gracefully with informative messages

## Project Structure

\`\`\`
src/agent/
├── __init__.py      # Package initialization
├── graph.py         # Main graph definition
├── state.py         # State schema definitions
└── tools.py         # Tool implementations
\`\`\`

## Getting Started

1. Review the context files to understand the business requirements
2. Start with the state schema in \`state.py\`
3. Implement tools in \`tools.py\`
4. Build the graph in \`graph.py\`
5. Test each component as you build
`;

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
 * Get Claude Code configuration files.
 */
export function getClaudeCodeFiles(): TemplateFile[] {
  return [
    {
      path: '.copilot/rules.md',
      content: CLAUDE_CODE_RULES,
    },
  ];
}

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
