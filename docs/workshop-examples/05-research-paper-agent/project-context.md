# Business Context

**User:** Graduate Student Researcher
**Purpose:** Discover relevant papers, track citations, identify key researchers, and stay current with literature

## Pre-Workshop Setup

**API Key:** No API key required for basic access!

Semantic Scholar provides generous unauthenticated access:
- 100 requests per 5 minutes (shared pool)
- No registration needed to start

**Optional (for heavy usage):** Request an API key at https://www.semanticscholar.org/product/api for higher rate limits (1 request/second dedicated).

## Background

I'm a graduate student working on my thesis in machine learning. Literature review is a constant challenge:
- Finding relevant papers takes hours of manual searching
- I miss important new publications in my area
- Tracking citation chains is tedious but essential
- I can't easily identify who the key researchers are in a subfield
- Papers I've read get forgotten without good notes

I want an agent that understands my research focus and helps me discover, summarize, and track papers—like having a research librarian who knows my work intimately.

## Why This Project?

**For Data Analytics Students:** This project directly applies to your academic work. You'll build a tool you can actually use for your own research while learning core NLP and information retrieval concepts.

| Learning Focus | Data Analytics Connection |
|----------------|--------------------------|
| Information Retrieval | Searching and ranking documents by relevance |
| Text Summarization | Extracting key findings from abstracts |
| Citation Network Analysis | Graph-based analysis of paper relationships |
| Entity Extraction | Identifying authors, institutions, topics |
| Threshold Alerting | "High-impact paper" detection based on citations |

**API Pattern:** Semantic Scholar uses optional API key authentication. Basic access requires no setup—just start making requests. This "freemium" pattern is common in research APIs.

## Pain Points

| Pain Point | Impact |
|------------|--------|
| Information overload | Thousands of papers; hard to find what's relevant |
| Missing recent work | New papers published daily; easy to fall behind |
| Citation chain navigation | Manually clicking through references is slow |
| No personalization | Generic search doesn't know my specific focus |
| Forgotten readings | Papers I read months ago fade from memory |

## Goals

- Discover papers relevant to my specific research topic
- Get concise summaries of papers without reading full PDFs
- Track citation chains (who cites this? what does it cite?)
- Identify highly-cited foundational papers in my area
- Find active researchers working on similar problems
- Get alerts when influential new papers appear

## Allowed Services

This agent MAY use:

- **Semantic Scholar API** (https://api.semanticscholar.org/)
  - Search papers by keywords and filters
  - Get paper details (title, abstract, citations, authors)
  - Navigate citation graphs (references and citations)
  - Retrieve author information and publication history
  - **No API key required** for basic access
  - 100 requests/5 minutes (unauthenticated)

This agent may NOT:

- Download full paper PDFs (copyright restrictions)
- Access paywalled content
- Store paper content beyond summaries
- Make claims about paper quality beyond citation metrics

## Semantic Scholar API Reference

### Paper Search - Find Relevant Papers

Search papers by query keywords with optional filters.

```
GET https://api.semanticscholar.org/graph/v1/paper/search
    ?query=transformer+time+series+forecasting
    &fields=paperId,title,abstract,year,citationCount,authors
    &limit=10
```

**Parameters:**
- `query`: Search terms (URL-encoded)
- `fields`: Comma-separated fields to return
- `limit`: Max results (up to 100)
- `year`: Filter by publication year (e.g., `2023-2024`)
- `minCitationCount`: Filter by minimum citations

**Response:**
```json
{
  "total": 1250,
  "data": [
    {
      "paperId": "abc123def456",
      "title": "Transformers for Time Series: A Survey",
      "abstract": "Time series forecasting is critical for many applications...",
      "year": 2024,
      "citationCount": 89,
      "authors": [
        {"authorId": "12345", "name": "Jane Smith"},
        {"authorId": "67890", "name": "John Doe"}
      ]
    }
  ]
}
```

### Paper Details - Get Full Information

Retrieve detailed information about a specific paper.

```
GET https://api.semanticscholar.org/graph/v1/paper/{paper_id}
    ?fields=title,abstract,year,citationCount,referenceCount,authors,venue,url
```

**Paper ID Formats:**
- Semantic Scholar ID: `abc123def456`
- DOI: `DOI:10.1234/example.2024.001`
- arXiv: `arXiv:2301.12345`
- URL: `URL:https://arxiv.org/abs/2301.12345`

**Response:**
```json
{
  "paperId": "abc123def456",
  "title": "Attention Is All You Need",
  "abstract": "The dominant sequence transduction models are based on...",
  "year": 2017,
  "citationCount": 95000,
  "referenceCount": 42,
  "venue": "NeurIPS",
  "url": "https://www.semanticscholar.org/paper/abc123def456",
  "authors": [
    {"authorId": "12345", "name": "Ashish Vaswani"},
    {"authorId": "67890", "name": "Noam Shazeer"}
  ]
}
```

### Citations - Papers Citing This Work

Find papers that cite a given paper.

```
GET https://api.semanticscholar.org/graph/v1/paper/{paper_id}/citations
    ?fields=paperId,title,year,citationCount,authors
    &limit=20
```

**Response:**
```json
{
  "data": [
    {
      "citingPaper": {
        "paperId": "xyz789",
        "title": "BERT: Pre-training of Deep Bidirectional Transformers",
        "year": 2019,
        "citationCount": 75000,
        "authors": [{"authorId": "111", "name": "Jacob Devlin"}]
      }
    }
  ]
}
```

### References - Papers This Work Cites

Find papers referenced by a given paper.

```
GET https://api.semanticscholar.org/graph/v1/paper/{paper_id}/references
    ?fields=paperId,title,year,citationCount,authors
    &limit=20
```

**Response:**
```json
{
  "data": [
    {
      "citedPaper": {
        "paperId": "ref123",
        "title": "Neural Machine Translation by Jointly Learning to Align and Translate",
        "year": 2015,
        "citationCount": 28000,
        "authors": [{"authorId": "222", "name": "Dzmitry Bahdanau"}]
      }
    }
  ]
}
```

### Author Details - Researcher Information

Get information about an author and their publications.

```
GET https://api.semanticscholar.org/graph/v1/author/{author_id}
    ?fields=name,paperCount,citationCount,hIndex,papers.title,papers.year
```

**Response:**
```json
{
  "authorId": "12345",
  "name": "Yoshua Bengio",
  "paperCount": 850,
  "citationCount": 450000,
  "hIndex": 150,
  "papers": [
    {"paperId": "paper1", "title": "Deep Learning", "year": 2016},
    {"paperId": "paper2", "title": "Attention for Neural Networks", "year": 2015}
  ]
}
```

## Technical Stack

- **Framework:** LangGraph - Python
- **LLM:** Claude via Anthropic API
- **External API:** Semantic Scholar (REST, no auth required)
- **HTTP Client:** requests or httpx
- See `.claude/rules/langgraph.md` for development patterns

## Sample Interaction

```
User: "Find recent papers on transformers for time series forecasting"

Agent:
1. Reads user's research profile from KB (focus: ML for forecasting)
2. Searches Semantic Scholar with query + year filter
3. Ranks results by relevance and citation count
4. Checks if any papers are from user's preferred venues
5. Summarizes top findings:

"📚 **Paper Search: Transformers for Time Series**

Found 1,250+ papers. Here are the top 5 most relevant recent works:

**Highly Cited (250+ citations):**
• "Are Transformers Effective for Time Series Forecasting?"
  - Wu et al., AAAI 2023 (342 citations)
  - Key finding: Simple linear models can outperform transformers
    on many benchmarks—challenges assumptions in the field.

• "PatchTST: A Time Series is Worth 64 Words"
  - Nie et al., ICLR 2023 (289 citations)
  - Key finding: Patching + channel independence improves
    transformer performance significantly.

**Recent & Promising:**
• "TimeMixer: Decomposable Multiscale Mixing for Time Series"
  - Wang et al., ICLR 2024 (47 citations)
  - Key finding: Multi-scale mixing outperforms single-scale approaches.

**From Your Preferred Venues:**
• "iTransformer: Inverted Transformers Are Effective for Time Series"
  - Liu et al., NeurIPS 2024 (28 citations)
  - Note: This is from NeurIPS, which you track.

**Foundational Paper You Might Have Missed:**
• "Informer: Beyond Efficient Transformer for Long Sequence"
  - Zhou et al., AAAI 2021 (1,850 citations)
  - This is heavily cited by the papers above—worth reading if
    you haven't already.

Want me to show citations for any of these, or find the key authors?"
```

## Example Python Code

```python
import requests

BASE_URL = "https://api.semanticscholar.org/graph/v1"

# Optional: Add API key for higher rate limits
HEADERS = {}
# HEADERS = {"x-api-key": "YOUR_API_KEY"}  # Uncomment if you have a key

def search_papers(query: str, limit: int = 10, year: str = None) -> list:
    """Search for papers by keyword query."""
    params = {
        "query": query,
        "fields": "paperId,title,abstract,year,citationCount,authors,venue",
        "limit": limit
    }
    if year:
        params["year"] = year

    response = requests.get(
        f"{BASE_URL}/paper/search",
        params=params,
        headers=HEADERS
    )
    data = response.json()

    papers = []
    for paper in data.get("data", []):
        papers.append({
            "id": paper.get("paperId"),
            "title": paper.get("title"),
            "abstract": paper.get("abstract", "")[:500],  # Truncate
            "year": paper.get("year"),
            "citations": paper.get("citationCount", 0),
            "venue": paper.get("venue"),
            "authors": [a["name"] for a in paper.get("authors", [])]
        })
    return papers

def get_paper_details(paper_id: str) -> dict:
    """Get detailed information about a specific paper."""
    params = {
        "fields": "title,abstract,year,citationCount,referenceCount,authors,venue,url"
    }
    response = requests.get(
        f"{BASE_URL}/paper/{paper_id}",
        params=params,
        headers=HEADERS
    )
    return response.json()

def get_citations(paper_id: str, limit: int = 20) -> list:
    """Get papers that cite the given paper."""
    params = {
        "fields": "paperId,title,year,citationCount,authors",
        "limit": limit
    }
    response = requests.get(
        f"{BASE_URL}/paper/{paper_id}/citations",
        params=params,
        headers=HEADERS
    )
    data = response.json()

    return [
        {
            "id": item["citingPaper"]["paperId"],
            "title": item["citingPaper"]["title"],
            "year": item["citingPaper"].get("year"),
            "citations": item["citingPaper"].get("citationCount", 0)
        }
        for item in data.get("data", [])
    ]

def get_references(paper_id: str, limit: int = 20) -> list:
    """Get papers that the given paper cites."""
    params = {
        "fields": "paperId,title,year,citationCount,authors",
        "limit": limit
    }
    response = requests.get(
        f"{BASE_URL}/paper/{paper_id}/references",
        params=params,
        headers=HEADERS
    )
    data = response.json()

    return [
        {
            "id": item["citedPaper"]["paperId"],
            "title": item["citedPaper"]["title"],
            "year": item["citedPaper"].get("year"),
            "citations": item["citedPaper"].get("citationCount", 0)
        }
        for item in data.get("data", [])
    ]

def get_author_info(author_id: str) -> dict:
    """Get information about an author."""
    params = {
        "fields": "name,paperCount,citationCount,hIndex"
    }
    response = requests.get(
        f"{BASE_URL}/author/{author_id}",
        params=params,
        headers=HEADERS
    )
    return response.json()

# Example usage
if __name__ == "__main__":
    # Search for papers
    papers = search_papers("transformer time series", limit=5, year="2023-2024")
    print(f"Found {len(papers)} papers:\n")

    for paper in papers:
        print(f"• {paper['title']}")
        print(f"  {paper['year']} | {paper['citations']} citations | {paper['venue']}")
        print(f"  Authors: {', '.join(paper['authors'][:3])}")
        print()

    # Get citations for the first paper
    if papers:
        citations = get_citations(papers[0]["id"], limit=5)
        print(f"\nTop papers citing '{papers[0]['title']}':")
        for cite in citations:
            print(f"  • {cite['title']} ({cite['year']}) - {cite['citations']} citations")
```

## Knowledge Base Files

| File | Purpose |
|------|---------|
| `research-profile.md` | User's research topic, key papers read, preferred venues |
| `reading-preferences.md` | Summary length, citation thresholds, field priorities |
