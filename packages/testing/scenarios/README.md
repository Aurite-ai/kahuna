# Test Scenarios for Coding Copilot Evaluation

This directory contains test scenarios at three complexity levels designed to evaluate coding copilot configurations for AI agent development.

## Purpose

These scenarios test a copilot's ability to:
1. **Discover requirements** through natural conversation with non-technical users
2. **Execute technical implementation** based on gathered requirements
3. **Make appropriate design decisions** at varying complexity levels

## Scenario Levels

| Level | Scenario | Key Testing Focus |
|-------|----------|-------------------|
| 1 | [Customer Support Agent](./level-1-customer-support/) | Tool usage, file security, basic agent patterns |
| 2 | [Stock Market Reporter](./level-2-stock-reporter/) | 3rd party API auth, tool selection, output formatting |
| 3 | [SEO Analysis Reporter](./level-3-seo-analyzer/) | Complex integrations, design decisions, LLM-assisted analysis |

## Document Structure

Each scenario level contains:

- **`CLAUDE.md`** - Project context file for the copilot (copied to test instance root)
- **`requirements.md`** - Full internal requirements document (what we evaluate against)
- **`user-prompts.md`** - Natural language prompts a non-technical user would say (what we give the copilot)
- **`evaluation-criteria.md`** - Rubric for judging copilot performance

## Testing Methodology

### The Gap Test

The core evaluation tests the gap between:
- **User prompts**: Vague, natural language requests
- **Requirements**: Detailed technical specifications

A good copilot should:
1. Ask clarifying questions to uncover hidden requirements
2. Guide the user through necessary decisions
3. Implement a solution that satisfies the full requirements

### Evaluation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  User Prompt    │────▶│    Copilot      │────▶│  Implementation │
│  (vague)        │     │  Conversation   │     │  (code)         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                               ┌─────────────────────────────────────┐
                               │  Evaluate Against Requirements.md   │
                               │  Using Evaluation-Criteria.md       │
                               └─────────────────────────────────────┘
```

## Level Progression

### Level 1: Foundation
- Single tool type (file reading)
- Clear security boundary (designated folder)
- Straightforward conversation flow
- Tests: basic agent patterns, security awareness

### Level 2: Integration
- External API integration (Yahoo Finance)
- API key configuration guidance
- Mixed tool/non-tool output (markdown doesn't need tools)
- Tests: auth handling, knowing when NOT to use tools

### Level 3: Architecture
- Multiple complex APIs (Google, DataForSEO, Perplexity)
- Design decisions required (how to structure analysis)
- LLM-in-the-loop for analysis
- Tests: integration complexity, architectural judgment

## Usage

### Creating a Test Instance

Use the script to create an isolated test environment:

```bash
cd agent-dev
./scripts/create-test-instance.sh level-1-customer-support
```

This combines:
- Framework scaffold (from `templates/frameworks/langgraph/`)
- Copilot config (from `templates/copilot-configs/claude-code/.claude/`)
- Scenario context (CLAUDE.md from the scenario folder)

### Manual Testing Flow

1. Create test instance with the script
2. Follow setup instructions printed by script
3. Start copilot session (e.g., `claude`)
4. Give copilot the initial prompt from `user-prompts.md`
5. Respond naturally to copilot questions using guidance notes
6. Evaluate final result against `requirements.md` using `evaluation-criteria.md`

### For Automated Testing (Future)

These documents will feed into:
- **User Agent**: Uses `user-prompts.md` to simulate developer
- **Judge Agent**: Uses `requirements.md` + `evaluation-criteria.md` to evaluate
