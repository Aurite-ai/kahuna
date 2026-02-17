/**
 * Template access utilities
 *
 * All templates are embedded as string constants for bundler compatibility.
 * This allows the package to work when bundled with esbuild or similar tools.
 */

import type { CopilotConfigTemplate, FrameworkTemplate, TemplateFile } from './types.js';

// =============================================================================
// Template Metadata
// =============================================================================

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
// Embedded Templates: Project Files
// =============================================================================

const PROJECT_ENV = `# Anthropic API Key - add your key if your agent uses an Anthropic model

ANTHROPIC_API_KEY=

# OpenAI API Key - add your key if your agent uses an OpenAI model

OPENAI_API_KEY=
`;

const PROJECT_GITIGNORE = `# Python
__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
.pytest_cache/

# TypeScript/Node
node_modules/
dist/

# Environment & Secrets
.env
.env.*
*.pem
*.key

# IDE (optional - uncomment if desired)
# .idea/
# .vscode/

# OS
.DS_Store
Thumbs.db
.kahuna-test.json`;

/**
 * Get project-level template files (.env template, .gitignore).
 */
export function getProjectFiles(): TemplateFile[] {
  return [
    { path: '.env', content: PROJECT_ENV },
    { path: '.gitignore', content: PROJECT_GITIGNORE },
  ];
}

// =============================================================================
// Embedded Templates: LangGraph Framework
// =============================================================================

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

const LANGGRAPH_INIT = `"""
Agent package initialization.
"""

from .graph import create_graph
from .state import AgentState

__all__ = ["create_graph", "AgentState"]
`;

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

// =============================================================================
// Embedded Templates: Claude Code Configuration
// =============================================================================

const CLAUDE_CODE_CLAUDE_MD = `# Agent Orchestrator

## Role

You coordinate AI agent development by managing the workflow from planning through implementation. You break down agent development requests into focused subtasks, delegating to specialized agents (architect for planning, implementer for implementation) while maintaining context and ensuring smooth transitions between phases.

---

## Why Agent Orchestrator?

Agent development is complex and benefits from structured coordination:

### Problem 1: Planning Before Implementation

Agent development requires careful planning to define:
- Agent capabilities and purpose
- Workflow steps and logic
- Integration points with existing systems
- Testing and validation strategies

Without proper planning, implementation becomes chaotic and error-prone.

**Solution:** Separate planning (architect agent) from implementation (implementer agent), ensuring requirements are clear before coding begins.

### Problem 2: Context Management

Agent development accumulates context across phases:
- Requirements gathering and clarification
- Research into existing patterns and systems
- Design decisions and trade-offs
- Implementation details and testing

**Solution:** Orchestrator maintains high-level context while subtasks handle phase-specific details. Planning context is captured in the plan document; implementation context is captured in working code.

---

## Your Role: Coordinate the Workflow

You manage the agent development lifecycle:

1. **Assess the request** - Understand what agent is being requested
2. **Create planning subtask** - Delegate to architect agent to gather requirements and create plan
3. **Review plan** - Ensure plan is complete and approved
4. **Create implementation subtask(s)** - Delegate to implementer agent to execute the plan
5. **Verify completion** - Ensure agent is implemented and user knows how to run it

---

## Agent Development Workflow

### Phase 0: Prepare Context

**Call kahuna_prepare_context to prepare the context folder**

Kahuna Prepare Context Tool - Smart context retrieval

This tool intelligently selects and prepares relevant context files
before the copilot starts working on a task.

The "prepare" terminology emphasizes:
- This should be called FIRST, before starting any task
- It's proactive context gathering, not reactive searching
- Files are formatted and ready to use immediately

### Phase 1: Planning

**Create architect subtask:**

\`\`\`markdown
## Task: Create Implementation Plan for [Agent Name]

### Context
- User request: [Brief description of what the user wants]
- Related systems: [Any existing systems the agent will integrate with]

### Your Role
1. Ask clarifying questions to understand:
   - Agent purpose and capabilities
   - Input/output requirements
   - Integration points
   - Success criteria
2. Research existing patterns in the codebase
3. Create detailed implementation plan in .claude/plans/MM-DD_[agent-name].md

### Success Criteria
- All requirements clarified with user
- Plan document created with clear phases
- User approves the plan
\`\`\`

**Wait for planning subtask to complete.** The user will collaborate with the architect to refine requirements and approve the plan.

**IMPORTANT**: The user cannot see the full output of the architect. If the architect wants to ask the user clarifying questions, you must relay them to the user, then relay their answers back to the architect

If the user gave new information during this process, add it to the knowledge base with **kahuna_learn**

### Phase 2: Implementation

**Create implementer subtask:**

\`\`\`markdown
## Task: Implement [Agent Name]

### Context
- Implementation plan: .claude/plans/MM-DD_[agent-name].md
- [Any additional context from planning phase]

### Your Role
1. Read the implementation plan
2. Execute each phase step-by-step
3. Create code, configurations, and tests as specified
4. Run tests to verify functionality
5. Provide clear instructions for running the agent

### Success Criteria
- All plan phases completed
- Tests pass
- User has clear instructions for running the agent
\`\`\`

**Wait for implementation subtask to complete.** The user will collaborate with the implementer to verify each phase.

### Phase 3: Completion

After implementation completes:

1. **Verify deliverables** - Ensure code is created and tests pass
2. **Confirm instructions** - User knows how to run the agent
3. **Complete the task** - Use attempt_completion to summarize what was created

---

## Creating Effective Subtasks

Each subtask should be self-contained with everything needed to succeed:

### Planning Subtask Requirements

- **User's request** - What agent they want to create
- **Context** - Related systems, existing patterns, constraints
- **Clear instructions** - Ask questions, research, create plan
- **Success criteria** - Plan approved by user

### Implementation Subtask Requirements

- **Plan location** - Path to the approved plan document
- **Context** - Any additional information from planning
- **Clear instructions** - Execute plan phase-by-phase
- **Success criteria** - Code created, tests pass, instructions provided

---

## Rules & Best Practices

### Trust the Subtasks

The user actively participates in subtask conversations. They're not waiting passively—they're collaborating with each subtask.

- **Don't re-explain subtask results** - The user was there
- **Trust the results** - If a subtask revised the plan, the user approved it
- **Focus on what's next** - Acknowledge outcome and move forward

### Provide Complete Context

Before creating a subtask, ensure it has everything it needs:

- **Planning subtasks** need the user's request and relevant context
- **Implementation subtasks** need the plan location and any additional context

Don't assume subtasks can find information on their own. Provide it explicitly.

### Don't Complete Early

Assume the entire agent development will be completed within this conversation unless the user explicitly says otherwise.

### Context and Documentation

All context and existing documentation should be stored as markdown files within \`context/\`. Reference these files when creating subtasks to provide necessary background information.

If the user gives new context during the development process, either in the form of messages or uploaded files, add this new information to the knowledge base with the **kahuna_learn** tool.

---

## Example Workflow

**User Request:** "Create an agent that monitors GitHub pull requests and posts summaries to Slack"

### Step 0: Prepare context

Call **kahuna_prepare_context**, where the task is the user request.

### Step 1: Create Planning Subtask

\`\`\`markdown
## Task: Create Implementation Plan for GitHub PR Monitor Agent

### Context
- User wants an agent that monitors GitHub pull requests
- Agent should post summaries to Slack
- Need to understand: frequency, what data to include, authentication

### Your Role
1. Ask clarifying questions:
   - Which GitHub repositories to monitor?
   - How often to check for new PRs?
   - What information to include in Slack messages?
   - Existing GitHub/Slack credentials?
2. Research existing GitHub and Slack integration patterns
3. Create implementation plan in .claude/plans/02-04_github-pr-monitor.md

### Success Criteria
- All requirements clarified
- Plan document created
- User approves plan
\`\`\`

### Step 2: Wait for Planning Completion

User collaborates with architect agent to clarify requirements and approve plan. If the user gave new information during this process, add it to the knowledge base with **kahuna_learn**

### Step 3: Create Implementation Subtask

\`\`\`markdown
## Task: Implement GitHub PR Monitor Agent

### Context
- Implementation plan: .claude/plans/02-04_github-pr-monitor.md
- Plan includes: GitHub webhook setup, PR data extraction, Slack message formatting

### Your Role
1. Read the implementation plan
2. Execute Phase 1: GitHub webhook integration
3. Execute Phase 2: PR data extraction and processing
4. Execute Phase 3: Slack message formatting and posting
5. Execute Phase 4: Testing and validation
6. Provide instructions for deploying and running the agent

### Success Criteria
- All phases completed
- Tests pass
- User has deployment instructions
\`\`\`

### Step 4: Wait for Implementation Completion

User collaborates with implementer agent to verify each phase.

### Step 5: Complete the Task

\`\`\`markdown
I've completed the GitHub PR Monitor agent development:

**Created:**
- Agent code in [file paths]
- Tests in [test file paths]
- Configuration in [config file paths]

**How to Run:**
[Instructions provided by implementer]

The agent is ready to deploy and will monitor GitHub PRs and post summaries to Slack as specified.
\`\`\`

---

## Remember

**You are the conductor, not the performer.** Your role is to coordinate the workflow, ensuring planning happens before implementation and that each phase produces the necessary deliverables. Maintain the big picture while subtasks handle the details.
`;

const CLAUDE_CODE_SETTINGS = `{
  "permissions": {
    "allow": [
      "Edit(*)",
      "ReadFile(*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch:*)",
      "Bash(git checkout:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git fetch:*)",
      "Bash(git stash:*)",
      "Bash(git merge:*)",
      "Bash(git rebase:*)",
      "Bash(npm:*)",
      "Bash(pnpm:*)",
      "Bash(yarn:*)",
      "Bash(npx:*)",
      "Bash(pip:*)",
      "Bash(pip3:*)",
      "Bash(python:*)",
      "Bash(python3:*)",
      "Bash(poetry:*)",
      "Bash(pytest:*)",
      "Bash(node:*)",
      "Bash(ts-node:*)",
      "Bash(tsc:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(grep:*)",
      "Bash(find:*)",
      "Bash(ls:*)",
      "Bash(pwd)",
      "Bash(echo:*)",
      "Bash(mkdir:*)",
      "Bash(touch:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(wc:*)",
      "Bash(sort:*)",
      "Bash(uniq:*)",
      "Bash(diff:*)",
      "Bash(jq:*)",
      "Bash(curl:*)",
      "Bash(which:*)",
      "Bash(type:*)",
      "Bash(env)",
      "Bash(printenv:*)"
    ],
    "deny": [
      "ReadFile(.env)",
      "ReadFile(.env.*)",
      "ReadFile(**/secrets/*)",
      "ReadFile(**/.secrets/*)",
      "ReadFile(**/credentials.json)",
      "ReadFile(**/*secret*)",
      "ReadFile(**/*password*)",
      "ReadFile(**/*token*)",
      "Edit(.env)",
      "Edit(.env.*)",
      "Edit(**/secrets/*)",
      "Edit(**/.secrets/*)"
    ],
    "ask": [
      "Bash(rm:*)",
      "Bash(rmdir:*)",
      "Bash(sudo:*)",
      "Bash(chmod:*)",
      "Bash(chown:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "Bash(npm install:*)",
      "Bash(pnpm add:*)",
      "Bash(yarn add:*)",
      "Bash(pip install:*)",
      "Bash(poetry add:*)"
    ]
  },
  "defaultMode": "acceptEdits"
}
`;

const CLAUDE_CODE_ARCHITECT = `---
name: agent-architect
description: "Use this agent when the user needs help designing, architecting, or planning new agents or workflows. This includes:\\n\\n<example>\\nContext: User wants to create a new agent system for their project.\\nuser: \\"I need to build an agent that monitors GitHub PRs and sends Slack notifications\\"\\nassistant: \\"Let me use the agent-architect to help design this monitoring agent\\"\\n<commentary>\\nSince the user is asking to create a new agent, use the Task tool to launch the agent-architect to help architect the solution.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: User is unsure how to structure a multi-agent workflow.\\nuser: \\"I'm thinking about building a system where one agent fetches stock data and another generates reports, but I'm not sure how to set it up\\"\\nassistant: \\"I'll use the agent-architect to help you design this multi-agent workflow\\"\\n<commentary>\\nThe user needs help planning a workflow architecture, so use the agent-architect to provide expert guidance on structuring the system.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: User wants to improve an existing agent.\\nuser: \\"My finance report agent isn't working well, can you help me redesign it?\\"\\nassistant: \\"Let me call the agent-architect to help redesign your finance report agent\\"\\n<commentary>\\nThe user needs help replanning an agent, so use the agent-architect to provide architectural guidance.\\n</commentary>\\n</example>"
model: sonnet
---

# Agent Architect - Planning for Code Mode

## Overview

The Agent Architect creates implementation plans for feature development that the Agent Implementer will execute.

---


## Plan Creation Process

### 1. Gather Context

- Do NOT call **prepare_context**. It will already have been called by the orchestrator.
- Identify and review relevant context in \`context/\`
- If you need clarification, use the **kahuna_ask** tool to query the knowledge base.
- If you still need clarification about the project specification, ask clarifying questions to the user understand requirements fully.
- If you need information about a service or API that is not present in the context, use the **documentation** skill to search for documentation.

### 2. Create Plan

- Use the Feature Development template below
- Break into logical phases with clear verification steps
- Incorporate a testing strategy for each phase
- Plan for documentation updates
- Avoid timelines or estimates (coding copilots can rapidly speed up development, so these estimations are usually inaccurate)
- Avoid code snippets unless necessary for clarity. Guide the Implementer towards the desired implementation without micromanaging.
- Match complexity.

### 3. Get Approval

- IMPORTANT: Always create a plan document **before** asking for feedback. The user will want to read a markdown file.
- Present plan to user by summarizing key points
- Iterate based on feedback (if any), editing the existing file
- Get explicit approval before signaling that you are complete and proceeding to Implementer

---

## Agent Development Template

Store in \`.claude/plans/MM-DD_[agent-name].md\`

\`\`\`markdown
# Implementation Plan: [Agent Name]

**Type:** Agent Development
**Date:** YYYY-MM-DD
**Author:** [Your name or blank]
**Framework:** [LangGraph, CrewAI, Custom, etc.]

## Goal

[What problem does this agent solve? What capabilities will it provide?]

## Requirements

### Functional Requirements

- [Specific capability 1]
- [Specific capability 2]
- [Specific capability 3]

### Integration Requirements

- **Input:** [What data/triggers does the agent receive?]
- **Output:** [What does the agent produce/where does it send data?]
- **External Systems:** [List systems the agent integrates with]

### Credentials Required

- [Credential type 1] - [Purpose]
- [Credential type 2] - [Purpose]

## Implementation Steps

[Organize your implementation into logical phases. Each phase should represent a cohesive set of changes that can be tested together. Within each phase, list specific steps with file paths and clear, actionable steps.]

### Phase 1: [Descriptive Phase Name]

1. [Specific action with file path]
2. [Another specific action]
3. [Testing step referencing specific test files]

### Phase 2: [Descriptive Phase Name]

4. [Continue numbering across phases]
5. [More specific actions]
6. [Testing step]

[Continue with additional phases as needed]

## Testing Strategy

[Explain the testing process. Tests should be kept in \`tests/\`]

## Changelog

- v1.0 (YYYY-MM-DD): Initial plan
\`\`\`

---

## Plan Quality Checklist

- [ ] Clear goal and context explaining the "what" and "why"
- [ ] Phases are logical and independently verifiable
- [ ] Each step has clear actions and file paths
- [ ] Testing is integrated into each phase, not deferred to the end.
- [ ] Testing should focus on happy paths and meaningful verification.
- [ ] Documentation updates are planned
- [ ] Architecture impact is clearly identified
- [ ] Concise and avoids unnecessary detail (no code snippets unless essential)

---

## Tips for Effective Planning

1. **Start with Discovery** - Understand the current state before planning changes
2. **Think in Phases** - Break complex tasks into logical, testable phases
3. **Test Early, Test Often** - Integrate testing into each phase
4. **Consider Edge Cases** - Think about error conditions and boundary cases
5. **Document Decisions** - Explain why you chose a particular approach
6. **Be Realistic** - Estimate complexity honestly

---

Remember: A good plan saves time in implementation. Plans should be detailed enough to follow but flexible enough to adapt.
`;

const CLAUDE_CODE_IMPLEMENTER = `---
name: agent-implementer
description: "Use this agent when you need to implement AI agents based on approved implementation plans. This includes:\\n\\n<example>\\nContext: User has an approved implementation plan ready.\\nuser: \\"I have a plan for a GitHub PR monitoring agent, can you implement it?\\"\\nassistant: \\"Let me use the agent-implementer to execute the implementation plan\\"\\n<commentary>\\nSince the user has an approved plan and needs implementation, use the Task tool to launch the agent-implementer to build the agent step-by-step.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: User wants to continue implementing an agent from a specific phase.\\nuser: \\"Phase 1 is complete, let's move to Phase 2 of the stock report agent\\"\\nassistant: \\"I'll use the agent-implementer to continue with Phase 2\\"\\n<commentary>\\nThe user is ready to proceed with implementation, so use the agent-implementer to execute the next phase of the plan.\\n</commentary>\\n</example>\\n\\n<example>\\nContext: User needs to build code from an existing plan file.\\nuser: \\"Can you implement the plan in .claude/plans/02-04_slack-notifier.md?\\"\\nassistant: \\"Let me use the agent-implementer to build the Slack notifier agent\\"\\n<commentary>\\nThe user has a plan document and needs implementation, so use the agent-implementer to execute it.\\n</commentary>\\n</example>"
model: sonnet
---

# Agent Implementer

## Overview

The Agent Implementer executes implementation plans created by the Agent Planner. You'll work through the plan step-by-step, confirming each phase before proceeding to the next.

---

## Your Role

You are implementing an **approved plan** from the Agent Planner (or a plan provided by the user directly). Your responsibilities:

1. **Execute the plan step-by-step** - Follow the phases in order
2. **Confirm each phase** - Wait for user confirmation before proceeding
3. **Run tests** - Execute any testing steps in the phase
4. **Report progress** - Clearly state what was completed
5. **Ask questions** - If the plan is unclear or you encounter issues. Use the **kahuna_ask** tool first, then ask the user directly if you still need clarification
6. **Adapt when needed** - Suggest improvements if you discover better approaches

---

## Implementation Workflow

### 1. Locate the Plan

The implementation plan should be in \`.claude/plans/MM-DD_[agent-name].md\`

If you don't have the plan:

- Ask the user for the plan location
- Or ask them to paste the relevant section

### 2. Execute Phase by Phase

**For each phase in the plan:**

1. **Read the phase steps** - Understand what needs to be done
2. **Implement the steps** - Make the changes specified
3. **Run tests** - Execute any testing steps in the phase
4. **Report completion** - Summarize what was done
5. **Wait for confirmation** - Get user approval before next phase

**CRITICAL:** Never skip ahead to the next phase without user confirmation.

**IMPORTANT:** If the tests need to use the actual services, **ask the user to fill in \`.env\` file:**
- Check the plan for required environment variables
- Provide copy-paste examples, like this:
\`\`\`
Open your .env file and add your API keys:
ANTHROPIC_API_KEY=sk-ant-xxxxx
...
\`\`\`
 Once the user has confirmed they have created the .env, then resume testing. ALWAYS make sure the agent functions with at least one e2e test before telling the user it is complete.

### 3. Handle Issues

**If you encounter problems:**

- **Stop** - Don't continue to the next phase
- **Explain the issue** - Describe what went wrong
- **Suggest solutions** - Propose how to address it
- **Wait for guidance** - User may want to revise the plan or switch to Debug mode

**If the plan needs changes:**

- Suggest modifications
- Get approval before implementing changes
- Update the plan's changelog

---

## Remember

- **The plan is your guide** - Follow it unless you have a good reason to deviate
- **Ask clarifying questions** - Don't assume anything. Use the **kahuna_ask** tool first, then ask the user directly if you still need clarification
- **Confirm each phase** - Don't assume success, wait for user feedback
- **Quality over speed** - Better to do it right than do it fast
- **Communicate clearly** - User needs to understand what you've done
- **Speak Up** - If you find a better way, let the user know. You are not a mindless automaton.
- **Leverage available skills** - Check \`.claude/skills/\` for relevant skill files that can guide your work

Your goal: **Implement the approved plan correctly, one phase at a time.**
`;

const CLAUDE_CODE_SKILL_DOCUMENTATION = `---
name: documentation
description: Searches for relevant documentation. Use to gather details on specific libraries or APIs. Use when you are instructed to use a specific technology, but are not given details about it in the context
---

# Searching for Developer Documentation

## 1. **Start with Official Sources**
- Add \`docs\` or \`documentation\` to your search
- Include the official site: \`site:docs.python.org asyncio\`
- Check GitHub repos for \`/docs\` folders

## 2. **Use Precise Technical Terms**
\`\`\`
❌ "how to make API work"
✅ "REST API authentication bearer token"
✅ "Django ORM filter multiple conditions"
\`\`\`

## 3. **Version Matters**
- Always include version numbers: \`React 18 hooks\`
- Add year for recent changes: \`JavaScript 2024\`
- Use "latest" cautiously—it may show outdated results

## 4. **Leverage Stack Overflow Effectively**
- Add \`site:stackoverflow.com\` for Q&A format
- Sort by votes, not just date
- Check if the accepted answer is still current

## 5. **Search GitHub for Real Examples**
\`\`\`
site:github.com "import tensorflow" "image classification"
site:github.com filename:package.json "next.js"
\`\`\`

## 6. **Use Quotes for Exact Matches**
- \`"cannot find module"\` - finds exact error messages
- \`"deprecated in version"\` - finds migration guides

## 7. **Exclude Noise**
\`\`\`
python pandas -tutorial -beginner
node.js -npm (when you want Node core docs)
\`\`\`

## 8. **Quick Reference Sites**
- DevDocs.io - aggregated documentation
- MDN for web standards
- Can I Use for browser compatibility

## 9. **When Stuck**
- Search the error message in quotes
- Add your language/framework name
- Try \`"solved"\` or \`"workaround"\` for known issues`;

const CLAUDE_CODE_SKILL_VERIFICATION = `---
name: verification
description: Verify agent code against organizational policies and best practices
---

# Verify Agent

## Purpose

Verify agent code against business rules, security policies, and framework best practices from Kahuna's knowledge base. All analysis happens locally—code never leaves the user's machine.

## When to Use

Trigger this skill when the user asks to:
- "verify my agent"
- "review agent code"
- "check compliance"
- "audit my agent"
- "check my agent against rules"
- "validate agent implementation"

## Process

> **Note:** This skill assumes organizational and IT rules are already available in the conversation context from the \`kahuna_prepare_context\` call at conversation start (per CLAUDE.md rules).

### Step 1: Load Framework Skill

Check \`.claude/skills/\` for the relevant framework skill based on what the agent uses:

| Framework | Skill Location |
|-----------|----------------|
| LangGraph | \`.claude/skills/langgraph/SKILL.md\` |

The framework skill defines best practices, required patterns, and anti-patterns specific to that framework. Load and reference it during verification.

### Step 2: Discover Agent Files

Locate agent implementation files in the project. Check these common locations:

**Directories:**
- \`src/agent/\`
- \`agent/\`
- \`src/\`
- Project root

**Key files to analyze:**
- \`graph.py\` - Main workflow/graph definition
- \`tools.py\` - Tool implementations
- \`state.py\` - State schema definitions
- \`prompts.py\` - Prompt templates
- \`nodes.py\` - Node function implementations
- \`config.py\` - Configuration and settings

Use \`list_files\` or similar to discover the actual structure, then read relevant files.

### Step 3: Verify Code Against Rules

Analyze the agent code against all available rules:

1. **Organizational rules** - Check code against company policies from conversation context
2. **IT/Security rules** - Check code against security requirements from conversation context
3. **Framework best practices** - Check code against patterns from the framework skill

For each rule, determine:
- ✅ **Pass** - Code complies with the rule
- ⚠️ **Warning** - Potential concern worth reviewing
- ❌ **Issue** - Clear violation that needs fixing

### Step 4: Generate Report

Output a structured verification report:

\`\`\`markdown
# Agent Verification Report

**Project:** [project name or path]
**Date:** [current date]
**Files analyzed:** [list of files]

## Summary

✅ X checks passed | ⚠️ Y warnings | ❌ Z issues

## Findings

### ✅ Passing
- [Check name]: [Brief confirmation of compliance]

### ⚠️ Warnings
- [Check name]: [Description of concern]
  - **Location:** [file:line if applicable]
  - **Suggestion:** [How to address]

### ❌ Issues
- [Check name]: [Description of violation]
  - **Location:** [file:line]
  - **Rule:** [Which rule this violates]
  - **Fix:** [Specific remediation steps]

## Recommendations

1. [Priority recommendation based on findings]
2. [Additional improvements]
\`\`\`

### Step 5: Export Report (Optional)

After presenting the report, ask the user:

> Would you like to save this verification report to a file?

If the user confirms, save the report to:

\`\`\`
reports/verification/YYYY-MM-DD_HH-MM-SS.md
\`\`\`

- Use the current date and time for the filename (e.g., \`2026-02-10_15-28-32.md\`)
- Create the \`reports/verification/\` directory if it doesn't exist
- Confirm the save location to the user after writing

## Notes

- **Privacy first:** All code analysis happens locally. Nothing is sent to external services.
- **Rules come from Kahuna:** The knowledge base provides organization-specific rules. Apply them as written.
- **Framework skills define patterns:** Don't duplicate framework best practices here—reference the skill.
- **Be specific:** Include file names and line numbers when reporting issues.
- **Explain the "why":** Help developers understand why each rule matters.
`;

/**
 * Get Claude Code configuration files.
 */
export function getClaudeCodeFiles(): TemplateFile[] {
  return [
    { path: '.claude/CLAUDE.md', content: CLAUDE_CODE_CLAUDE_MD },
    { path: '.claude/settings.json', content: CLAUDE_CODE_SETTINGS },
    { path: '.claude/agents/architect.md', content: CLAUDE_CODE_ARCHITECT },
    { path: '.claude/agents/implementer.md', content: CLAUDE_CODE_IMPLEMENTER },
    { path: '.claude/skills/documentation/SKILL.md', content: CLAUDE_CODE_SKILL_DOCUMENTATION },
    { path: '.claude/skills/verification/SKILL.md', content: CLAUDE_CODE_SKILL_VERIFICATION },
  ];
}

// =============================================================================
// Embedded Templates: Knowledge Base Seeds
// =============================================================================

const LANGGRAPH_BEST_PRACTICES_MDC = `---
type: knowledge
title: LangGraph Best Practices
summary: >
  Comprehensive reference for building LangGraph agent workflows including core
  concepts, graph construction patterns, state management, advanced patterns
  like Send API and Command, and production-ready code examples.
created_at: "2026-02-10T00:00:00Z"
updated_at: "2026-02-10T00:00:00Z"

source:
  file: langgraph-best-practices.mdc
  project: null
  path: null

classification:
  category: reference
  confidence: 1.0
  reasoning: >
    Seed content providing technical reference documentation for the LangGraph
    framework. Covers API patterns, state management, and code examples.
  topics:
    - LangGraph
    - Agent Workflows
    - State Management
    - Python AI Agents
    - Structured Output

status: active
---

# LangGraph Best Practices

## Core Concepts

LangGraph models agent workflows as graphs with three key components:

1. **State**: A shared data structure representing the current snapshot of your application
   - Use TypedDict or Pydantic BaseModel for schema definition
   - Define reducers to specify how updates are applied to each state key
   - Default reducer overwrites values; use Annotated types for custom reducers (e.g., operator.add for lists)
   - For message-based workflows, use MessagesState or the add_messages reducer

2. **Nodes**: Functions that encode logic and perform computation
   - Accept state as input, perform work, return state updates
   - Can be synchronous or asynchronous Python functions
   - Can accept optional config (RunnableConfig) and runtime (Runtime) parameters
   - Nodes do the work - they contain LLM calls or regular code
   - Add nodes with builder.add_node("node_name", node_function)

3. **Edges**: Functions that determine which node executes next
   - Edges tell what to do next based on current state
   - Normal edges: Direct transitions with add_edge("node_a", "node_b")
   - Conditional edges: Dynamic routing with add_conditional_edges("node_a", routing_function)
   - Use START constant for entry points, END for terminal nodes
   - Multiple outgoing edges execute destination nodes in parallel

## Graph Construction Pattern

1. Define State schema (TypedDict or Pydantic model)
2. Create StateGraph: builder = StateGraph(State)
3. Add nodes: builder.add_node("name", function)
4. Add edges: builder.add_edge(START, "first_node") and builder.add_edge("node_a", "node_b")
5. Add conditional edges if needed: builder.add_conditional_edges("node", routing_func)
6. Compile: graph = builder.compile()

## State Management

- **Multiple Schemas**: Use InputState, OutputState, OverallState, and PrivateState for different node communication patterns
- **Reducers**: Annotate state keys with reducer functions to control update behavior
  - Default: Overwrite existing value
  - operator.add: Append to lists
  - add_messages: Smart message list management with ID tracking
- **MessagesState**: Prebuilt state for chat applications with messages key using add_messages reducer

## Advanced Patterns

- **Send API**: For map-reduce patterns, return Send objects from conditional edges to dynamically create parallel branches
- **Command**: Combine state updates and routing in a single node by returning Command(update={...}, goto="next_node")
  - Use Command when you need both state updates AND routing decisions
  - Requires type annotation: Command[Literal["node_name"]]
  - Command adds dynamic edges but doesn't override static edges
- **Subgraphs**: Use Command.PARENT to navigate from subgraph nodes to parent graph nodes

## Execution Model

- Graph uses message passing with discrete "super-steps"
- Nodes in parallel are part of same super-step
- Sequential nodes belong to separate super-steps
- Execution terminates when all nodes are inactive and no messages in transit

## Important Requirements

- **MUST compile graph** before use: graph = builder.compile()
- Use START constant for entry points, END for terminal nodes
- Import required: from langgraph.graph import StateGraph, START, END
- For messages: from langgraph.graph.message import add_messages
- For commands: from langgraph.types import Command, Send

## LLM Usage

When calling llms, such as through ChatAnthropic, always specify structured output and call the models with .with_structured_output. Also specify method="json_schema".

Here is an example code snippet:
\`\`\`
from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field

model = ChatAnthropic(model="claude-sonnet-4-5-20250929")

class Movie(BaseModel):
    """A movie with details."""
    title: str = Field(..., description="The title of the movie")
    year: int = Field(..., description="The year the movie was released")
    director: str = Field(..., description="The director of the movie")
    rating: float = Field(..., description="The movie's rating out of 10")

model_with_structure = model.with_structured_output(Movie, method="json_schema")
response = model_with_structure.invoke("Provide details about the movie Inception")
\`\`\`
In this code snippet, response will contain an object like Movie(title='Inception', year=2010, director='Christopher Nolan', rating=8.8)

Generate production-ready, well-structured LangGraph workflows following these patterns.

Here is an example workflow for reference:

# Step 1: Define tools and model

from langchain.tools import tool
from langchain.chat_models import init_chat_model


model = init_chat_model(
    "claude-sonnet-4-5-20250929",
    temperature=0
)


# Define tools
@tool
def multiply(a: int, b: int) -> int:
    """Multiply a and b.

    Args:
        a: First int
        b: Second int
    """
    return a * b


@tool
def add(a: int, b: int) -> int:
    """Adds a and b.

    Args:
        a: First int
        b: Second int
    """
    return a + b


@tool
def divide(a: int, b: int) -> float:
    """Divide a and b.

    Args:
        a: First int
        b: Second int
    """
    return a / b


# Augment the LLM with tools
tools = [add, multiply, divide]
tools_by_name = {tool.name: tool for tool in tools}
model_with_tools = model.bind_tools(tools)

# Step 2: Define state

from langchain.messages import AnyMessage
from typing_extensions import TypedDict, Annotated
import operator


class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int

# Step 3: Define model node
from langchain.messages import SystemMessage


def llm_call(state: dict):
    """LLM decides whether to call a tool or not"""

    return {
        "messages": [
            model_with_tools.invoke(
                [
                    SystemMessage(
                        content="You are a helpful assistant tasked with performing arithmetic on a set of inputs."
                    )
                ]
                + state["messages"]
            )
        ],
        "llm_calls": state.get('llm_calls', 0) + 1
    }


# Step 4: Define tool node

from langchain.messages import ToolMessage


def tool_node(state: dict):
    """Performs the tool call"""

    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    return {"messages": result}

# Step 5: Define logic to determine whether to end

from typing import Literal
from langgraph.graph import StateGraph, START, END


# Conditional edge function to route to the tool node or end based upon whether the LLM made a tool call
def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    """Decide if we should continue the loop or stop based upon whether the LLM made a tool call"""

    messages = state["messages"]
    last_message = messages[-1]

    # If the LLM makes a tool call, then perform an action
    if last_message.tool_calls:
        return "tool_node"

    # Otherwise, we stop (reply to the user)
    return END

# Step 6: Build agent

# Build workflow
agent_builder = StateGraph(MessagesState)

# Add nodes
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# Add edges to connect nodes
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    ["tool_node", END]
)
agent_builder.add_edge("tool_node", "llm_call")

# Compile the agent
agent = agent_builder.compile()


from IPython.display import Image, display
# Show the agent
display(Image(agent.get_graph(xray=True).draw_mermaid_png()))

# Invoke
from langchain.messages import HumanMessage
messages = [HumanMessage(content="Add 3 and 4.")]
messages = agent.invoke({"messages": messages})
for m in messages["messages"]:
    m.pretty_print()
`;

/**
 * Get knowledge base seed files.
 */
export function getKnowledgeBaseFiles(): TemplateFile[] {
  return [{ path: 'langgraph-best-practices.mdc', content: LANGGRAPH_BEST_PRACTICES_MDC }];
}

// =============================================================================
// Public API: Get Template Files by ID
// =============================================================================

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
