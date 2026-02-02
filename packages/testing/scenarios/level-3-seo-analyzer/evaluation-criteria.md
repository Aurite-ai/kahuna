# Level 3: SEO Analysis Reporter - Evaluation Criteria

Use this rubric to evaluate the copilot's performance on the SEO Analysis Reporter scenario.

---

## Scoring Overview

| Category | Weight | Max Score |
|----------|--------|-----------|
| Design Decisions | 25% | 25 |
| Multi-API Integration | 20% | 20 |
| LLM Analysis Quality | 20% | 20 |
| Code Quality | 15% | 15 |
| Conversation Quality | 15% | 15 |
| Report Output | 5% | 5 |
| **Total** | **100%** | **100** |

---

## Category 1: Design Decisions (25 points)

**This is the critical differentiator for Level 3.**

### 1.1 Architecture Discussion (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Presented multiple options, explained trade-offs, made clear recommendation |
| 7 | Discussed approach but limited exploration of alternatives |
| 4 | Made design choices without discussion |
| 0 | No architecture discussion, jumped to implementation |

**Key Questions:**
- Did copilot discuss sequential vs parallel data gathering?
- Did copilot explain the rationale for their choice?
- Did copilot consider future extensibility?

### 1.2 LLM Integration Design (10 points)

| Score | Criteria |
|-------|----------|
| 10 | Thoughtful design for LLM's role - appropriate use for analysis, clear boundaries |
| 7 | Reasonable LLM integration but missing some considerations |
| 4 | LLM used but poorly integrated or overused |
| 0 | No meaningful LLM integration or severely flawed approach |

**Key Questions:**
- Is LLM used for analysis where it adds value?
- Are LLM calls structured to prevent hallucination?
- Is LLM NOT used where simple code would suffice?

### 1.3 Trade-off Acknowledgment (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Explicitly discussed trade-offs (complexity, cost, speed, reliability) |
| 3 | Some trade-off awareness |
| 0 | No trade-off discussion |

---

## Category 2: Multi-API Integration (20 points)

### 2.1 Google Search Console Integration (8 points)

| Score | Criteria |
|-------|----------|
| 8 | Correct OAuth setup, proper API calls, handles all required data |
| 6 | Working integration with minor issues |
| 4 | Basic integration but missing features or poor auth handling |
| 0 | Non-functional GSC integration |

### 2.2 SERP/DataForSEO Integration (7 points)

| Score | Criteria |
|-------|----------|
| 7 | Correct auth, appropriate endpoints, efficient data retrieval |
| 5 | Working integration with minor issues |
| 3 | Basic functionality only |
| 0 | Non-functional SERP integration |

### 2.3 Error Handling Across APIs (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Graceful handling of partial failures, meaningful error messages, retry logic |
| 3 | Some error handling but gaps in coverage |
| 1 | Minimal error handling |
| 0 | Crashes on API errors |

---

## Category 3: LLM Analysis Quality (20 points)

### 3.1 Analysis Relevance (8 points)

| Score | Criteria |
|-------|----------|
| 8 | AI insights are relevant, actionable, and based on actual data |
| 6 | Mostly relevant insights with occasional generic content |
| 4 | Mix of relevant and irrelevant analysis |
| 0 | Analysis is generic, hallucinated, or unhelpful |

### 3.2 Prompt Engineering (7 points)

| Score | Criteria |
|-------|----------|
| 7 | Well-structured prompts that ground LLM in data and prevent hallucination |
| 5 | Reasonable prompts but could be improved |
| 3 | Basic prompts with room for significant improvement |
| 0 | Poor prompts leading to unreliable output |

### 3.3 Analysis Boundaries (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Clear separation between data facts and AI interpretation |
| 3 | Mostly clear but some blurring |
| 0 | Data and speculation mixed without distinction |

---

## Category 4: Code Quality (15 points)

### 4.1 Architecture and Organization (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Clean separation of concerns, modular design, follows LangGraph patterns |
| 4 | Good organization with minor issues |
| 2 | Functional but disorganized |
| 0 | Poor structure |

### 4.2 Credential Management (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Secure credential handling, environment variables, no hardcoded secrets |
| 3 | Mostly secure with minor issues |
| 1 | Credentials exposed or poorly managed |
| 0 | Security issues with credentials |

### 4.3 Documentation (4 points)

| Score | Criteria |
|-------|----------|
| 4 | Clear setup instructions, docstrings, architecture explanation |
| 2 | Basic documentation |
| 0 | Missing documentation |

---

## Category 5: Conversation Quality (15 points)

### 5.1 Requirement Discovery (6 points)

| Score | Criteria |
|-------|----------|
| 6 | Comprehensive discovery of data sources, report needs, analysis expectations |
| 4 | Good discovery but missed some areas |
| 2 | Basic questions only |
| 0 | Minimal requirement gathering |

### 5.2 Complexity Management (5 points)

| Score | Criteria |
|-------|----------|
| 5 | Broke down complex problem, managed scope, checked understanding |
| 3 | Some complexity management |
| 1 | Overwhelmed user with complexity |
| 0 | Failed to manage complexity |

### 5.3 User Education (4 points)

| Score | Criteria |
|-------|----------|
| 4 | Helped user understand the solution, explained technical decisions clearly |
| 2 | Some explanation |
| 0 | No explanation or confusing explanations |

---

## Category 6: Report Output (5 points)

### 6.1 Report Completeness (3 points)

| Score | Criteria |
|-------|----------|
| 3 | All required sections present (summary, data, analysis, recommendations) |
| 2 | Most sections present |
| 1 | Partial report |
| 0 | Minimal or no report |

### 6.2 Report Quality (2 points)

| Score | Criteria |
|-------|----------|
| 2 | Well-formatted, clear, appropriate for non-technical audience |
| 1 | Readable but could be improved |
| 0 | Poor formatting or confusing |

---

## Quick Evaluation Checklist

Use this for rapid pass/fail assessment:

### Must Pass (Automatic Fail if Not Met)
- [ ] Agent retrieves data from at least one external API
- [ ] Agent generates some form of report
- [ ] Copilot discussed approach before implementation
- [ ] Credentials not hardcoded in source
- [ ] Agent doesn't crash on basic usage

### Should Pass (Strong Indicator of Quality)
- [ ] Both GSC and SERP data integrated
- [ ] LLM generates meaningful analysis
- [ ] Design trade-offs discussed
- [ ] Partial failure handling implemented
- [ ] Report has executive summary and recommendations

### Nice to Have (Bonus Points)
- [ ] Perplexity integration for enhanced analysis
- [ ] Parallel data fetching
- [ ] Caching for development/testing
- [ ] Multi-site support
- [ ] Export to multiple formats

---

## Design Decision Deep Dive

### Architecture Patterns to Look For

**Good: Sequential with Clear Phases**
```
Data Collection → Data Processing → LLM Analysis → Report Generation
```
- Clear, debuggable
- Easy to understand where failures occur
- Good for initial implementation

**Good: Parallel Data Gathering**
```
┌─ GSC Tool ─────┐
│                │──▶ Merge → LLM Analysis → Report
└─ SERP Tool ────┘
```
- Faster execution
- More complex error handling
- Better when APIs are slow

**Good: Iterative Analysis**
```
Initial Data → LLM Identifies Gaps → Additional Queries → Final Analysis
```
- Most intelligent
- LLM guides the data gathering
- Most complex to implement correctly

**Red Flag: Unstructured**
- No clear data flow
- LLM called randomly throughout
- Unclear where data comes from

### LLM Integration Patterns

**Good: Analysis Tool**
```python
@tool
def analyze_seo_trends(gsc_data: dict, serp_data: dict) -> dict:
    """Analyze SEO data and return structured insights."""
    # Clear input/output contract
    # LLM grounded in actual data
```

**Good: Structured Prompts**
```
Given this data: {data}
Identify:
1. Top 3 opportunities
2. Top 3 risks
3. Recommended actions

Base all insights on the provided data only.
```

**Red Flag: Vague Prompts**
```
Write an SEO analysis.  # No data, no structure
```

**Red Flag: Over-reliance**
```
Let the LLM decide what data to fetch.  # Too much autonomy
```

---

## Sample Evaluation Notes Template

```markdown
# Evaluation: Level 3 SEO Analysis Reporter

**Date:** YYYY-MM-DD
**Copilot Config:** [config name]
**Evaluator:** [name]

## Scores

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| Design Decisions | | 25 | |
| Multi-API Integration | | 20 | |
| LLM Analysis Quality | | 20 | |
| Code Quality | | 15 | |
| Conversation Quality | | 15 | |
| Report Output | | 5 | |
| **Total** | | **100** | |

## Design Discussion Summary

**Architecture Chosen:** [Sequential/Parallel/Iterative/Other]

**Trade-offs Discussed:**
-

**LLM Role:**
-

## API Integration Notes

**GSC Status:** Working / Partial / Not Working
**SERP Status:** Working / Partial / Not Working
**Error Handling:**

## LLM Analysis Assessment

**Prompt Quality:**
**Output Relevance:**
**Hallucination Issues:** Yes / No

## Conversation Summary

**Turns to Complete:**
**Design Discussion Quality:**
**User Guidance Quality:**

## Test Results

| Test | Result |
|------|--------|
| Basic report generation | |
| GSC data retrieval | |
| SERP data retrieval | |
| AI analysis quality | |
| Partial failure handling | |
| Credential security | |

## Strengths

-

## Weaknesses

-

## Design Decision Quality

**Did copilot:**
- [ ] Present architecture options
- [ ] Explain trade-offs
- [ ] Get buy-in before proceeding
- [ ] Consider extensibility

## Recommendations

[What should be improved in the copilot configuration?]
```

---

## Grade Interpretation

| Total Score | Grade | Interpretation |
|-------------|-------|----------------|
| 90-100 | A | Excellent - Strong design thinking and execution |
| 80-89 | B | Good - Solid approach with minor gaps |
| 70-79 | C | Acceptable - Functional but design decisions weak |
| 60-69 | D | Below expectations - Missing key capabilities |
| <60 | F | Failing - Unable to handle complexity |

---

## Level 3 Specific Notes

### What Makes Level 3 Different

Level 3 is distinguished from Levels 1-2 by:

1. **Design complexity** - Multiple valid approaches exist, copilot must choose wisely
2. **Integration complexity** - Multiple APIs with different auth methods
3. **LLM integration** - Not just using LLM for output, but for analysis
4. **Conversation depth** - Requires multiple rounds of clarification
5. **Error handling** - Must handle partial failures gracefully

### Evaluator Mindset

When evaluating Level 3, ask:
- Would I trust this copilot as a technical collaborator?
- Did the copilot make reasonable engineering decisions?
- Could a junior developer follow this copilot's guidance?
- Is the resulting system maintainable and extensible?

### Common Level 3 Failure Modes

1. **Analysis paralysis** - Too much discussion, no implementation
2. **Premature implementation** - No discussion, jumps to code
3. **Over-engineering** - Unnecessary abstractions and complexity
4. **Under-engineering** - Messy code that "just works"
5. **LLM hallucination** - Analysis not grounded in data
6. **Integration fragility** - Crashes when one API fails
