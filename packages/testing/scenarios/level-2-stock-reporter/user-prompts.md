# Level 2: Stock Market Reporter - User Prompts

These are the prompts a non-technical user would give to a coding copilot. They are intentionally vague and natural - the copilot must ask clarifying questions to gather the full requirements.

---

## Initial Prompt

> I want to build something that can check stock prices and give me a nice summary report. I check the same few stocks every day and it's tedious to look them all up manually. Can you help?

---

## Follow-up Prompts

Use these to respond naturally to likely copilot questions:

### When asked which stocks to track:

> Mainly the big tech ones - Apple, Google, Microsoft, Amazon, and Nvidia. Those are the ones I own.

### When asked about the report format:

> Something I can read easily - maybe a markdown file? I want to see the current price, how much it changed today, that kind of stuff. Oh, and maybe which one did best and worst.

### When asked about APIs or data sources:

> I'm not sure what API to use. Yahoo Finance has all this data for free, right? Can we use that somehow?

### When asked about API keys or authentication:

> I'd rather not deal with API keys if possible. Is there a free option that doesn't need one?

### When asked how often to run this:

> I'd just run it manually when I want to check. Maybe every morning before the market opens, or after it closes.

### When asked about error handling:

> If a ticker doesn't work, just skip it and tell me which ones failed. Don't crash the whole thing.

### When asked about additional features:

> For now let's keep it simple. Just prices and daily changes. We can add more later if needed.

### When asked about output destination:

> Just print the report or save it to a file. I'll copy it into Slack or wherever I need it.

---

## Guidance Notes for Tester

These notes help the tester respond appropriately during the conversation:

### Information the User CAN Provide

✅ Which stocks: AAPL, GOOGL, MSFT, AMZN, NVDA
✅ Desired output: Markdown format with prices and changes
✅ Data source preference: Yahoo Finance (free)
✅ No API key preference: Wants free/keyless option
✅ Basic error handling needs: Skip bad tickers, don't crash

### Information the User Should NOT Provide

❌ Specific library to use (yfinance)
❌ Tool implementation details
❌ Whether markdown generation needs a tool
❌ Specific yfinance API field names
❌ Rate limiting concerns

### User Persona

- **Role:** Individual investor, possibly works in a non-technical field
- **Technical Level:** Can run Python scripts, uses command line basics, but not a developer
- **Communication Style:** Conversational, uses "stocks" not "tickers", says "changes" not "deltas"
- **Decision Making:** Has clear preferences about output, defers on technical choices

### Realistic Responses to Avoid

The user would NOT say things like:
- ❌ "Use the yfinance library with ticker.info['regularMarketPrice']"
- ❌ "Don't create a tool for markdown generation"
- ❌ "Handle the 429 rate limit response"
- ❌ "Batch the API requests"

Instead, the same intent would be expressed as:
- ✅ "I want to see the stock prices"
- ✅ "Make it look nice and readable"
- ✅ "Don't make too many requests too fast"
- ✅ "Get all the stocks at once if you can"

---

## Key Behavior to Observe

### Tool Selection Intelligence

Watch for whether the copilot:
1. **Correctly identifies** that API calls need a tool
2. **Correctly identifies** that markdown formatting does NOT need a tool
3. **Explains the distinction** to the user if asked

This is a critical evaluation point for Level 2.

### API Guidance Quality

Watch for whether the copilot:
1. Recommends `yfinance` (good - free, no key needed)
2. Explains the library choice
3. Mentions limitations (rate limiting, market hours)

---

## Test Scenarios for Completed Agent

Once the agent is built, test with these:

### Basic Functionality
1. "Get me a stock report" (should use default tickers)
2. "Check TSLA and META" (should handle custom tickers)
3. "What's Apple stock at right now?" (conversational query)

### Error Handling
4. "Check AAPL and FAKESYMBOL123" (should handle invalid ticker)
5. Run multiple times quickly (may hit rate limits)

### Edge Cases
6. Run outside market hours (prices should be from last close)
7. "Add Bitcoin to the report" (BTC-USD - different ticker format)

### Report Quality
8. Verify markdown renders correctly
9. Verify calculations (change = current - previous close)
10. Verify all requested data points are present
