
# Business Context

**Company:** Personal Use / Small Business
**Purpose:** Generate daily stock market reports

## Background
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
