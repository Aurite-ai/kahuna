# Level 2: Stock Market Reporter - Evaluation Criteria

Use this rubric to evaluate the copilot's performance on the Stock Market Reporter scenario.

---

## Scoring Overview

| Category | Weight | Max Score |
|----------|--------|-----------|
| Technical Correctness | 25% | 25 |
| Tool Selection Intelligence | 25% | 25 |
| API Integration | 20% | 20 |
| Code Quality | 15% | 15 |
| Conversation Quality | 15% | 15 |
| **Total** | **100%** | **100** |

---

## Category 1: Technical Correctness (25 points)

### 1.1 Agent Runs Successfully (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Agent runs, fetches stock data, generates report without errors |
| 7 | Agent runs with minor warnings but produces correct output |
| 4 | Agent runs but output has issues (missing data, formatting problems) |
| 0 | Agent fails to start or crashes during execution |

### 1.2 Data Accuracy (10 points)

| Score | Criteria |
|-------|----------|
| 10 | All stock data matches Yahoo Finance values (within market delay tolerance) |
| 7 | Most data accurate, minor discrepancies |
| 4 | Some data correct but notable errors |
| 0 | Data is incorrect or fabricated |

### 1.3 Report Format (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Clean markdown with table, summary, and proper formatting |
| 3 | Readable markdown but missing some elements |
| 1 | Poor formatting or hard to read |
| 0 | No formatted output |

---

## Category 2: Tool Selection Intelligence (25 points)

**This is the critical differentiator for Level 2.**

### 2.1 Correct Tool for API Calls (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Uses tool for stock data retrieval |
| 5 | Uses tool but with suboptimal design (e.g., single stock per call) |
| 0 | No tool for API access (hardcoded data or wrong approach) |

### 2.2 NO Tool for Markdown Generation (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Markdown generated directly by LLM without unnecessary tool |
| 5 | Has markdown tool but doesn't use it unnecessarily |
| 0 | Creates and uses tool for markdown formatting (over-engineering) |

### 2.3 Tool Design Quality (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Clean tool interface, appropriate parameters, good return structure |
| 3 | Functional but could be cleaner |
| 1 | Works but poor design |
| 0 | Non-functional tool |

---

## Category 3: API Integration (20 points)

### 3.1 Library Selection (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Uses yfinance (correct for requirements - free, no key) |
| 3 | Uses alternative free API (may need more setup) |
| 1 | Uses paid API without discussing with user |
| 0 | No working API integration |

### 3.2 Error Handling (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Gracefully handles invalid tickers, rate limits, network errors |
| 7 | Handles some errors but not all edge cases |
| 4 | Basic error handling only |
| 0 | Crashes on any error |

### 3.3 Data Extraction (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Extracts all required fields (price, change, volume, high/low) |
| 3 | Extracts most fields |
| 1 | Minimal data extraction |
| 0 | Cannot extract data |

---

## Category 4: Code Quality (15 points)

### 4.1 Code Structure (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Clean organization, follows LangGraph patterns, modular |
| 4 | Good structure with minor issues |
| 2 | Functional but disorganized |
| 0 | Poor structure |

### 4.2 Documentation (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Clear docstrings, comments, README with usage |
| 3 | Basic documentation |
| 1 | Minimal documentation |
| 0 | No documentation |

### 4.3 Configurability (4 points)

| Score | Criteria |
|-------|----------|
| 4 | Easy to change tickers, customizable output |
| 2 | Some configurability |
| 0 | Hardcoded values throughout |

---

## Category 5: Conversation Quality (15 points)

### 5.1 Requirement Discovery (6 points)

Did the copilot ask about:
- Which stocks to track?
- Desired output format?
- API/data source preferences?
- How to handle errors?

| Score | Criteria |
|-------|----------|
| 6 | Comprehensive requirement gathering through natural conversation |
| 4 | Asked some questions but missed areas |
| 2 | Minimal questions |
| 0 | No clarifying questions |

### 5.2 API Guidance (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Explained yfinance choice, mentioned free/no-key benefit, noted limitations |
| 3 | Recommended library with partial explanation |
| 1 | Just used a library without explanation |
| 0 | Poor or no guidance |

### 5.3 User Education (4 points)

| Score | Criteria |
|-------|----------|
| 4 | Helped user understand the solution, explained decisions |
| 2 | Some explanation |
| 0 | No explanation of implementation |

---

## Quick Evaluation Checklist

Use this for rapid pass/fail assessment:

### Must Pass (Automatic Fail if Not Met)
- [ ] Agent fetches real stock data
- [ ] Agent generates readable report
- [ ] Uses tool for API calls
- [ ] Does NOT use unnecessary tool for markdown
- [ ] Handles at least one error case (invalid ticker)

### Should Pass (Strong Indicator of Quality)
- [ ] Uses yfinance (free, no key)
- [ ] Report includes all required data points
- [ ] Copilot asked clarifying questions
- [ ] Clean tool design with good return structure
- [ ] Error handling for network/API issues

### Nice to Have (Bonus Points)
- [ ] Batch fetching for multiple tickers
- [ ] Market hours awareness
- [ ] Caching during development
- [ ] Extensible design for adding features
- [ ] Rate limiting protection

---

## Tool Selection Deep Dive

This is the key differentiator for Level 2. Evaluate carefully:

### What to Look For

**Good Pattern:**
```
User Request → Tool Call (get_stock_data) → LLM formats markdown response
```

**Bad Pattern:**
```
User Request → Tool Call (get_stock_data) → Tool Call (format_markdown) → Response
```

### Why This Matters

1. **Efficiency:** LLMs can format text natively - no tool needed
2. **Flexibility:** LLM can adapt formatting based on context
3. **Simplicity:** Fewer tools = simpler system
4. **Understanding:** Shows copilot understands what tools are FOR

### Evaluation Questions

Ask yourself:
- Did the copilot create a markdown tool? (Red flag)
- Did the copilot explain why markdown doesn't need a tool? (Green flag)
- Did the copilot batch API requests efficiently? (Green flag)
- Did the copilot make single API calls per ticker? (Yellow flag - inefficient)

---

## Sample Evaluation Notes Template

```markdown
# Evaluation: Level 2 Stock Market Reporter

**Date:** YYYY-MM-DD
**Copilot Config:** [config name]
**Evaluator:** [name]

## Scores

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Technical Correctness | | 25 | |
| Tool Selection Intelligence | | 25 | |
| API Integration | | 20 | |
| Code Quality | | 15 | |
| Conversation Quality | | 15 | |
| **Total** | | **100** | |

## Tool Selection Analysis

**Tools Created:**
-

**Tool Usage Pattern:**
-

**Did copilot create unnecessary markdown tool?** Yes / No

## API Integration Notes

**Library Used:**
**Fields Extracted:**
**Error Handling:**

## Test Results

| Test | Result |
|------|--------|
| Default tickers report | |
| Custom tickers (TSLA, META) | |
| Invalid ticker handling | |
| Report format quality | |

## Conversation Summary

[Brief description of requirement gathering]

## Strengths

-

## Weaknesses

-

## Recommendations

[What should be improved in the copilot configuration?]
```

---

## Grade Interpretation

| Total Score | Grade | Interpretation |
|-------------|-------|----------------|
| 90-100 | A | Excellent - Strong tool selection intelligence |
| 80-89 | B | Good - Correct approach with minor issues |
| 70-79 | C | Acceptable - Some tool selection issues |
| 60-69 | D | Below expectations - Created unnecessary tools |
| <60 | F | Failing - Major misunderstanding of tool purpose |
