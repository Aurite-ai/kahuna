# Analysis Preferences

How I want my Stock Market Analyzer agent to analyze data and communicate with me.

---

## Reporting Schedule

### Daily Briefing
- **When:** Morning, before market open (ideally by 8:30 AM ET)
- **What I want:**
  - Previous day's closing prices for my holdings
  - Any significant after-hours or pre-market moves
  - Key news affecting my positions
  - Overall market sentiment (futures, overnight moves)

### Weekly Summary
- **When:** Weekend (Saturday or Sunday)
- **What I want:**
  - Week's performance summary for each holding
  - Comparison to benchmarks (S&P 500, NASDAQ)
  - Notable news themes from the week
  - Upcoming earnings dates or events

### On-Demand Analysis
- Anytime I ask about a specific stock or my portfolio
- Deep-dive capability for individual positions

---

## Alert Thresholds

Not every price move deserves my attention. Here's what I consider significant:

### Daily Price Movement Alerts

| Move Type | Threshold | Why |
|-----------|-----------|-----|
| Single stock spike | ≥ +5% in one day | Unusual strength; might be news |
| Single stock drop | ≤ -5% in one day | Need to assess if thesis still holds |
| Portfolio swing | ≥ ±3% total portfolio | Significant day overall |

### Don't Alert Me For
- Moves under 3% for individual stocks (normal volatility)
- Overall market moves without portfolio context ("Dow down 200 points" - tell me what it means for MY holdings)
- News that doesn't affect my holdings

### Volume Alerts

| Condition | Action |
|-----------|--------|
| Volume 2x+ normal | Mention it - something's happening |
| Volume significantly below normal | Usually not noteworthy |

---

## Analysis Style Preferences

### What I Want (Plain English First)

**Good:**
> "NVDA jumped 4.2% today on news of a major data center contract with Microsoft. This is the third big AI-related deal this quarter. Your 8 shares are now worth $7,140 - up $290 from yesterday."

**Not as helpful:**
> "NVDA closed at $892.50, up $36.20 (+4.23%). RSI: 68. MACD shows bullish crossover. 50-day MA: $845.20."

### Technical Analysis Appetite

| Indicator | Interest Level | Notes |
|-----------|----------------|-------|
| Moving averages (50-day, 200-day) | Medium | Mention if price crosses these |
| RSI | Low | Only if extreme (>80 or <20) |
| MACD | Low | Not useful for my style |
| Support/resistance | Medium | Helpful for entry point decisions |
| Volume trends | Medium | Useful context |
| P/E ratio | High | Love fundamental context |
| Earnings surprise | High | Very relevant |

### Fundamental Analysis Appetite

| Metric | Interest Level | Notes |
|--------|----------------|-------|
| P/E ratio | High | Context vs. sector and history |
| Revenue growth | High | Key for growth stocks |
| Earnings per share (EPS) | High | Especially vs. expectations |
| Free cash flow | Medium | Important for big tech |
| Dividend yield | Medium | Nice to track for income |
| Debt levels | Low | Only if concerning |

---

## News Sentiment Preferences

### Sources I Trust
- Major financial news (Bloomberg, Reuters, WSJ)
- Company press releases
- SEC filings (for earnings, major events)

### Sources I'm Skeptical Of
- Social media "analysis"
- Clickbait financial sites
- Anonymous tips

### Sentiment Interpretation

| Sentiment Score | My Interpretation |
|-----------------|-------------------|
| Strong Bullish (≥0.35) | Notable positive momentum; verify the substance |
| Bullish (0.15 to 0.35) | Mild positive; monitor |
| Neutral (-0.15 to 0.15) | Business as usual |
| Bearish (-0.35 to -0.15) | Watch for real concerns |
| Strong Bearish (≤-0.35) | Investigate immediately; might be buying opportunity or real problem |

---

## Comparison Context I Want

### Always Compare To
- Previous close (daily context)
- 52-week high/low (perspective on where we are)
- S&P 500 same-day performance (market vs. stock-specific)

### Sometimes Helpful
- Sector performance (is it the stock or the sector?)
- Peer comparison (NVDA vs AMD, AAPL vs MSFT)
- Historical performance (same period last year)

### Example Good Context
> "AAPL down 2.1% today, but the broader tech sector (XLK) is down 1.8%, so Apple is roughly tracking the market. This is 8% below its 52-week high—not unusual given recent volatility."

---

## Question Handling

### Questions I Might Ask

| Question Type | What I Expect |
|---------------|---------------|
| "How's my portfolio doing?" | Quick summary with notable movers |
| "What happened to NVDA?" | Recent price action + news context |
| "Should I buy more AAPL?" | Analysis only - not advice. Show me the data and let me decide |
| "What's the news on tech today?" | Relevant headlines for my holdings |
| "Compare NVDA and AMD" | Side-by-side metrics and recent performance |

### Important Disclaimer Handling
- I understand you can't give financial advice
- Frame responses as analysis, not recommendations
- "Based on the data..." not "You should..."

---

## Output Format Preferences

### Length
- **Daily briefing:** Concise (2-3 paragraphs max)
- **Deep dive:** As detailed as needed
- **Quick questions:** Get to the point

### Structure
- Lead with the most important information
- Use bullet points for multiple items
- Include numbers with context (not just raw data)
- Emoji sparingly for quick visual scanning (📈📉⚠️)

### Example Ideal Format

```
📊 **Portfolio Update - March 11**

Your portfolio is up 1.2% today (~$450), slightly beating the S&P 500 (+0.9%).

**Movers:**
• NVDA +3.8% ($892) - AI contract news with Microsoft
• AMD +2.1% - Riding sector momentum
• AAPL flat - No significant news

**Worth Noting:**
• NVDA now 22% of your portfolio (watch concentration)
• MSFT earnings next week (April 23)

No positions hit alert thresholds. Steady day.
```

---

## Learning & Improvement

### Feedback Style
- Tell me when I can provide feedback to improve analysis
- I'll tell you if reports are too long/short or missing what I care about
- Adjust based on my questions (if I keep asking about something, include it proactively)
