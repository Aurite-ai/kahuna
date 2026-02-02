# Level 2: Stock Market Reporter - Requirements

**Scenario:** Daily Stock Report Generator
**Complexity:** Intermediate
**Primary Focus:** 3rd party API authentication, tool selection, output formatting

---

## Business Context

### Use Case: Personal Investment Tracking

**User:** Individual investor who wants daily summaries of their watched stocks
**Need:** Automated report generation showing current prices, daily changes, and basic metrics

**Why This Agent:**
The user wants to stay informed about their portfolio without manually checking multiple sources. They want a simple markdown report they can read each morning or share in their investment club's Slack channel.

**Key Insight:** The final markdown output is just text formatting - it doesn't need a tool. The agent should recognize that only the data fetching requires API calls.

---

## Functional Requirements

### FR-1: Stock Price Retrieval

The agent MUST fetch current stock data including:
- Current price
- Daily change (absolute and percentage)
- Day's high and low
- Trading volume
- 52-week high/low (if available)

### FR-2: Multiple Stock Support

The agent MUST support fetching data for multiple stocks in a single report:
- Default watchlist: AAPL, GOOGL, MSFT, AMZN, NVDA
- User can specify custom tickers
- Handle invalid tickers gracefully

### FR-3: Markdown Report Generation

The agent MUST generate a formatted markdown report including:
- Report timestamp
- Table of stock prices and changes
- Brief summary of market movement
- Clear formatting for easy reading

**Example Report Structure:**
```markdown
# Daily Stock Report
*Generated: January 28, 2026 at 9:30 AM EST*

## Portfolio Summary

| Ticker | Price | Change | % Change | Volume |
|--------|-------|--------|----------|--------|
| AAPL | $185.50 | +$2.30 | +1.26% | 52.3M |
| GOOGL | $142.80 | -$1.20 | -0.83% | 18.7M |
| ... | ... | ... | ... | ... |

## Market Highlights

- **Best Performer:** NVDA (+3.2%)
- **Worst Performer:** AMZN (-1.5%)
- **Highest Volume:** AAPL (52.3M shares)

---
*Data provided by Yahoo Finance*
```

### FR-4: Error Handling

- Invalid ticker: Report which tickers failed, continue with valid ones
- API rate limit: Inform user and suggest retry timing
- Network error: Clear error message with retry suggestion

---

## Technical Requirements

### TR-1: Yahoo Finance API Integration

Use the `yfinance` Python library for data retrieval:

```python
import yfinance as yf

# Fetch single stock
ticker = yf.Ticker("AAPL")
info = ticker.info
history = ticker.history(period="1d")

# Fetch multiple stocks
tickers = yf.Tickers("AAPL GOOGL MSFT")
```

**Key Data Points to Extract:**
| Field | yfinance Attribute |
|-------|-------------------|
| Current Price | `info['currentPrice']` or `info['regularMarketPrice']` |
| Previous Close | `info['previousClose']` |
| Day High | `info['dayHigh']` |
| Day Low | `info['dayLow']` |
| Volume | `info['volume']` |
| 52W High | `info['fiftyTwoWeekHigh']` |
| 52W Low | `info['fiftyTwoWeekLow']` |

**Note:** `yfinance` is a free library that scrapes Yahoo Finance. No API key required, but subject to rate limiting.

### TR-2: Tool Design

Implement a stock fetching tool:

```python
@tool
def get_stock_data(tickers: list[str]) -> dict:
    """
    Fetch current stock data for the given tickers.

    Args:
        tickers: List of stock ticker symbols (e.g., ['AAPL', 'GOOGL'])

    Returns:
        Dictionary with ticker as key and stock data as value

    Example:
        {
            'AAPL': {
                'price': 185.50,
                'change': 2.30,
                'change_percent': 1.26,
                'volume': 52300000,
                'day_high': 186.20,
                'day_low': 183.10,
                'error': None
            },
            'INVALID': {
                'error': 'Ticker not found'
            }
        }
    """
```

### TR-3: Tool Usage Awareness (CRITICAL)

**The agent should NOT use a tool to generate markdown.**

This is a key test of tool selection intelligence:
- ✅ Use tool: Fetching stock data from API
- ❌ Don't use tool: Formatting markdown report

The agent should recognize that:
1. Data retrieval requires external API (needs tool)
2. Report formatting is text manipulation (no tool needed)

### TR-4: Agent Architecture

Use LangGraph with:
- State: Requested tickers, fetched data, generated report
- Tools: `get_stock_data`
- Graph: Tool call for data, then direct LLM response for formatting

### TR-5: Environment Configuration

API access should be configurable:
- No API key needed for yfinance (it's scraping-based)
- Should handle cases where yfinance is rate-limited
- Consider adding delay between requests for multiple tickers

---

## Default Stock Watchlist

The default watchlist for testing:

| Ticker | Company | Sector |
|--------|---------|--------|
| AAPL | Apple Inc. | Technology |
| GOOGL | Alphabet Inc. | Technology |
| MSFT | Microsoft Corp. | Technology |
| AMZN | Amazon.com Inc. | Consumer |
| NVDA | NVIDIA Corp. | Technology |

---

## Success Criteria

### SC-1: Data Accuracy
Stock data matches current Yahoo Finance values (within reasonable market delay)

### SC-2: Report Quality
Generated markdown is well-formatted, readable, and contains all required sections

### SC-3: Tool Selection
Agent correctly uses tool for API calls and NOT for markdown generation

### SC-4: Error Handling
Invalid tickers handled gracefully without crashing entire report

### SC-5: Code Quality
Clean implementation following LangGraph patterns

---

## Common Pitfalls to Catch

### Tool Design Pitfalls
1. **Markdown tool** - Creating a tool to format markdown (unnecessary)
2. **Single ticker tool** - Requiring N API calls for N tickers instead of batching
3. **Missing error handling** - Crashing on invalid ticker

### API Pitfalls
1. **Rate limiting** - Not handling 429 responses
2. **Market hours** - Not considering that prices may be stale outside market hours
3. **Data structure changes** - yfinance API can change; not handling missing fields

### Output Pitfalls
1. **Raw JSON dump** - Outputting raw API response instead of formatted report
2. **Missing context** - Not including timestamp or data source attribution
3. **Poor formatting** - Tables that don't render well in markdown

---

## Testing Notes

### Market Hours Consideration
- NYSE/NASDAQ: 9:30 AM - 4:00 PM EST
- Pre-market: 4:00 AM - 9:30 AM EST
- After-hours: 4:00 PM - 8:00 PM EST

Outside these hours, prices shown will be from the last trading session.

### Rate Limiting
yfinance may rate-limit aggressive requests. If testing repeatedly:
- Add 1-second delay between ticker fetches
- Cache responses during development
- Consider mock data for rapid iteration

### Known yfinance Quirks
- Some fields may be `None` for certain stocks
- Cryptocurrency tickers use different symbols (e.g., BTC-USD)
- International stocks may have different data availability
