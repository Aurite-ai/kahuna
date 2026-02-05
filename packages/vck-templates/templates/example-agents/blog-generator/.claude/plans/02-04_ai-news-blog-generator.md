# Implementation Plan: AI News Blog Post Generator

**Type:** Agent Development
**Date:** 2026-02-04
**Framework:** LangGraph

## Goal

Create a LangGraph-based agent that fetches AI news from TechCrunch, generates blog posts with summaries and overarching themes, automatically creates relevant SVG diagram infographics, and saves the results as markdown files in the blog-post-results folder.

## Requirements

### Functional Requirements

- Fetch AI news articles from TechCrunch using a free news API
- Generate 500-1000 word blog posts with short article summaries and overarching themes
- Automatically determine what to visualize and create appropriate SVG diagrams
- Cite sources with links to original articles
- Save output as standard markdown files with embedded SVG references
- Run on-demand (not scheduled)

### Integration Requirements

- **Input:** On-demand execution, optionally with topic focus
- **Output:** Markdown blog post file and SVG diagram files in blog-post-results folder
- **External Systems:**
  - NewsAPI or similar free news API for TechCrunch articles
  - Anthropic Claude API for content generation

### Credentials Required

- Anthropic API key (for Claude) - Expected in environment variables
- NewsAPI key (free tier) - Expected in environment variables

## Implementation Steps

The existing `/home/blake/projects/langgraph-prompt-testing/claude_blog/ai_blog_generator.py` provides an excellent foundation. This implementation will adapt that pattern to integrate real news fetching.

### Phase 1: Project Setup and Dependencies

1. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/requirements.txt` with dependencies:
   - langchain-anthropic>=0.1.0
   - langgraph>=0.2.0
   - pydantic>=2.0.0
   - typing-extensions>=4.0.0
   - requests>=2.31.0 (for API calls)
   - python-dotenv>=1.0.0 (for environment variables)

2. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/.env.example` documenting required environment variables

3. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/README.md` with setup instructions

**Verification:** Run `pip install -r requirements.txt` successfully

### Phase 2: News Fetching Integration

4. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/news_fetcher.py` with functions to:
   - Initialize NewsAPI client (or alternative free API)
   - Fetch recent TechCrunch AI articles
   - Parse and structure article data (title, URL, description, published date)
   - Handle API errors gracefully

5. Update state schema to include:
   - `fetched_articles`: List of article objects with metadata
   - `article_sources`: List of source URLs for citations

6. Create `fetch_news_node` that:
   - Calls the news fetcher
   - Filters for TechCrunch AI category articles
   - Stores articles in state
   - Handles case when no articles are found

**Verification:** Test news_fetcher.py independently with a simple test script that prints fetched articles

### Phase 3: Content Generation with Real Data

7. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/ai_blog_generator.py` adapting the existing pattern

8. Define Pydantic models for structured outputs:
   - `ArticleSummary`: Individual article summary with title, key points, source URL
   - `BlogContent`: Blog post structure with title, introduction, sections (each containing article summaries), conclusion, and overarching theme
   - `DiagramSpec`: Specification for diagrams to generate
   - `SVGDiagram`: Generated SVG with metadata

9. Implement `generate_content_node` that:
   - Takes fetched articles from state
   - Uses Claude with structured output to generate blog post
   - Includes article summaries with themes
   - Embeds source citations inline
   - Ensures 500-1000 word target

**Verification:** Run the agent with mock article data to verify content generation works

### Phase 4: SVG Diagram Generation

10. Implement `plan_diagrams_node` that:
    - Analyzes blog content
    - Uses Claude to automatically determine what visualizations would be valuable
    - Creates diagram specifications (timeline, comparison charts, concept diagrams, etc.)

11. Implement `generate_diagrams_node` that:
    - Takes diagram specifications
    - Uses Claude to generate SVG code for each diagram
    - Ensures SVG code is valid and properly formatted
    - Stores SVG in state

**Verification:** Check that generated SVG files are valid and render correctly in a browser

### Phase 5: Markdown Compilation and File Output

12. Implement `compile_markdown_node` that:
    - Builds markdown structure with proper heading hierarchy
    - Embeds article citations as markdown links
    - References SVG diagrams with markdown image syntax
    - Includes source attribution section

13. Implement `save_output_node` that:
    - Ensures blog-post-results directory exists
    - Saves markdown file with timestamp in filename
    - Saves all SVG diagram files
    - Prints output location

**Verification:** Inspect generated markdown and SVG files to ensure proper formatting and valid content

### Phase 6: LangGraph Workflow Construction

14. Define `BlogGeneratorState` TypedDict with all required state fields

15. Build the LangGraph workflow:
    - Add nodes: fetch_news, generate_content, plan_diagrams, generate_diagrams, compile_markdown, save_output
    - Add edges creating linear workflow: START → fetch_news → generate_content → plan_diagrams → generate_diagrams → compile_markdown → save_output → END
    - Compile graph

16. Add main execution block with:
    - Graph initialization
    - Initial state setup
    - Graph invocation
    - Summary output

**Verification:** Run complete workflow end-to-end and verify blog post is generated in blog-post-results

### Phase 7: Testing and Error Handling

17. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/tests/test_news_fetcher.py` testing:
    - Successful API calls
    - Error handling for API failures
    - Data parsing correctness

18. Create `/home/blake/projects/langgraph-prompt-testing/blog_generator/tests/test_workflow.py` testing:
    - Complete workflow execution
    - File output verification
    - SVG validity

19. Add error handling throughout:
    - API rate limit handling
    - Network error retry logic
    - Graceful degradation when no articles found

**Verification:** Run test suite with `pytest` and ensure all tests pass

### Phase 8: Documentation and Usage Instructions

20. Update README.md with:
    - Complete setup instructions
    - Environment variable configuration
    - How to run the agent
    - Example output
    - Troubleshooting section

21. Add inline code documentation and docstrings

**Verification:** Follow README instructions from scratch to verify completeness

## Testing Strategy

Testing will focus on happy paths and meaningful verification:

1. **Unit Tests** (tests/test_news_fetcher.py):
   - Test API integration with mocked responses
   - Verify article data parsing

2. **Integration Tests** (tests/test_workflow.py):
   - Test complete workflow execution
   - Verify markdown file creation
   - Verify SVG file creation
   - Check content quality (proper citations, valid SVG)

3. **Manual Testing**:
   - Run agent and inspect generated blog post
   - Verify SVG diagrams render in browser
   - Check that sources are properly cited
   - Validate blog post meets 500-1000 word target

## Technical Architecture

### LangGraph Workflow

```
START
  ↓
fetch_news (fetch articles from NewsAPI)
  ↓
generate_content (create blog post with Claude)
  ↓
plan_diagrams (determine what to visualize)
  ↓
generate_diagrams (create SVG graphics)
  ↓
compile_markdown (assemble final document)
  ↓
save_output (write files to disk)
  ↓
END
```

### State Schema

```python
class BlogGeneratorState(TypedDict):
    # News fetching
    fetched_articles: list[dict]
    article_sources: list[str]

    # Content generation
    blog_title: str
    blog_introduction: str
    blog_sections: list[dict]
    blog_conclusion: str
    overarching_theme: str

    # Diagrams
    diagram_plans: list[dict]
    generated_diagrams: Annotated[list[dict], operator.add]

    # Output
    final_markdown: str
    output_path: str

    # Metadata
    step_count: int
    errors: list[str]
```

### Key Design Decisions

- **News Source**: Using NewsAPI (free tier: 100 requests/day) filtering for TechCrunch + AI keywords
- **LLM**: Claude Sonnet 4.5 with structured outputs for consistent, high-quality generation
- **SVG Generation**: Delegating diagram creation to Claude with specific prompts for different diagram types
- **File Naming**: Using timestamps to avoid overwriting previous blog posts
- **Error Handling**: Graceful degradation - if news fetch fails, workflow stops early with clear error message

## Changelog

- v1.0 (2026-02-04): Initial plan
