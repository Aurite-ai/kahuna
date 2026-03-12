# Reading Preferences

How I want the Research Paper Discovery agent to present and organize papers.

---

## Summary Preferences

### Abstract Summaries

When summarizing papers I haven't read, I want:

| Element | Preference |
|---------|------------|
| Length | 2-4 sentences for quick scan; expand on request |
| Focus | Main contribution, key finding, method type |
| Jargon | Okay to use ML terminology—I know the field |
| Caveats | Mention limitations if obvious from abstract |

**Good Example:**
> "This paper introduces PatchTST, which applies patching (dividing time series into subseries) before feeding into a transformer. Key insight: treating each channel independently outperforms multivariate approaches. Claims SOTA on several benchmarks but limited to forecasting (no classification)."

**Too Long:**
> "The authors present a novel approach to time series forecasting using transformers. They first discuss the limitations of existing methods, noting that attention mechanisms have quadratic complexity. They then introduce a patching mechanism, which divides the input sequence into smaller patches. This is similar to how Vision Transformers work. They also propose channel independence, meaning each variable is processed separately. They evaluate on several benchmarks including ETTh1, ETTh2, ETTm1, ETTm2, Weather, and Electricity. Results show improvements over previous methods. The code is available on GitHub."

### Full Paper Summaries

For papers I want to understand deeply, include:
- Problem statement
- Key contribution/novelty
- Method overview (high-level)
- Main results and comparisons
- Limitations and future work
- Relevance to my research

---

## Alert Thresholds

### What Warrants an Alert

| Event | Threshold | Why |
|-------|-----------|-----|
| New paper from tracked author | Any | I want to see their new work immediately |
| Highly-cited new paper in my area | > 20 citations in first 3 months | Indicates field attention |
| Paper citing my key references | From top venue + relevant keywords | Builds on work I care about |
| Survey paper in my subfield | Any from top venue | Good for literature review |

### What Doesn't Need an Alert

- New preprints without reviews (too much noise)
- Papers with tangential keyword matches
- Workshop papers (unless highly cited)
- Older papers I've likely already seen

---

## Field Priorities

### Primary Interest Areas (Always Show)

| Area | Search Terms |
|------|--------------|
| Time series transformers | transformer, attention, time series, forecasting |
| Financial ML | stock prediction, volatility, market forecasting |
| Non-stationarity | distribution shift, domain adaptation, regime |

### Secondary Interest Areas (Show If Highly Relevant)

| Area | When to Include |
|------|-----------------|
| General deep learning for time series | Only if novel architecture |
| Classical time series methods | Only if comparing to deep learning |
| Foundation models | Only if applicable to time series |

### Areas to Exclude (Unless Explicitly Asked)

| Area | Why |
|------|-----|
| NLP (unless applied to time series) | Different domain |
| Pure computer vision | Not relevant |
| Reinforcement learning | Not my focus |
| Medical time series | Different constraints |

---

## Citation Analysis Preferences

### When Exploring Citation Networks

| Direction | What I Want |
|-----------|-------------|
| Who cites this? | Filter by year (recent), venue (top-tier), citation count |
| What does this cite? | Show foundational refs I might have missed |
| Common citations | Find papers citing same sources (potential related work) |

### Author Analysis

When looking up an author:
- Publication count and h-index (credibility signal)
- Recent papers (last 2 years)
- Most-cited papers (their major contributions)
- Co-authors (network mapping)

---

## Output Format Preferences

### Paper Lists

For search results, format as:

```
📄 **[Title]**
   Authors (Year) | Venue | Citations: N
   [2-3 sentence summary]
   Relevance: [Why this matches my research]
```

### Comparison Tables

When comparing papers, use tables:

| Paper | Year | Method Type | Benchmarks | Key Claim |
|-------|------|-------------|------------|-----------|
| Paper A | 2024 | Transformer | ETT, Weather | +5% over SOTA |
| Paper B | 2023 | Linear | ETT, Weather | Simpler = better |

### Citation Networks

For citation exploration:

```
📊 **Citation Analysis: [Paper Title]**

Cited by 342 papers. Top recent citations:
• [Paper 1] (2024) - Extends the attention mechanism
• [Paper 2] (2024) - Applies to new domain

References 45 papers. Key foundations:
• [Paper A] (2017) - Original transformer
• [Paper B] (2020) - Time series baseline
```

---

## Question Handling

### Questions I Might Ask

| Question Type | Expected Response |
|---------------|-------------------|
| "Find papers on X" | Search results ranked by relevance + citations |
| "Summarize this paper" | Structured summary per my preferences |
| "Who are the key researchers in X?" | Author list with metrics and notable papers |
| "What cites X?" | Filtered citation list with context |
| "Compare A and B" | Side-by-side analysis table |
| "Is X worth reading?" | Quick assessment based on venue, citations, relevance |
| "What should I read next?" | Recommendation based on my profile and gaps |

### Response Tone

- Direct and efficient (I'm busy)
- Technical vocabulary is fine
- Skip obvious caveats ("ML is a broad field...")
- Okay to express opinions on paper quality based on metrics

---

## Integration with My Workflow

### Export Formats

When I ask to save or export:
- BibTeX for citations I want to keep
- Markdown summaries for my notes
- Plain text for quick reference

### Cross-Reference with My Profile

Always check:
- Have I already read this paper? (Don't re-summarize)
- Is this from a venue I trust?
- Does this build on papers I know?
- Does this address a gap in my reading list?

---

## Learning Over Time

### Feedback I Might Give

- "This paper wasn't relevant" → Adjust keyword matching
- "I want more like this" → Note the pattern
- "Too many results" → Tighten filters
- "Include preprints for this topic" → Override exclusion

### Seasonal Patterns

| Time Period | Adjustment |
|-------------|------------|
| Conference deadlines (Jan, May, Sep) | Expect preprint surge |
| Post-conference (Jun, Dec) | New accepted papers available |
| Summer | Fewer new publications |
