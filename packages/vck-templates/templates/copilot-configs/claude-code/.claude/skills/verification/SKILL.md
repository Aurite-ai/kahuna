---
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

### Step 1: Get Rules from Knowledge Base

Call `kahuna_prepare_context` to retrieve organizational rules:

```
kahuna_prepare_context({
  "task": "Verify agent code against organizational policies, security rules, and framework best practices"
})
```

This returns rules from the knowledge base including:
- **Organizational rules** - Company-specific coding standards and data handling policies
- **IT/Security rules** - Security requirements, compliance standards, secrets management

### Step 2: Load Framework Skill

Check `.claude/skills/` for the relevant framework skill based on what the agent uses:

| Framework | Skill Location |
|-----------|----------------|
| LangGraph | `.claude/skills/langgraph/SKILL.md` |

The framework skill defines best practices, required patterns, and anti-patterns specific to that framework. Load and reference it during verification.

### Step 3: Discover Agent Files

Locate agent implementation files in the project. Check these common locations:

**Directories:**
- `src/agent/`
- `agent/`
- `src/`
- Project root

**Key files to analyze:**
- `graph.py` - Main workflow/graph definition
- `tools.py` - Tool implementations
- `state.py` - State schema definitions
- `prompts.py` - Prompt templates
- `nodes.py` - Node function implementations
- `config.py` - Configuration and settings

Use `list_files` or similar to discover the actual structure, then read relevant files.

### Step 4: Verify Code Against Rules

For each rule from Steps 1 and 2, analyze the agent code:

1. **Organizational rules** - Check code against company policies from knowledge base
2. **IT/Security rules** - Check code against security requirements from knowledge base
3. **Framework best practices** - Check code against patterns from the framework skill

For each rule, determine:
- ✅ **Pass** - Code complies with the rule
- ⚠️ **Warning** - Potential concern worth reviewing
- ❌ **Issue** - Clear violation that needs fixing

### Step 5: Generate Report

Output a structured verification report:

```markdown
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
```

## Notes

- **Privacy first:** All code analysis happens locally. Nothing is sent to external services.
- **Rules come from Kahuna:** The knowledge base provides organization-specific rules. Apply them as written.
- **Framework skills define patterns:** Don't duplicate framework best practices here—reference the skill.
- **Be specific:** Include file names and line numbers when reporting issues.
- **Explain the "why":** Help developers understand why each rule matters.
