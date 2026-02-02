# Agent Development Project: TechFlow Customer Support

## ⚠️ MANDATORY WORKFLOW

**YOU CANNOT IMPLEMENT WITHOUT DOCUMENTS.**

This project uses a skills-based workflow. You are the ORCHESTRATOR.

### Your Only Jobs:
1. **Understand** the user's request
2. **Invoke `/architect`** to create design and plan documents
3. **After `/architect` completes:** Guide user through environment setup (see below)
4. **Ask:** "Do you approve this plan?"
5. **On approval, invoke `/code`** to implement
6. **Report** completion

### After `/architect` Returns - Environment Setup

Before asking for plan approval, you MUST:

1. **Tell user to fill in `.env` file:**
   - Check `docs/plan.md` for required environment variables
   - Provide copy-paste examples:
   ```
   Open your .env file and add your API keys:
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```
   - If the plan needs additional env vars beyond standard ones (ANTHROPIC_API_KEY, OPENAI_API_KEY), list those too

2. **Ask about Python environment:**
   - "What Python version are you using? (e.g., 3.11, 3.12)"
   - "What package manager do you prefer? (pip, uv, poetry, etc.)"

3. **Append "User Environment" section to `docs/plan.md`:**
   ```markdown
   ## User Environment
   - Python: [version from user]
   - Package Manager: [manager from user]
   ```

4. **THEN ask:** "Do you approve this plan?"

### HARD RULES:
- **DO NOT** write any code yourself - invoke skills
- **DO NOT** skip the architect phase - documents are REQUIRED
- **DO NOT** start implementation until user says "approved" or similar
- **DO NOT** skip environment setup - user needs API keys configured
- **WAIT** for skill completion before proceeding

### Workflow Commands:
- `/architect` - Start discovery and planning
- `/code` - Start implementation (requires approved plan)

---

## Business Context

**Company:** TechFlow Solutions
**Product:** TechFlow Pro - B2B project management software
**Purpose:** Handle routine customer support inquiries

### Background
TechFlow Solutions receives 200+ support inquiries daily. 70% are about policies, pricing, and product features that are already documented. We want an AI agent to handle these common questions, freeing human agents for complex issues.

## Pain Points

| Pain Point | Business Impact |
|------------|-----------------|
| Support agents spend most of their time answering repetitive questions about pricing, features, and policies | High labor cost for low-complexity work; delays response to complex issues |
| Customers wait in queue even for simple questions that have documented answers | Poor customer experience and unnecessary friction |
| Inconsistent answers from different agents on policy questions | Customer confusion and trust issues |
| No after-hours support for basic inquiries | Lost leads and frustrated international customers |

## Goals

- Customers get instant, accurate answers to common questions
- Human agents focus on complex issues requiring judgment
- Consistent responses that match our documented policies
- 24/7 availability for routine inquiries

## Allowed Services

This agent MAY use:
- **File Reading**: Read files from the `knowledge-base/` directory
  - `faq.md` - Frequently asked questions
  - `pricing.md` - Pricing tiers and billing policies
  - `product-features.md` - Feature descriptions
  - `support-policies.md` - Support hours, SLAs

This agent may NOT:
- Access files outside `knowledge-base/`
- Make HTTP requests to external services
- Access environment variables or config files

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- See `.claude/rules/langgraph.md` for development patterns
