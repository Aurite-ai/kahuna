# Level 3: SEO Analysis Reporter - Requirements

**Scenario:** Comprehensive SEO Analysis Agent
**Complexity:** Advanced
**Primary Focus:** Complex integrations, design decisions, LLM-assisted analysis

---

## Business Context

### Use Case: SEO Agency Reporting

**User:** SEO specialist at a digital marketing agency
**Need:** Automated weekly SEO reports for client websites combining data from multiple sources

**Why This Agent:**
The user currently spends 4+ hours per client creating weekly SEO reports. They pull data from Google Search Console, run competitor analysis, check keyword rankings, and write analysis summaries. They want an agent that can automate data gathering and provide AI-assisted analysis.

**Key Insight:** This level requires the copilot to make design decisions about:
1. How to structure the multi-API integration
2. How to use LLM analysis within the agent workflow
3. Trade-offs between completeness and complexity

---

## Functional Requirements

### FR-1: Google Search Console Data

The agent MUST retrieve from Google Search Console:
- Top performing pages (by clicks and impressions)
- Top search queries
- Click-through rate (CTR) trends
- Average position trends
- Mobile vs desktop performance

**Time Range:** Last 28 days by default, configurable

### FR-2: Competitor/SERP Analysis

The agent MUST analyze search results for target keywords:
- Current ranking position for target URL
- Top 10 competitors for each keyword
- SERP feature presence (featured snippets, PAA, local pack)
- Domain authority comparisons (if available)

**Data Source:** DataForSEO SERP API or similar

### FR-3: AI-Powered Insights

The agent MUST use LLM analysis to:
- Identify trends and anomalies in the data
- Generate actionable recommendations
- Write executive summary for non-technical stakeholders
- Highlight opportunities and risks

### FR-4: Comprehensive Report Generation

The agent MUST produce a markdown report including:
1. Executive Summary (AI-generated)
2. Traffic Overview (GSC data)
3. Top Performing Content
4. Keyword Rankings
5. Competitor Analysis
6. Recommendations (AI-generated)
7. Technical Appendix (raw data)

### FR-5: Multi-Site Support

The agent SHOULD support:
- Analyzing multiple URLs in one run
- Comparative analysis between sites
- Stored configuration per client/site

---

## Technical Requirements

### TR-1: Google Search Console API

**Authentication:** OAuth 2.0 with service account or user credentials

**Required Scopes:**
- `https://www.googleapis.com/auth/webmasters.readonly`

**Key Endpoints:**
```
POST https://www.googleapis.com/webmasters/v3/sites/{siteUrl}/searchAnalytics/query
```

**Sample Query:**
```json
{
  "startDate": "2026-01-01",
  "endDate": "2026-01-28",
  "dimensions": ["query", "page", "device"],
  "rowLimit": 100
}
```

**Setup Requirements:**
1. Google Cloud Project
2. Search Console API enabled
3. Service account with Search Console access
4. JSON key file for authentication

### TR-2: DataForSEO API

**Authentication:** Basic Auth (login:password)

**Key Endpoints:**
- SERP API: `POST /v3/serp/google/organic/live/advanced`
- Keyword Data: `POST /v3/keywords_data/google/search_volume/live`

**Sample SERP Request:**
```json
{
  "keyword": "best project management software",
  "location_code": 2840,  // USA
  "language_code": "en",
  "device": "desktop"
}
```

**Pricing Note:** DataForSEO is a paid API. For testing:
- Use their sandbox/test mode if available
- Limit requests to essential data
- Consider mock data for development

### TR-3: Perplexity API (Optional - for enhanced analysis)

**Authentication:** API Key (Bearer token)

**Use Case:**
- Research competitor content strategies
- Generate market context for recommendations
- Answer specific SEO questions during analysis

**Note:** This is optional but demonstrates advanced LLM integration within agent workflows.

### TR-4: Multi-Tool Agent Architecture

**Design Decision Required:** The copilot must decide how to structure this:

**Option A: Sequential Pipeline**
```
GSC Data → SERP Data → LLM Analysis → Report
```
- Simpler to implement
- Each stage completes before next begins
- Easier debugging

**Option B: Parallel Data Gathering**
```
┌─ GSC Data ─────┐
│                │──▶ LLM Analysis ──▶ Report
└─ SERP Data ────┘
```
- Faster execution
- More complex error handling
- Better for large datasets

**Option C: Iterative Analysis**
```
GSC Data → Initial Analysis → Follow-up Queries → SERP Data → Final Analysis
```
- Most intelligent
- LLM decides what additional data to fetch
- Most complex to implement

**The copilot should explain their choice and rationale.**

### TR-5: LLM-in-the-Loop Design

**Design Decision Required:** How should the LLM participate?

**Pattern 1: Analysis Tool**
```python
@tool
def analyze_seo_data(data: dict, analysis_type: str) -> str:
    """Have LLM analyze the SEO data and return insights."""
    # Calls LLM with structured prompt
```

**Pattern 2: Agent Self-Analysis**
- Agent receives data and analyzes directly
- No separate analysis tool
- More conversational

**Pattern 3: Hybrid**
- Structured analysis via tool
- Free-form insights via agent reasoning

### TR-6: Credential Management

Multiple credentials must be managed:
- Google OAuth tokens (complex refresh flow)
- DataForSEO username/password
- Perplexity API key (if used)

**Recommendation:** Environment variables + secure credential store

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
PERPLEXITY_API_KEY=pplx-xxxxx  # optional
```

### TR-7: Error Handling and Resilience

Given multiple external APIs:
- Handle partial failures (one API down, continue with others)
- Implement retry logic with exponential backoff
- Provide meaningful error messages in report
- Consider circuit breaker pattern for unreliable APIs

---

## Report Structure

### Example Report Outline

```markdown
# SEO Analysis Report: example.com
*Report Period: January 1-28, 2026*
*Generated: January 28, 2026*

## Executive Summary

[AI-generated 3-4 paragraph summary highlighting key findings,
opportunities, and recommended actions. Written for non-technical
stakeholders.]

## Traffic Overview

### Key Metrics
| Metric | This Period | Previous | Change |
|--------|-------------|----------|--------|
| Clicks | 15,234 | 14,102 | +8.0% |
| Impressions | 892,451 | 845,221 | +5.6% |
| CTR | 1.71% | 1.67% | +0.04% |
| Avg Position | 18.4 | 19.2 | +0.8 |

### Device Breakdown
[Desktop vs Mobile performance comparison]

## Top Performing Content

### By Clicks
| Page | Clicks | Impressions | CTR | Position |
|------|--------|-------------|-----|----------|
| /blog/best-tools | 2,341 | 45,231 | 5.2% | 4.2 |
| ... | ... | ... | ... | ... |

### By Impressions
[Similar table]

## Keyword Rankings

### Target Keywords Performance
| Keyword | Current Rank | Previous | Change | Search Vol |
|---------|--------------|----------|--------|------------|
| project management | 8 | 12 | +4 | 12,100 |
| ... | ... | ... | ... | ... |

### Ranking Distribution
[Breakdown: #1-3, #4-10, #11-20, #21-50, 50+]

## Competitor Analysis

### SERP Landscape for "project management software"
| Position | Domain | Title | Features |
|----------|--------|-------|----------|
| 1 | monday.com | ... | Featured Snippet |
| 2 | asana.com | ... | Sitelinks |
| ... | ... | ... | ... |

### Domain Comparison
[Authority metrics if available]

## AI-Powered Recommendations

### High Priority
1. **[Recommendation Title]**
   - Finding: [What the data shows]
   - Recommendation: [What to do]
   - Expected Impact: [Potential results]

### Medium Priority
[Similar format]

### Opportunities Identified
[AI-identified opportunities from the data]

## Technical Appendix

### Data Sources
- Google Search Console (verified property)
- DataForSEO SERP API
- Analysis by Claude (Anthropic)

### Methodology Notes
[Any caveats or limitations]

### Raw Data
[Optional: JSON/CSV export links]
```

---

## Success Criteria

### SC-1: Multi-API Integration
Successfully retrieves and combines data from GSC and SERP API

### SC-2: LLM Analysis Quality
AI-generated insights are relevant, actionable, and data-driven

### SC-3: Report Completeness
All required sections present with appropriate data

### SC-4: Design Decisions
Copilot explains architectural choices with clear rationale

### SC-5: Error Resilience
System handles API failures gracefully

### SC-6: Code Quality
Clean, maintainable code with good separation of concerns

---

## Common Pitfalls to Catch

### Integration Pitfalls
1. **Auth complexity** - OAuth refresh tokens for GSC are tricky
2. **Rate limiting** - Multiple APIs = multiple rate limits to manage
3. **Data format mismatch** - Different APIs return different structures
4. **Partial failures** - Not handling when one API fails

### Design Pitfalls
1. **Over-engineering** - Building unnecessary abstraction layers
2. **Under-engineering** - Not separating concerns adequately
3. **Ignoring trade-offs** - Not discussing pros/cons of chosen approach
4. **Analysis paralysis** - Spending too long on architecture vs. implementation

### LLM Integration Pitfalls
1. **Prompt leakage** - Not properly structuring analysis prompts
2. **Hallucination** - LLM making up data not in the input
3. **Over-reliance** - Using LLM when simple code would suffice
4. **Under-utilization** - Not leveraging LLM for valuable analysis

### Report Pitfalls
1. **Data dump** - Raw data without analysis
2. **Analysis without data** - Claims not supported by evidence
3. **Missing context** - Not explaining what metrics mean
4. **Inconsistent formatting** - Poor visual hierarchy

---

## Research Notes

### Items Requiring Research

The following may need investigation during implementation:

1. **Google Search Console API Setup**
   - Exact OAuth flow for service accounts
   - Property verification requirements
   - Available dimensions and metrics

2. **DataForSEO Specifics**
   - Exact endpoint formats
   - Available data in responses
   - Rate limits and pricing tiers

3. **Best Practices**
   - How to structure LLM prompts for SEO analysis
   - What SEO metrics are most actionable
   - Industry-standard report formats

### Mock Data Option

For development and testing without API access:
- Create realistic mock data fixtures
- Document expected API response formats
- Allow switching between mock and live data

---

## Complexity Justification

This scenario is Level 3 because it requires:

| Aspect | Complexity |
|--------|------------|
| APIs | 2-3 external APIs with different auth methods |
| Design | Architectural decisions with trade-offs |
| LLM | LLM-in-the-loop for analysis, not just formatting |
| Output | Complex structured report with multiple sections |
| Error Handling | Resilience across multiple failure modes |
| Domain Knowledge | SEO concepts and metrics |

The copilot must demonstrate both technical implementation skill AND strategic thinking about system design.
