# Agent Development Project: SEO Analysis Reporter

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

**Company:** Digital Marketing Agency
**Purpose:** Generate comprehensive SEO analysis reports for client websites

### Background
As an SEO specialist at a digital marketing agency, I spend 4+ hours per client creating weekly reports. I pull data from Google Search Console, check how we're ranking against competitors, and write up analysis and recommendations. I need to do this for multiple clients every week.

## Pain Points

| Pain Point | Business Impact |
|------------|-----------------|
| Manual data gathering from multiple sources takes 2+ hours per report | High labor cost; limits number of clients I can serve |
| Search Console data requires manual export and reformatting | Tedious work that doesn't require expertise |
| Competitor analysis requires checking search results one keyword at a time | Time-consuming process prone to human error |
| Writing the same types of insights repeatedly for similar patterns | Repetitive work when AI could draft initial analysis |
| Clients want weekly reports but current process only allows bi-weekly | Client satisfaction issues; missed optimization opportunities |
| Executive summaries require translating technical data for non-technical clients | Extra time spent on communication, not analysis |

## Goals

- Automate data gathering so I focus on strategy, not data entry
- Get competitor rankings alongside our own performance data
- AI-assisted analysis to draft insights I can review and refine
- Produce client-ready reports with executive summaries
- Handle temporary API issues gracefully (partial data better than no report)

## Allowed Services

This agent MAY use:
- **Google Search Console API**
  - Retrieve search performance data (clicks, impressions, CTR, position)
  - Access top pages and search queries
  - Requires OAuth 2.0 authentication

- **DataForSEO API** (or similar SERP API)
  - Look up search results for keywords
  - See who's ranking above/below us
  - Check for SERP features (snippets, etc.)
  - Requires API credentials

- **Perplexity API** (optional enhancement)
  - Research competitor strategies
  - Generate market context

This agent may NOT:
- Modify website content
- Submit URLs to search engines
- Make changes to Search Console settings

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- See `.claude/rules/langgraph.md` for development patterns

## Notes

This is a more complex project involving multiple APIs with different authentication methods. The business context above should guide your design decisions about how to structure the data gathering and analysis.
