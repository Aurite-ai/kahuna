# Kahuna MCP - Tool Specifications

**Status:** Final
**Date:** 2026-02-05
**Parent:** [README.md](./README.md)

---

## Tool Names

| Tool | Purpose |
|------|---------|
| `kahuna_setup` | Initialize new project |
| `kahuna_learn` | Send files for Kahuna to learn from |
| `kahuna_prepare_context` | Prepare context/ for a task |
| `kahuna_ask` | Quick Q&A |
| `kahuna_review` | Check files against patterns/policies |
| `kahuna_sync` | Sync all changes (deferred) |

---

## Design Philosophy

Based on insights from the Sentry MCP team:

1. **Steering context is the value** - Tool descriptions guide the LLM on *when* and *how* to use tools. Invest tokens in guidance.

2. **LLM-catered responses** - Return markdown with actionable hints, not raw data. The response should steer the copilot toward useful next actions.

3. **Minimize parameters** - Fewer params = fewer mistakes. Natural language where possible.

4. **Always-on context** - Don't hide steering behind progressive disclosure. The descriptions are always available to guide the agent.

Each tool spec includes:
- Tool description (the steering context)
- Input schema
- Example response format
- MVP scope vs future enhancements

---

## 1. kahuna_setup

### Tool Description

```
Set up a new LangGraph agent project with Kahuna integration.

USE THIS TOOL WHEN:
- User wants to start a new agent project
- User says "create", "setup", "start", "new project", or similar
- An empty directory needs to be set up for LangGraph development

<examples>
### Basic setup
kahuna_setup(project_name="customer-support-agent")

### With description
kahuna_setup(
  project_name="support-agent",
  description="AI agent that answers customer questions from our docs"
)
</examples>

<hints>
- Just a project name is enough to get started
- Description helps Kahuna provide better initial context
- After setup, read CLAUDE.md for project instructions
</hints>
```

### Input Schema

```typescript
{
  project_name: string,      // Required: Name for the project
  description?: string       // Optional: What the agent will do
}
```

### Response Format

```markdown
# Project Initialized: customer-support-agent

Created LangGraph agent project structure with Kahuna integration.

## What's Ready

### Copilot Configuration
- **CLAUDE.md** - Project instructions (read this first)
- **.mcp.json** - Kahuna MCP server connection
- **.claude/** - Copilot settings, rules, and skills

### Knowledge Base
- **context/** - Knowledge folder (starts with LangGraph patterns)
  - `README.md` - Navigation guide

### Project Structure
- **src/agent/** - LangGraph boilerplate (graph.py, state.py, tools.py)

## Getting Started

1. Read CLAUDE.md for project-specific instructions
2. Describe what you want your agent to do
3. Kahuna will help with patterns and context as you build

<hints>
- Start by describing your agent's purpose
- Use `kahuna_prepare_context` before beginning implementation
- Context folder has LangGraph patterns to follow
</hints>
```

### Output Structure

`kahuna_setup` creates the following project structure:

```
project-name/
├── CLAUDE.md                 # Project instructions for Claude Code
├── .mcp.json                 # MCP server configuration
├── .claude/
│   ├── settings.json         # Claude Code settings
│   ├── settings.local.json   # Local overrides (gitignored)
│   ├── rules/                # Copilot behavior rules
│   └── skills/               # Sub-agent capabilities
├── context/
│   └── README.md             # Knowledge navigation guide
└── src/agent/
    ├── graph.py              # LangGraph graph definition
    ├── state.py              # State schema
    └── tools.py              # Tool definitions
```

**Copilot Configuration Details:** See [copilot-configuration.md](./copilot-configuration.md)

### MVP Scope

**Build first:**
- Create project structure (all folders and files above)
- Write CLAUDE.md with Kahuna tool instructions
- Copy static copilot config files (.mcp.json, .claude/)
- Initialize context/ with README.md

**Future enhancements:**
- Template selection (basic, rag, multi-agent)
- Pre-populated LangGraph patterns in context/
- Detect existing project and offer to add Kahuna
- Project-specific customization of copilot config

---

## 2. kahuna_learn

### Tool Description

```
Send files or folders to Kahuna to learn from and add to the knowledge base.

USE THIS TOOL WHEN:
- User shares files/folders and wants Kahuna to "learn" from them
- User provides policy documents, specs, or reference materials
- User says "here's our...", "learn this", "add this to context"
- After completing work the user wants preserved as knowledge

Kahuna's agents will:
1. Classify what kind of knowledge each file contains
2. Store in ~/.kahuna knowledge base with metadata
3. Files will be available for future context surfacing

<examples>
### Single file
kahuna_learn(
  paths=["docs/api-guidelines.md"],
  description="Our company's API design standards"
)

### Entire folder
kahuna_learn(
  paths=["docs/"],
  description="All our documentation files"
)

### Multiple paths
kahuna_learn(
  paths=["docs/api-guidelines.md", "specs/"],
  description="API guidelines and specification folder"
)
</examples>

<hints>
- Accepts both files AND folders - folders are processed recursively
- Description helps classification but isn't required
- Files go to ~/.kahuna knowledge base, NOT directly to context/
- Use kahuna_prepare_context to surface learned knowledge
</hints>
```

### Input Schema

```typescript
{
  paths: string[],           // Required: File or folder paths to process
  description?: string       // Optional: What these contain / why they matter
}
```

### Response Format

```markdown
# Context Received

Processed **2 files**:

| File | What Kahuna Found |
|------|-------------------|
| `docs/api-guidelines.md` | API design standards - added to context |
| `requirements.txt` | Dependencies only - no knowledge extracted |

## Added to Knowledge Base

**API Design Standards**
- REST naming conventions
- Error response format
- Authentication requirements

*Stored in ~/.kahuna knowledge base*

<hints>
- Review context/ to verify accuracy
- The API standards will be used in future recommendations
- Send more files anytime with this tool
</hints>
```

### MVP Scope

**Build first:**
- Accept files and description
- Basic classification (policy vs code vs config)
- Write raw content to context/ with metadata
- Update context/README.md

**Future enhancements:**
- LLM-powered knowledge extraction
- Duplicate/conflict detection
- Smart merging with existing context
- Pattern extraction from code

---

## 3. kahuna_sync

### Tool Description

```
Sync all changes since last sync to the knowledge base.

USE THIS TOOL WHEN:
- End of a work session
- Before committing or pushing code
- User says "sync", "update context", "save what we learned"
- Periodically to keep knowledge base current

Processes:
- File changes (via git diff)
- Conversation logs from this session

<examples>
### Basic sync
kahuna_sync()

### Sync from specific point
kahuna_sync(since="HEAD~5")
</examples>

<hints>
- Run at end of session to capture learnings
- Conversations are automatically included
- Context folder will be updated with extracted knowledge
</hints>
```

### Input Schema

```typescript
{
  since?: string             // Optional: Git ref to diff from (default: last sync)
}
```

### Response Format

```markdown
# Sync Complete

**Changes since last sync (2 hours ago):**

## Files Changed
- `src/agent/tools.py` - Modified
- `src/agent/prompts.py` - Created

## Conversations Processed
- "Implemented search tool with keyword matching"
- "Added error handling for failed searches"

## Knowledge Base Updates

**New: Search Implementation Decision**
Chose keyword-based search over embeddings because simpler infrastructure, sufficient for corpus size.

*Extracted from conversation + code*

<hints>
- Review context/ for accuracy
- Commit context/ to preserve team knowledge
- Next sync will capture new changes
</hints>
```

### MVP Scope

**Defer this tool** - Build last if time permits.

**Why defer:**
- kahuna_learn covers explicit file sharing
- Conversation processing is complex
- Git diff processing adds infrastructure

**When we build it:**
- Start with conversation log processing only
- Add git diff later
- Focus on extracting decisions and rationale

---

## 4. kahuna_prepare_context

### Tool Description

```
Prepare the context/ folder with relevant knowledge for a task.

USE THIS TOOL WHEN:
- Starting any new task or feature
- User describes what they want to build
- Before beginning implementation work
- User asks "what do we know about X"

This is the PRIMARY context retrieval tool. Call it ONCE at task start, then work from context/ files.

<examples>
### Starting a task
kahuna_prepare_context(
  task="Add rate limiting to the search tool"
)

### With files you'll touch
kahuna_prepare_context(
  task="Refactor error handling in tools",
  files=["src/agent/tools.py"]
)

### Exploring a topic
kahuna_prepare_context(
  task="Understand our API design patterns"
)
</examples>

<hints>
- Call ONCE at task start, then work from context/ files
- Natural language task description works best
- After calling, read context/README.md for navigation
- If you need more context mid-task, use kahuna_ask instead
</hints>
```

### Input Schema

```typescript
{
  task: string,              // Required: What you're trying to do
  files?: string[]           // Optional: Files you'll be working with
}
```

### Response Format

```markdown
# Context Ready

**Task:** Add rate limiting to the search tool

## Relevant Context Surfaced

| Topic | File | Why Relevant |
|-------|------|--------------|
| API Guidelines | context/api-standards.md | Rate limiting requirements |
| Error Handling | context/error-patterns.md | How to handle rate limit errors |
| Search Tool | context/search-decision.md | Current implementation context |

## Start Here

1. **Read context/README.md** - Full navigation
2. **Check api-standards.md** - Has rate limiting requirements
3. **Review error-patterns.md** - Follow existing patterns

<hints>
- Context folder is ready - read files directly
- If you need more context mid-task, use kahuna_ask
- After completing work, use kahuna_learn to capture learnings
</hints>
```

### MVP Scope

**Build first:**
- Accept task description
- Search existing context/ files for relevant content
- Return list of relevant files with summaries
- Update context/README.md with task-specific navigation

**Future enhancements:**
- LLM-powered relevance scoring
- Search processed conversations
- Synthesize new context documents for task
- Smart file selection based on files parameter

---

## 5. kahuna_ask

### Tool Description

```
Quick Q&A using both project context and knowledge base.

USE THIS TOOL WHEN:
- Mid-task and need specific information
- User asks a direct question about the project
- Need clarification on a decision or pattern
- Context folder doesn't have what you need

Searches context/ first (if exists), then falls back to ~/.kahuna knowledge base.

<examples>
### Direct question
kahuna_ask(question="Why did we choose keyword search over embeddings?")

### Clarification
kahuna_ask(question="What's our error handling pattern for API calls?")

### Check if something exists
kahuna_ask(question="Do we have rate limiting requirements documented?")
</examples>

<hints>
- Searches project context/ first, then knowledge base
- Use for quick questions mid-task
- For comprehensive context setup, use kahuna_prepare_context instead
- Returns text directly, doesn't modify context/
</hints>
```

### Input Schema

```typescript
{
  question: string           // Required: What you want to know
}
```

### Response Format

```markdown
# Answer

**Question:** Why did we choose keyword search over embeddings?

The project uses keyword-based search for these reasons:

1. **Simplicity** - No embedding infrastructure needed
2. **Transparency** - Easier to debug search results
3. **Cost** - No embedding API costs
4. **Sufficient** - Corpus is small enough for keyword matching

**Source:** context/search-decision.md

<hints>
- Full details in context/search-decision.md
- Related: "What would trigger switching to embeddings?"
- If you need broader context, use kahuna_prepare
</hints>
```

### MVP Scope

**Build first:**
- Accept question
- Search context/ files for relevant content
- Return synthesized answer with source citations

**Future enhancements:**
- LLM-powered answer synthesis
- Search conversation history
- Suggest related questions
- Remember questions for knowledge gaps

---

## 6. kahuna_review

### Tool Description

```
Review files against patterns and policies from context and knowledge base.

USE THIS TOOL WHEN:
- Before committing code
- After completing implementation
- User asks to "review", "check", or "validate" their work
- Want to verify alignment with project standards

Checks against context/ first (if exists), then ~/.kahuna knowledge base for additional patterns/policies.

<examples>
### Review implementation
kahuna_review(files=["src/agent/tools.py"])

### Review multiple files
kahuna_review(files=["src/agent/tools.py", "src/agent/graph.py"])

### Focus on specific aspects
kahuna_review(
  files=["src/agent/tools.py"],
  focus=["error-handling", "api-standards"]
)
</examples>

<hints>
- Uses both project context/ AND knowledge base
- Run before committing to catch issues early
- Provides specific suggestions for any deviations
</hints>
```

### Input Schema

```typescript
{
  files: string[],           // Required: Files to analyze
  focus?: string[]           // Optional: Specific patterns/policies to check
}
```

### Response Format

```markdown
# Analysis Results

Analyzed **2 files** against project standards.

## Summary

| Status | Count |
|--------|-------|
| ✅ Aligned | 3 |
| ⚠️ Minor issue | 1 |

---

## src/agent/tools.py

### ✅ Aligned: Search Approach
Uses keyword search as documented in context/search-decision.md.

### ⚠️ Minor: Error Handling
Missing try/except pattern from context/error-patterns.md.

**Suggestion:**
```python
try:
    results = search(query)
except SearchError as e:
    return f"Search failed: {e}"
```

---

<hints>
- One minor issue to fix in tools.py
- After fixing, ready to commit
- If the deviation is intentional, update the pattern in context/
</hints>
```

### MVP Scope

**Build first:**
- Accept files to analyze
- Compare against patterns/policies in context/
- Return basic compliance report

**Future enhancements:**
- LLM-powered code analysis
- Specific fix suggestions with code
- Auto-fix option for simple issues
- Learn from accepted deviations

---

## Tool Categories

| Category | Tools | Purpose |
|----------|-------|---------|
| **Building Knowledge Base** | `kahuna_learn`, `kahuna_sync` | Populate ~/.kahuna |
| **Environment Setup** | `kahuna_setup`, `kahuna_prepare_context` | Prepare project |
| **Assistance** | `kahuna_ask`, `kahuna_review` | Help copilot (uses context + KB) |

## Implementation Priority

Based on vibe coder workflow and MVP constraints:

| Priority | Tool | Why |
|----------|------|-----|
| 1 | **kahuna_setup** | Required to start any project |
| 2 | **kahuna_learn** | Builds knowledge base (already in progress) |
| 3 | **kahuna_prepare_context** | Core value prop - surfacing context |
| 4 | **kahuna_ask** | Assistance using context + KB |
| 5 | **kahuna_review** | Quality check using context + KB |
| 6 | **kahuna_sync** | Nice-to-have automation (deferred) |

**MVP Target:** Tools 1-5 working, tool 6 deferred.

---

## Response Format Standards

All tools follow Sentry's approach:

### 1. Markdown Format
```markdown
# Clear Title

[Brief summary of what happened]

## Structured Content
[Tables, lists, details]

<hints>
## What You Can Do Next
- [Specific actionable suggestion]
- [Another suggestion]
</hints>
```

### 2. Steering Hints
Every response ends with `<hints>` guiding next actions. This is the key value - steering the agent toward productive work.

### 3. Minimal Friction
- Single required parameter where possible
- Natural language inputs
- No complex nested objects

### 4. Always-On Descriptions
Tool descriptions contain full steering context. The agent always knows when to use each tool without discovery.

---

## Changelog

- v1.0 (2026-02-05): Initial tool specifications
- v2.0 (2026-02-05): Rewrote with Sentry MCP steering approach; added MVP scope vs future enhancements
- v3.0 (2026-02-05): Finalized tool names: setup, learn, prepare_context, ask, review, sync
- v4.0 (2026-02-05): kahuna_learn accepts folders; assistance tools use context + KB; tool categories
- v4.1 (2026-02-05): Expanded kahuna_setup to show full output structure including copilot configuration
- v4.2 (2026-02-05): Fixed kahuna_learn response to correctly show storage location (~/.kahuna)
- v5.0 (2026-02-05): Promoted to docs/design/; updated links and status to Final
