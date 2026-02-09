# Business Context

**Company:** Digital Marketing Agency
**Purpose:** Generate comprehensive SEO analysis reports for client websites

## Background
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
