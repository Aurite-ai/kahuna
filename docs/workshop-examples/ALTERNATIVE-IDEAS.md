# Workshop Examples: Alternative Ideas Assessment

**Date:** 2026-03-12
**Purpose:** Evaluate current workshop examples for data analytics student appeal and propose alternatives
**Status:** Draft for Review

---

## Executive Summary

The current workshop examples are **well-designed technically** but **miss opportunities to excite data analytics students**. The projects feel generic—the kind of examples you'd find in any "build your first AI agent" tutorial. For grad students in data analytics, these don't showcase the interesting data problems they're learning to solve.

**Key Finding:** 3 of 5 projects could be replaced with more data-analytics-relevant alternatives without increasing complexity.

---

## Assessment of Current Examples

### What's Working Well

| Strength | Examples |
|----------|----------|
| **Clear learning progression** | No-auth → API key → complex auth |
| **Good API choices** | Open-Meteo, Spoonacular, Notion all have generous free tiers |
| **Well-structured project-context.md files** | Clear for copilots to implement |
| **Practical, achievable scope** | All doable in a workshop session |

### What's Lacking

| Issue | Impact |
|-------|--------|
| **Generic domains** | Email triage, recipes, meeting notes—these feel like admin automation, not data analytics |
| **No data analysis showcase** | Students don't see their analytical skills applied meaningfully |
| **Missing "wow factor"** | Nothing a student would proudly show classmates or put on a portfolio |
| **Disconnected from field** | Data analytics students work with datasets, patterns, predictions—not meal planning |

---

## Project-by-Project Assessment

### ✅ Keep: Weather Advisory Agent (Project 3)

| Criterion | Assessment |
|-----------|------------|
| **Data Analytics Relevance** | ⭐⭐⭐⭐⭐ Strongest project—real data interpretation |
| **Student Excitement** | ⭐⭐⭐ Practical but not glamorous |
| **API Simplicity** | ⭐⭐⭐⭐⭐ Zero auth, generous limits |

**Verdict:** Keep as-is. This is the most analytically relevant project—transforming raw numerical data into actionable insights is exactly what data analysts do.

### ⚠️ Consider Replacing: Email Triage Assistant (Project 2)

| Criterion | Assessment |
|-----------|------------|
| **Data Analytics Relevance** | ⭐⭐ Classification is relevant, but email feels like admin work |
| **Student Excitement** | ⭐⭐ Corporate, boring context |
| **API Simplicity** | ⭐⭐⭐⭐⭐ No API needed |

**Problem:** The "wealth management firm executive assistant" framing is off-putting. Students don't identify with corporate email triage.

**Verdict:** The classification pattern is good, but the domain needs rethinking. Could be replaced with sentiment analysis or content classification in a more engaging domain.

### ⚠️ Consider Replacing: Recipe Meal Planner (Project 4)

| Criterion | Assessment |
|-----------|------------|
| **Data Analytics Relevance** | ⭐⭐ Constraint satisfaction is relevant, but recipes feel domestic |
| **Student Excitement** | ⭐⭐ Personal utility, but not impressive |
| **API Simplicity** | ⭐⭐⭐⭐ Simple API key auth |

**Problem:** "What should I cook this week?" doesn't feel like a data analytics problem. It's a consumer app feature.

**Verdict:** Replace with a constraint satisfaction problem in a more analytical domain (sports lineup optimization, portfolio balancing, resource allocation).

### ⚠️ Consider Replacing: Meeting Summarizer (Project 5)

| Criterion | Assessment |
|-----------|------------|
| **Data Analytics Relevance** | ⭐⭐⭐ NLP/text extraction is relevant |
| **Student Excitement** | ⭐⭐ Feels like enterprise software |
| **API Simplicity** | ⭐⭐⭐ Asana PAT is straightforward |

**Problem:** The consulting firm context is forgettable. Meeting notes → tasks is useful but unexciting.

**Verdict:** Could keep if reframed, but there are more exciting NLP applications (research paper analysis, news trend detection).

### ✅ Keep (Modified): Volunteer Coordinator (Project 6)

| Criterion | Assessment |
|-----------|------------|
| **Data Analytics Relevance** | ⭐⭐⭐⭐ Matching/optimization is core analytics |
| **Student Excitement** | ⭐⭐⭐ Social good angle helps |
| **API Simplicity** | ⭐⭐⭐ Notion API is reasonable |

**Verdict:** Keep—the optimization/matching problem is genuinely analytical. The nonprofit angle provides social relevance.

---

## Alternative Project Ideas

### 🏀 Alternative 1: Sports Analytics Agent

**Concept:** An agent that analyzes NBA/NFL player performance data and recommends fantasy lineup decisions or game predictions.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Sports analytics is a hot field; students can engage with something they care about |
| **Data Analytics Connection** | Statistical analysis, prediction, trend detection, historical comparison |
| **API Option** | ESPN API (no auth) or BALLDONTLIE (5 req/min free, API key) |
| **Complexity** | Low-Medium |
| **Sample Interaction** | "Should I start Patrick Mahomes or Josh Allen this week?" → Agent analyzes matchups, recent performance, weather conditions |

**Agent Capabilities:**
1. Fetch player statistics and recent performance trends
2. Compare historical matchup data
3. Factor in injuries, weather, home/away splits
4. Generate confidence-scored recommendations
5. Explain reasoning with data visualizations

**Why It Beats Recipe Planner:** Same constraint satisfaction pattern (budget constraints, position requirements) but in a domain students actually care about.

---

### 📈 Alternative 2: Stock Market Trend Analyzer

**Concept:** An agent that analyzes stock market data, detects patterns, and generates plain-English market summaries with investment insights.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Finance/investing is inherently interesting to analytically-minded students |
| **Data Analytics Connection** | Time series analysis, trend detection, correlation, technical indicators |
| **API Option** | Alpha Vantage (free, API key) or Finnhub (free, includes sentiment) |
| **Complexity** | Medium |
| **Sample Interaction** | "What's happening with tech stocks this week?" → Agent fetches data, identifies trends, explains in plain English |

**Agent Capabilities:**
1. Fetch real-time and historical stock prices
2. Calculate moving averages, RSI, and other technical indicators
3. Identify sector trends and correlations
4. Monitor news sentiment (if using Finnhub)
5. Generate natural language market summaries

**Why It Beats Email Triage:** Same pattern matching/classification, but the domain is genuinely analytical and professionally relevant.

---

### 🚀 Alternative 3: NASA Space Event Monitor

**Concept:** An agent that tracks near-Earth objects (asteroids), Mars rover activity, and space weather events, providing personalized alerts and educational content.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Space is universally fascinating; NASA data is authoritative and free |
| **Data Analytics Connection** | Real-time data monitoring, threshold alerting, data enrichment |
| **API Option** | NASA API (1000 req/hour free, API key) |
| **Complexity** | Low |
| **Sample Interaction** | "Are there any asteroids passing close to Earth this week?" → Agent fetches NEO data, calculates close approaches, explains significance |

**Agent Capabilities:**
1. Query Near-Earth Object (NEO) data for upcoming close approaches
2. Fetch latest Mars Rover images and mission updates
3. Monitor space weather conditions (solar flares, geomagnetic storms)
4. Generate daily space digest with educational context
5. Alert on significant events (large asteroid approaches, new discoveries)

**Why It Beats Meeting Summarizer:** Real data interpretation with actual scientific significance, not administrative busywork.

---

### 📰 Alternative 4: News Trend Analyzer

**Concept:** An agent that monitors news sources, detects emerging trends and narratives, and performs basic sentiment analysis on topics of interest.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Media literacy is topical; understanding information flows is analytically interesting |
| **Data Analytics Connection** | Text analysis, sentiment classification, trend detection, entity extraction |
| **API Option** | NewsAPI.org (100 req/day free, API key) or GNews (10 req/hour free) |
| **Complexity** | Medium |
| **Sample Interaction** | "What are the top trends in AI news this week?" → Agent fetches articles, clusters topics, summarizes sentiment |

**Agent Capabilities:**
1. Fetch news articles by topic, source, or keyword
2. Extract named entities (people, companies, locations)
3. Classify article sentiment (positive, negative, neutral)
4. Cluster related stories into narratives
5. Track topic evolution over time

**Why It Beats Current Options:** NLP is a core data analytics skill, and this showcases it in an engaging domain.

---

### 🌍 Alternative 5: Air Quality & Health Advisory Agent

**Concept:** An agent that monitors air quality data and provides health-contextualized recommendations, especially for sensitive groups.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Environmental data with direct health implications; socially relevant |
| **Data Analytics Connection** | Real-time monitoring, threshold alerting, multi-factor risk assessment |
| **API Option** | OpenAQ (free, no auth) or IQAir (free tier with API key) |
| **Complexity** | Low-Medium |
| **Sample Interaction** | "Is it safe to go jogging today?" → Agent checks AQI, considers user's health profile, provides guidance |

**Agent Capabilities:**
1. Fetch real-time air quality index (AQI) for user location
2. Check pollutant levels (PM2.5, ozone, NO2)
3. Apply health-specific thresholds (asthma, elderly, children)
4. Forecast AQI changes based on weather patterns
5. Recommend outdoor activity windows

**Alternative to Weather Advisory:** Similar pattern but with a stronger public health angle—more analytically interesting than "good day for hiking."

---

### 💼 Alternative 6: Economic Indicator Dashboard Agent

**Concept:** An agent that monitors macroeconomic indicators (GDP, unemployment, inflation) and explains economic trends in accessible language.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Economics is foundational for business analytics students |
| **Data Analytics Connection** | Time series, economic modeling, lagging/leading indicator analysis |
| **API Option** | FRED API (free, API key, Federal Reserve data) |
| **Complexity** | Medium |
| **Sample Interaction** | "How is the job market looking this quarter?" → Agent fetches BLS data, contextualizes trends, compares to historical patterns |

**Agent Capabilities:**
1. Query key economic indicators from FRED
2. Calculate period-over-period changes
3. Identify correlations between indicators
4. Generate plain-English economic summaries
5. Compare current conditions to historical periods

**Portfolio Relevance:** This is the kind of project that demonstrates real analytical thinking to employers.

---

### 🎮 Alternative 7: Esports Analytics Agent

**Concept:** An agent that analyzes competitive gaming statistics for games like League of Legends, VALORANT, or Rocket League.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Esports is a massive industry; many students are gamers |
| **Data Analytics Connection** | Performance metrics, team composition analysis, win rate prediction |
| **API Option** | Riot Games API (free, API key) or tracker.gg APIs |
| **Complexity** | Medium |
| **Sample Interaction** | "How is Cloud9's support player performing this split?" → Agent fetches match history, calculates KDA trends, compares to role averages |

**Agent Capabilities:**
1. Fetch player and team match histories
2. Calculate performance metrics (KDA, CS/min, damage share)
3. Compare players to role/rank averages
4. Identify performance trends over time
5. Predict match outcomes based on historical data

**Youth Appeal:** This resonates with younger students more than corporate meeting software.

---

### 📚 Alternative 8: Research Paper Discovery Agent

**Concept:** An agent that searches academic databases, summarizes papers, and identifies relevant research for a given topic.

| Attribute | Value |
|-----------|-------|
| **Why Exciting** | Directly relevant to grad students doing research |
| **Data Analytics Connection** | Information retrieval, citation analysis, text summarization |
| **API Option** | Semantic Scholar API (free, no auth for basic) or arXiv API (free, no auth) |
| **Complexity** | Medium |
| **Sample Interaction** | "Find recent papers on transformer architectures for time series" → Agent searches, ranks by relevance/citations, summarizes key findings |

**Agent Capabilities:**
1. Search academic databases by keywords and filters
2. Retrieve paper metadata (title, abstract, citations, authors)
3. Summarize abstracts into key findings
4. Identify highly-cited foundational papers
5. Suggest related research directions

**Grad Student Utility:** This is something they'd actually use—not a toy example.

---

## Recommendations

### Recommended Project Lineup

| # | Current | Recommendation | Reason |
|---|---------|---------------|--------|
| 2 | Email Triage | **Replace with** Stock Market Analyzer | Same classification pattern, much more exciting domain |
| 3 | Weather Advisory | **Keep** | Already the strongest data-analytics example |
| 4 | Recipe Planner | **Replace with** Sports Analytics Agent | Same constraint satisfaction, domain students care about |
| 5 | Meeting Summarizer | **Replace with** Research Paper Discovery | Same NLP/extraction, directly useful for grad students |
| 6 | Volunteer Coordinator | **Keep** | Optimization/matching is genuinely analytical |

### Alternative Recommendation (Simpler Changes)

If replacing 3 projects feels like too much rework:

| # | Current | Recommendation | Reason |
|---|---------|---------------|--------|
| 2 | Email Triage | **Keep but reframe** | Change from "corporate exec assistant" to "academic department coordinator" or "startup founder" |
| 3 | Weather Advisory | **Keep** | Already works well |
| 4 | Recipe Planner | **Replace with** Sports Analytics Agent | Highest-impact single change |
| 5 | Meeting Summarizer | **Keep but reframe** | Change from "consulting firm" to "research lab" or "student organization" |
| 6 | Volunteer Coordinator | **Keep** | Already works well |

### API Feasibility Summary

All recommended alternatives use verified free APIs:

| Alternative | API | Auth | Free Tier |
|-------------|-----|------|-----------|
| Sports Analytics | ESPN API | None | Unlimited |
| Stock Market | Alpha Vantage | API Key | 5 req/min, 500/day |
| NASA Space | NASA API | API Key | 1000 req/hour |
| News Trends | NewsAPI.org | API Key | 100 req/day |
| Air Quality | OpenAQ | None | Unlimited |
| Economic Data | FRED API | API Key | Generous |
| Esports | Riot Games API | API Key | Rate limited but adequate |
| Research Papers | Semantic Scholar | None (basic) | Generous |

---

## Implementation Considerations

### Complexity Comparison

| Project | Pattern Complexity | API Complexity | Total |
|---------|-------------------|----------------|-------|
| Current Email Triage | Low | None | Low |
| Sports Analytics | Medium | Low (ESPN: no auth) | Low-Medium |
| Stock Market Analyzer | Medium | Low (API key) | Medium |
| NASA Space Monitor | Low | Low (API key) | Low |
| Research Paper Discovery | Medium | None/Low | Medium |

### Knowledge Base Requirements

Most alternatives need similar KB structures to current projects:

| Alternative | KB Files Needed |
|-------------|-----------------|
| Sports Analytics | `scoring-rules.md`, `position-requirements.md`, `league-settings.md` |
| Stock Market | `technical-indicators.md`, `sector-definitions.md`, `risk-profiles.md` |
| NASA Space | `event-thresholds.md`, `mission-glossary.md`, `notification-preferences.md` |

---

## Questions for Discussion

1. **Balance of practical vs. exciting:** Current projects are practical but boring. Alternatives are exciting but may feel less "real-world." Where should we land?

2. **TypeScript project:** Currently Meeting Summarizer is the only TS project. If replaced, should Sports Analytics or Stock Market be TypeScript to maintain language diversity?

3. **Scope creep risk:** Sports and finance projects could easily balloon in scope. How do we keep them workshop-achievable?

4. **Student prior knowledge:** Do we assume students know fantasy sports rules? Stock market basics? Or should projects be domain-agnostic?

---

## Next Steps

1. **Review this assessment** with workshop stakeholders
2. **Decide on replacements** (all 3 or selective)
3. **Prototype one alternative** to validate API integration and scope
4. **Update PLANNING.md** with revised project lineup
5. **Build new project-context.md files** for selected alternatives

---

## Changelog

- v1.0 (2026-03-12): Initial assessment and alternatives
