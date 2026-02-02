# Agent Development Project: Stock Market Reporter

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

**Company:** Personal Use / Small Business
**Purpose:** Generate daily stock market reports

### Background
I track a small portfolio of stocks and want daily summaries without manually checking multiple sources. I check the same 5-10 stocks every morning and it's tedious to look them all up individually.

## Pain Points

| Pain Point | Business Impact |
|------------|-----------------|
| Manually checking each stock takes 15-20 minutes every morning | Lost productivity; tedious daily routine |
| Have to visit multiple sites or apps to get complete picture | Fragmented information makes comparison difficult |
| Easy to miss important changes when checking manually | Missed opportunities or late reactions to market moves |
| No easy way to share portfolio summary with investment club | Manual copy-paste to create shareable reports |

## Goals

- Get a complete portfolio summary in one place
- See at-a-glance which stocks moved significantly
- Readable format I can quickly scan or share
- Handle my watchlist without me typing each ticker

## Allowed Services

This agent MAY use:
- **Yahoo Finance** (via `yfinance` library)
  - Get current stock prices
  - Get daily price changes
  - Access volume and other metrics
  - No API key required

This agent may NOT:
- Execute trades or financial transactions
- Store financial data long-term
- Provide investment advice

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- **External Library:** `yfinance` (add to dependencies)
- See `.claude/rules/langgraph.md` for development patterns
