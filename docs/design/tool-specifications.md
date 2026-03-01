# Kahuna MCP - Tool Specifications

**Status:** Final
**Date:** 2026-02-05
**Parent:** [README.md](./README.md)

---

## Tool Names

| Tool | Purpose |
|------|---------|
| `kahuna_initialize` | Deploy agent-dev rules and run onboarding |
| `kahuna_provide_context` | Store org/user context from onboarding or conversation |
| `kahuna_learn` | Send files for Kahuna to learn from (detects contradictions) |
| `kahuna_prepare_context` | Prepare .kahuna/context-guide.md for a task |
| `kahuna_ask` | Quick Q&A |
| `kahuna_delete` | Remove outdated files from knowledge base |
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

## 1. kahuna_initialize

### Tool Description

```
Deploy agent-dev rules and optionally run onboarding to collect org/user context.

USE THIS TOOL WHEN:
- User says "set up Kahuna", "initialize", "get started with Kahuna"
- Starting to use Kahuna in a new project
- User wants to configure their copilot with Kahuna integration

This tool does TWO things:
1. Deploys agent-dev rules to .claude/ in the project directory
2. Returns onboarding instructions if org/user context doesn't exist yet

<examples>
### Basic initialization
kahuna_initialize()

### With explicit project path
kahuna_initialize(project_path="/home/user/my-project")
</examples>

<hints>
- No parameters required - defaults to current working directory
- After initialization, follow the onboarding instructions in the response
- Restart Claude Code after onboarding to apply the deployed rules
</hints>
```

### Input Schema

```typescript
{
  project_path?: string       // Optional: Path to project (defaults to cwd)
}
```

### State Detection

Before returning, the tool checks for existing context files:

| File | Purpose |
|------|---------|
| `~/.kahuna/knowledge/org-context.mdc` | Organization context |
| `~/.kahuna/knowledge/user-context.mdc` | User context |

**Validation:** File must exist AND be > 50 bytes (catches empty/corrupted files).

### Response Format

**When onboarding is needed** (context files don't exist):

```markdown
# Kahuna Configured

Rules deployed to `.claude/`. **Complete onboarding before restarting.**

---

## Onboarding Instructions

[Full onboarding guidance with phases for situational assessment,
document discovery, targeted follow-ups, and storing context via
kahuna_provide_context. See user-interaction-model.md for full format.]

<hints>
- Be conversational, not interrogative
- Read files before learning to understand what's in them
- Only ask questions that would change recommendations
- Don't need to collect everything - context grows over time
</hints>
```

**When onboarding is already complete** (context files exist):

```markdown
# Kahuna Configured

Rules deployed to `.claude/`.

Your organization and user context are already set up.

**Next step:** Restart Claude Code (Ctrl+C and run `claude` again) to apply the rules.

<hints>
- After restart, rules will be loaded automatically
- Use `kahuna_prepare_context` to get relevant knowledge for tasks
- Use `kahuna_learn` to add new documents to the knowledge base
</hints>
```

### Output Structure

`kahuna_initialize` deploys the following to the project directory:

```
project-path/
├── CLAUDE.md                 # System prompt for agent development
└── .claude/
    ├── rules/                # Behavioral rules
    ├── skills/               # Reusable sub-agent capabilities
    └── agents/               # Specialized subagent definitions
```

These are collectively called "agent-dev rules" - text that structures the agent development process. They do NOT contain onboarding logic (onboarding is transient, rules are permanent).

### MVP Scope

**Build first:**
- Deploy agent-dev rules to project directory
- Check for existing context files (org-context.mdc, user-context.mdc)
- Return appropriate response (with or without onboarding instructions)

**Future enhancements:**
- Health check integration (report onboarding status)
- Partial context handling (only org or only user missing)
- Update detection (newer rules available than deployed)

---

## 2. kahuna_provide_context

### Tool Description

```
Store org or user context in the knowledge base.

USE THIS TOOL WHEN:
- Completing onboarding (storing synthesized org or user context)
- User describes their organization, preferences, or constraints
- Synthesizing context from a conversation (without creating temp files)

This tool stores free-form markdown content as context files. Use it to capture
synthesized understanding, not raw file content (use kahuna_learn for files).

<examples>
### Organization context
kahuna_provide_context(
  type="org",
  content="# Organization Context\n\nHealthcare startup building patient portals.\n\n## Constraints\n- HIPAA compliance required\n- Must integrate with Epic EHR"
)

### User context
kahuna_provide_context(
  type="user",
  content="# User Context\n\nSenior developer, 10 years experience.\n\n## Preferences\n- Detailed explanations over brief answers\n- Prefers TDD approach"
)
</examples>

<hints>
- Content should be markdown format
- Org context = domain, constraints, patterns (spans projects)
- User context = preferences, working style (personal)
- Use kahuna_learn for file-based knowledge; this tool is for synthesized context
- Calling again with same type replaces previous content
</hints>
```

### Input Schema

```typescript
{
  type: 'org' | 'user',       // Required: Type of context
  content: string             // Required: Markdown content
}
```

### Context Types

| Type | File | Contents |
|------|------|----------|
| `org` | `~/.kahuna/knowledge/org-context.mdc` | Domain, industry, technical constraints, patterns that apply across projects |
| `user` | `~/.kahuna/knowledge/user-context.mdc` | Personal preferences, experience level, working style |

**Org context** is organizational knowledge that doesn't require knowing about the specific user. It's stable and rarely changes.

**User context** is personal and may change more frequently. The distinction enables future features like team context sharing.

### Response Format

```markdown
# Context Stored

Saved **organization context** to knowledge base.

<hints>
- Context will be included in future `kahuna_prepare_context` results
- You can update context by calling this tool again (replaces previous)
- Continue onboarding or tell user to restart Claude Code
</hints>
```

### MVP Scope

**Build first:**
- Validate input (type must be 'org' or 'user', content must be non-empty)
- Generate filename: `org-context.mdc` or `user-context.mdc`
- Write to `~/.kahuna/knowledge/` with standard .mdc frontmatter
- Return confirmation

**Future enhancements:**
- Partial updates (merge with existing content)
- Validation of content structure
- Version history for context changes

---

## 3. kahuna_learn

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
2. Detect contradictions with existing knowledge base files
3. Store in ~/.kahuna knowledge base with metadata
4. Files will be available for future context surfacing

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
- Files go to ~/.kahuna knowledge base, NOT directly to .kahuna/context-guide.md
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

**Without contradictions:**

```markdown
# Context Received

Processed **2 files** — 2 added:

| File | Category | What Kahuna Found |
|------|----------|-------------------|
| `api-guidelines.md` | policy | REST API design standards covering naming conventions and auth |
| `security-policy.md` | policy | Security requirements for API authentication |

## Key Topics Learned

- **API Design Guidelines** — REST API design standards covering naming conventions and auth
- **Security Policy** — Security requirements for API authentication

<hints>
- Use `kahuna_prepare_context` to surface this knowledge for a specific task
- Send more files anytime — Kahuna handles classification automatically
</hints>
```

**With contradictions detected:**

```markdown
# Context Received

Processed **1 files** — 1 added:

| File | Category | What Kahuna Found |
|------|----------|-------------------|
| `new-api-guidelines.md` | policy | Updated REST API design standards with JWT authentication |

## Key Topics Learned

- **New API Guidelines** — Updated REST API design standards with JWT authentication

## ⚠️ Contradictions Detected

The following existing files contradict the new file(s). Consider removing outdated information:

- **old-api-guidelines** (from `old-api-guidelines.md`)
  The new file specifies JWT authentication while the old file requires OAuth2

<hints>
- Review .kahuna/context-guide.md to verify accuracy
- The API standards will be used in future recommendations
- Send more files anytime with this tool
- Use `kahuna_prepare_context` to surface this knowledge for a specific task
- Send more files anytime — Kahuna handles classification automatically
- Review contradicting files and use `kahuna_delete` to remove outdated information after user approval
</hints>
```

### MVP Scope

**Build first:**
- Accept files and description
- Basic classification (policy vs code vs config)
- Write raw content to .kahuna/context-guide.md with metadata
- Update .kahuna/context-guide.md

**Implemented:**
- LLM-powered categorization (Haiku)
- Contradiction detection with existing KB files
- Metadata extraction (title, summary, topics)

**Future enhancements:**
- Smart merging with existing context
- Pattern extraction from code
- Semantic similarity detection

---

## 4. kahuna_sync

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
- Context guide will be updated with extracted knowledge
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
- Review .kahuna/context-guide.md for accuracy
- Commit .kahuna/context-guide.md to preserve team knowledge
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

## 5. kahuna_prepare_context

### Tool Description

```
Prepare the .kahuna/context-guide.md file with relevant knowledge for a task.

USE THIS TOOL WHEN:
- Starting any new task or feature
- User describes what they want to build
- Before beginning implementation work
- User asks "what do we know about X"

This is the PRIMARY context retrieval tool. Call it ONCE at task start, then work from .kahuna/context-guide.md.

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
- Call ONCE at task start, then work from .kahuna/context-guide.md
- Natural language task description works best
- After calling, read .kahuna/context-guide.md for navigation
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

| Topic | Section | Why Relevant |
|-------|---------|--------------|
| API Guidelines | API Standards | Rate limiting requirements |
| Error Handling | Error Patterns | How to handle rate limit errors |
| Search Tool | Search Decision | Current implementation context |

## Start Here

1. **Read .kahuna/context-guide.md** - Full navigation and content
2. **Check API Standards section** - Has rate limiting requirements
3. **Review Error Patterns section** - Follow existing patterns

<hints>
- Context guide is ready - read it directly
- If you need more context mid-task, use kahuna_ask
- After completing work, use kahuna_learn to capture learnings
</hints>
```

### MVP Scope

**Build first:**
- Accept task description
- Search existing knowledge base for relevant content
- Return list of relevant sections with summaries
- Generate .kahuna/context-guide.md with task-specific content

**Future enhancements:**
- LLM-powered relevance scoring
- Search processed conversations
- Synthesize new context documents for task
- Smart file selection based on files parameter

---

## 6. kahuna_delete

### Tool Description

```
Delete files from the Kahuna knowledge base.

⚠️ IMPORTANT: This tool should ONLY be called after:
1. kahuna_learn reports contradictions with existing files
2. You ask the user for permission to delete the outdated files
3. The user explicitly approves the deletion

USE THIS TOOL WHEN:
- kahuna_learn output indicates contradictions with existing KB files
- User confirms they want to remove the outdated/contradicting files
- You need to clean up superseded policies, outdated decisions, or conflicting information

DO NOT USE THIS TOOL:
- Without explicit user permission
- Based solely on your own judgment
- For files that are complementary rather than contradictory

<examples>
### After user approves deletion
kahuna_delete(slugs=["old-api-guidelines", "deprecated-security-policy"])
</examples>

<hints>
- Always confirm with the user before calling this tool
- Provide context about why files should be deleted
- Deletion is permanent - files cannot be recovered
- Use kahuna_learn to add updated versions after deletion
</hints>
```

### Input Schema

```typescript
{
  slugs: string[]            // Required: Slugs of KB files to delete
}
```

### Response Format

```markdown
# Files Deleted from Knowledge Base

Processed **2 files** — 2 deleted, 0 failed:

| Slug | Title |
|------|-------|
| `old-api-guidelines` | Old API Guidelines |
| `deprecated-security-policy` | Deprecated Security Policy |

<hints>
- Files have been permanently removed from the knowledge base
- Use `kahuna_learn` to add updated versions if needed
- Use `kahuna_prepare_context` to refresh context for your current task
</hints>
```

### MVP Scope

**Implemented:**
- Delete files by slug from knowledge base
- Retrieve file title before deletion for confirmation
- Handle partial failures gracefully
- Permanent deletion (no soft delete/archive)

**Future enhancements:**
- Soft delete with archive status
- Batch operations with rollback
- Deletion history/audit log

---

## 7. kahuna_ask

### Tool Description

```
Quick Q&A using both project context and knowledge base.

USE THIS TOOL WHEN:
- Mid-task and need specific information
- User asks a direct question about the project
- Need clarification on a decision or pattern
- Context guide doesn't have what you need

Searches .kahuna/context-guide.md first (if exists), then falls back to ~/.kahuna knowledge base.

<examples>
### Direct question
kahuna_ask(question="Why did we choose keyword search over embeddings?")

### Clarification
kahuna_ask(question="What's our error handling pattern for API calls?")

### Check if something exists
kahuna_ask(question="Do we have rate limiting requirements documented?")
</examples>

<hints>
- Searches project .kahuna/context-guide.md first, then knowledge base
- Use for quick questions mid-task
- For comprehensive context setup, use kahuna_prepare_context instead
- Returns text directly, doesn't modify .kahuna/context-guide.md
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

**Source:** .kahuna/context-guide.md (Search Decision section)

<hints>
- Full details in .kahuna/context-guide.md
- Related: "What would trigger switching to embeddings?"
- If you need broader context, use kahuna_prepare
</hints>
```

### MVP Scope

**Build first:**
- Accept question
- Search .kahuna/context-guide.md for relevant content
- Return synthesized answer with source citations

**Future enhancements:**
- LLM-powered answer synthesis
- Search conversation history
- Suggest related questions
- Remember questions for knowledge gaps

---

## Tool Categories

| Category | Tools | Purpose |
|----------|-------|---------|
| **Building Knowledge Base** | `kahuna_learn`, `kahuna_sync` | Populate ~/.kahuna |
| **Environment Setup** | `kahuna_initialize`, `kahuna_prepare_context` | Prepare project |
| **Assistance** | `kahuna_ask` | Help copilot (uses context + KB) |

## Implementation Priority

Based on vibe coder workflow and MVP constraints:

| Priority | Tool | Why |
|----------|------|-----|
| 1 | **kahuna_initialize** | Required to start any project |
| 2 | **kahuna_learn** | Builds knowledge base (already in progress) |
| 3 | **kahuna_prepare_context** | Core value prop - surfacing context |
| 4 | **kahuna_ask** | Assistance using context + KB |
| 5 | **kahuna_sync** | Nice-to-have automation (deferred) |

**MVP Target:** Tools 1-4 working, tool 5 deferred.

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
- v6.0 (2026-02-09): Renamed kahuna_setup → kahuna_initialize; removed kahuna_review (now skill-based verification); 4 active tools + 1 deferred
- v7.0 (2026-02-24): Onboarding design updates:
  - Rewrote kahuna_initialize: now deploys agent-dev rules + returns onboarding instructions (no longer scaffolds projects)
  - Added kahuna_provide_context: stores org/user context from onboarding or conversation
  - Updated tool count: 5 active tools + 1 deferred
