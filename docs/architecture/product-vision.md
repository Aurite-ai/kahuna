# Kahuna Product Vision

## Goal

Release Kahuna 2.0 with the following core capabilities:

- **Business Architect** - Collects business information using manual and automated methods
- **Context Translator** - Transforms business information, user prompts, and intelligence into prompts for vibe code tools
- **Static Verifier** - Reviews vibe code output (agent code, session, traces) and identifies errors and warnings
- **Agent Library** - Collects and registers agents throughout the organization, displays verification status, and provides distribution

![Kahuna2.png](./assets/product-vision-diagram.webp)

## Release Strategy

Implementation occurs in two stages:

1. **Standard Version** - Manual business information collection, basic context translator for popular tools, static verification against business information, and agent library for manual registration with verification results. Designed for individual users.

2. **Professional/Enterprise Version** - Built later based on Standard version feedback.

---

## Stage 1: Kahuna Standard

The Standard version demonstrates how adding business context to vibe code tools produces better agents faster. This release shows value to individual users while demonstrating potential for enterprise leaders to address security, policy, and cost concerns.

### Step 1: Build Context Translator Testing Environment

The feedback loop is Kahuna's core value: capture business information → create vibe code prompts/rules/configs → analyze output → improve the translator. This cycle produces progressively better agents and is the first area of focus.

**Deliverables:**

1. Manual policy/rules input in Business Architect
2. Output generation for vibe code tools (Claude Code, Cursor, Codex):
   - Prompts
   - Rules files
   - Tools files
   - Config information
3. Collection of vibe code output (code and tool information: session messages, traces) before agent execution
4. Scanning capability to identify if vibe code output improved with Kahuna context
   - Requires baseline: vibe code output without Kahuna context
5. Developer report for improving data collection and context translator

**Validation:** Multiple testers create different agents and push them through the system to refine output quality.

### Step 2: Update UX for Standard Version

Retain Kahuna 1.0 look and feel while updating UX for the new workflow.

**Architect Mode:**

- Keep tool and database capture
- Keep workflow creation
- Add policy capture
- Add prompt download
- Replace workflows on main dashboard with user prompt input

**Verifier Mode (formerly Developer Mode):**

- Dashboard for capturing and storing vibe code output per agent
- Button to run verification and generate report
- Clear indication of future Dynamic Verifier capability

### Step 3: Testing, Improvement, Release

Final testing cycle and release preparation.

---

## Feature Requirements Summary

### Business Architect

| Feature               | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| Tool/database capture | Carried over from Kahuna 1.0                                                |
| Workflow creation     | Create and manage workflows                                                 |
| Policy/rules input    | Manual entry of business policies                                           |
| Import/export         | Download and upload business information                                    |
| Connectivity checks   | Authorization and connectivity validation for business information elements |
| User prompt input     | Context parsing from business information                                   |

### Context Translator

| Feature                   | Description                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| Transformation framework  | Convert business information into vibe code tool context              |
| Multi-target output       | Claude Code, Cursor, Codex, Crew, LangChain/LangGraph, Code-first SDK |
| Direct specification path | Input specifications directly to copilot                              |

### Static Verifier

| Feature             | Description                                 |
| ------------------- | ------------------------------------------- |
| Output capture      | Store vibe code tool output                 |
| Verification engine | Check output against business rules         |
| Intelligence layer  | LLM-as-judge approach for rule verification |
| Report generation   | Verification results reporting              |

### Agent Library

| Feature           | Description                                        |
| ----------------- | -------------------------------------------------- |
| Agent display     | Show agents from verifier with verification status |
| Upload capability | Add agents not built/verified in Kahuna            |
| Distribution      | Download agents (potential GitHub integration)     |

### User Experience

| Aspect            | Design                                     |
| ----------------- | ------------------------------------------ |
| User focus        | Individual users (no team/role onboarding) |
| Project structure | Multiple projects per user                 |
| Modes             | Architect and Verifier (streamlined)       |
| Future capability | Clear path to Dynamic Verifier             |
