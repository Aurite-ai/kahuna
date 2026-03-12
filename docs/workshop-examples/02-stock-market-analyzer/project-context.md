# Business Context

**User:** Personal Investor
**Purpose:** Monitor portfolio, analyze market trends, and receive natural language briefings

## Pre-Workshop Setup

**API Key Required:** You must register for a free Alpha Vantage API key before the workshop.

1. Visit https://www.alphavantage.co/support/#api-key
2. Fill out the registration form (name and email)
3. You'll receive your API key immediately
4. Save it somewhere safe—you'll need it during the workshop

**Rate Limits:** Free tier allows 5 API requests/minute and 500 requests/day. This is plenty for workshop exercises, but be mindful of rapid testing.

## Background

I'm a personal investor managing a small stock portfolio. I check my holdings daily, but I spend too much time:
- Manually looking up prices for each stock
- Trying to understand what's moving and why
- Reading multiple news sources for relevant information
- Translating raw numbers into "should I be concerned?" decisions

I want an agent that understands my portfolio and investment style, then gives me a concise daily briefing in plain English—like having a personal financial analyst.

## Why This Project?

**For Data Analytics Students:** This project showcases core data analytics skills in a domain that's professionally relevant and personally interesting. You'll work with real financial data, calculate meaningful metrics, and translate quantitative information into narrative insights.

| Learning Focus | Data Analytics Connection |
|----------------|--------------------------|
| Time Series Analysis | Stock prices are classic time series data—trends, moving averages, volatility |
| Trend Detection | Identifying patterns in price movements and volume changes |
| Multi-source Integration | Combining price data with news sentiment for richer analysis |
| Narrative Generation | Transforming numbers into actionable insights—the analyst's core skill |
| Threshold Alerting | "Significant move" detection based on configurable thresholds |

**API Authentication Pattern:** Alpha Vantage uses simple API key authentication—append `apikey=YOUR_KEY` to requests. This is the most common pattern for data APIs you'll encounter professionally.

## Pain Points

| Pain Point | Impact |
|------------|--------|
| Checking multiple stocks individually | Time-consuming; easy to miss important moves |
| Raw numbers without context | "-2.3% today" doesn't tell me if that's significant |
| News overload | Hundreds of articles, most not relevant to my holdings |
| No personalized thresholds | Generic alerts don't match my risk tolerance |
| Sector-level blindness | Hard to see if it's my stock or the whole sector moving |

## Goals

- Get a daily portfolio summary without checking each stock manually
- Understand which moves are significant vs. normal volatility
- Receive relevant news summaries tied to my holdings
- Know when to pay attention vs. when to ignore fluctuations
- Track performance against my investment thesis

## Allowed Services

This agent MAY use:

- **Alpha Vantage API** (https://www.alphavantage.co/documentation/)
  - Get real-time quotes (GLOBAL_QUOTE)
  - Get historical daily prices (TIME_SERIES_DAILY)
  - Get news with sentiment analysis (NEWS_SENTIMENT)
  - **API key required** - free registration
  - 5 requests/minute, 500 requests/day on free tier

This agent may NOT:

- Execute trades or place orders
- Access brokerage accounts
- Provide specific buy/sell recommendations (for legal reasons)
- Store financial data beyond the current session

## Alpha Vantage API Reference

### GLOBAL_QUOTE - Get Latest Price

Returns the latest price and daily statistics for a single ticker.

```
GET https://www.alphavantage.co/query
    ?function=GLOBAL_QUOTE
    &symbol=AAPL
    &apikey=YOUR_API_KEY
```

**Response:**
```json
{
  "Global Quote": {
    "01. symbol": "AAPL",
    "02. open": "178.50",
    "03. high": "182.30",
    "04. low": "177.80",
    "05. price": "181.25",
    "06. volume": "52341678",
    "07. latest trading day": "2026-03-11",
    "08. previous close": "179.10",
    "09. change": "2.15",
    "10. change percent": "1.20%"
  }
}
```

### TIME_SERIES_DAILY - Historical Prices

Returns daily OHLCV (Open, High, Low, Close, Volume) data for trend analysis.

```
GET https://www.alphavantage.co/query
    ?function=TIME_SERIES_DAILY
    &symbol=MSFT
    &outputsize=compact
    &apikey=YOUR_API_KEY
```

**Parameters:**
- `outputsize`: `compact` (latest 100 days, default) or `full` (20+ years, premium)

**Response:**
```json
{
  "Meta Data": {
    "1. Information": "Daily Prices (open, high, low, close) and Volumes",
    "2. Symbol": "MSFT",
    "3. Last Refreshed": "2026-03-11",
    "4. Output Size": "Compact",
    "5. Time Zone": "US/Eastern"
  },
  "Time Series (Daily)": {
    "2026-03-11": {
      "1. open": "415.20",
      "2. high": "418.50",
      "3. low": "413.80",
      "4. close": "417.35",
      "5. volume": "18234567"
    },
    "2026-03-10": {
      "1. open": "412.00",
      "2. high": "416.20",
      "3. low": "410.50",
      "4. close": "415.10",
      "5. volume": "16543210"
    }
  }
}
```

### NEWS_SENTIMENT - Market News with Sentiment

Returns news articles with relevance and sentiment scores for tickers.

```
GET https://www.alphavantage.co/query
    ?function=NEWS_SENTIMENT
    &tickers=AAPL
    &apikey=YOUR_API_KEY
```

**Parameters:**
- `tickers`: Comma-separated symbols (e.g., `AAPL,MSFT,GOOGL`)
- `time_from` / `time_to`: Optional timestamp filters (YYYYMMDDTHHMM format)

**Response:**
```json
{
  "feed": [
    {
      "title": "Apple Announces New AI Features for iPhone",
      "url": "https://example.com/article",
      "time_published": "20260311T143000",
      "source": "TechNews",
      "summary": "Apple unveiled new artificial intelligence capabilities...",
      "ticker_sentiment": [
        {
          "ticker": "AAPL",
          "relevance_score": "0.85",
          "ticker_sentiment_score": "0.42",
          "ticker_sentiment_label": "Bullish"
        }
      ]
    }
  ],
  "sentiment_score_definition": "x <= -0.35: Bearish; -0.35 < x <= -0.15: Somewhat-Bearish; -0.15 < x < 0.15: Neutral; 0.15 <= x < 0.35: Somewhat-Bullish; x >= 0.35: Bullish"
}
```

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- **External API:** Alpha Vantage (REST, API key auth)
- **HTTP Client:** requests or httpx
- See `.claude/rules/langgraph.md` for development patterns

## Sample Interaction

```
User: "How's my portfolio doing today?"

Agent:
1. Reads user's portfolio from KB (AAPL, MSFT, GOOGL, NVDA, VTI)
2. Fetches GLOBAL_QUOTE for each holding
3. Identifies significant movers based on user's thresholds
4. Checks NEWS_SENTIMENT for any notable headlines
5. Generates briefing:

"Portfolio Summary for March 11:

📈 **Strong Day Overall** - Your portfolio is up ~1.4% today

**Notable Movers:**
• NVDA +3.2% ($892.50) - Biggest gainer. News: Positive sentiment
  around new data center GPU announcement.
• AAPL +1.2% ($181.25) - Steady gains on AI feature previews.

**Holding Steady:**
• MSFT +0.5%, GOOGL +0.3%, VTI +0.4%

**No positions hit your alert thresholds today.**

**Sector Context:** Tech sector broadly up today (+1.1%), so your
gains are slightly outpacing the sector—good sign.

Want me to dig deeper into any position?"
```

## Example Python Code

```python
import requests

ALPHA_VANTAGE_KEY = "YOUR_API_KEY"
BASE_URL = "https://www.alphavantage.co/query"

def get_quote(symbol: str) -> dict:
    """Fetch latest quote for a stock symbol."""
    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    quote = data.get("Global Quote", {})
    return {
        "symbol": quote.get("01. symbol"),
        "price": float(quote.get("05. price", 0)),
        "change": float(quote.get("09. change", 0)),
        "change_percent": quote.get("10. change percent", "0%"),
        "volume": int(quote.get("06. volume", 0))
    }

def get_daily_prices(symbol: str, days: int = 30) -> list:
    """Fetch historical daily prices for trend analysis."""
    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "outputsize": "compact",
        "apikey": ALPHA_VANTAGE_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    time_series = data.get("Time Series (Daily)", {})
    prices = []
    for date, values in sorted(time_series.items(), reverse=True)[:days]:
        prices.append({
            "date": date,
            "close": float(values["4. close"]),
            "volume": int(values["5. volume"])
        })
    return prices

def get_news_sentiment(tickers: list) -> list:
    """Fetch news with sentiment for given tickers."""
    params = {
        "function": "NEWS_SENTIMENT",
        "tickers": ",".join(tickers),
        "apikey": ALPHA_VANTAGE_KEY
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json()

    articles = []
    for item in data.get("feed", [])[:5]:  # Limit to top 5
        articles.append({
            "title": item.get("title"),
            "source": item.get("source"),
            "summary": item.get("summary"),
            "sentiment": item.get("ticker_sentiment", [])
        })
    return articles

# Example usage
if __name__ == "__main__":
    # Get current quote
    aapl = get_quote("AAPL")
    print(f"AAPL: ${aapl['price']:.2f} ({aapl['change_percent']})")

    # Get 30-day price history for trend analysis
    history = get_daily_prices("AAPL", days=30)
    print(f"30-day price range: ${min(p['close'] for p in history):.2f} - ${max(p['close'] for p in history):.2f}")

    # Get relevant news
    news = get_news_sentiment(["AAPL", "MSFT"])
    for article in news:
        print(f"- {article['title']} ({article['source']})")
```

## Knowledge Base Files

| File | Purpose |
|------|---------|
| `portfolio.md` | User's stock holdings, purchase prices, investment goals |
| `analysis-preferences.md` | Alert thresholds, reporting frequency, analysis style preferences |
