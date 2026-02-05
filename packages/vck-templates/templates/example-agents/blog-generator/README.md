# AI News Blog Post Generator

A LangGraph-based agent that fetches AI news from TechCrunch, generates blog posts with summaries and themes, and automatically creates relevant SVG diagram infographics.

## Features

- Fetches recent AI news articles from TechCrunch using NewsAPI
- Generates 500-1000 word blog posts with article summaries and overarching themes
- Automatically determines what to visualize and creates SVG diagrams
- Cites sources with links to original articles
- Saves output as markdown files with embedded SVG references

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add:

- **ANTHROPIC_API_KEY**: Get from https://console.anthropic.com/settings/keys
- **NEWS_API_KEY**: Get free API key from https://newsapi.org/register (100 requests/day)

Example `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
NEWS_API_KEY=your_newsapi_key_here
```

### 3. Run the Agent

```bash
python ai_blog_generator.py
```

## Output

The agent will create a `blog-post-results/` folder containing:

- `ai_news_blog_YYYYMMDD_HHMMSS.md` - Generated blog post in markdown format
- `diagram_*.svg` - SVG diagram files referenced in the blog post

## Project Structure

```
blog_generator/
├── ai_blog_generator.py    # Main agent workflow
├── news_fetcher.py          # NewsAPI integration
├── requirements.txt         # Python dependencies
├── .env.example             # Environment variable template
├── .env                     # Your API keys (not committed)
├── tests/                   # Test suite
│   ├── test_news_fetcher.py
│   └── test_workflow.py
└── blog-post-results/       # Generated blog posts (created on first run)
```

## How It Works

The agent uses LangGraph to orchestrate a multi-step workflow:

1. **Fetch News** - Retrieves recent TechCrunch AI articles via NewsAPI
2. **Generate Content** - Uses Claude to create blog post with article summaries
3. **Plan Diagrams** - Determines what visualizations would be valuable
4. **Generate Diagrams** - Creates SVG infographics using Claude
5. **Compile Markdown** - Assembles final document with citations
6. **Save Output** - Writes markdown and SVG files to disk

## Testing

Run the test suite:

```bash
pytest tests/
```

## Example Output

Here's what a typical run looks like:

```
======================================================================
AI BLOG POST GENERATOR WITH REAL TECHCRUNCH NEWS
======================================================================

Fetching AI news from TechCrunch...
Successfully fetched 5 articles
Generating blog post content...
Generated blog post: 'AI Takes the Wheel: From Autonomous Code to Carbon Credits'
Planning infographic diagrams...
Planned 3 diagrams
Generating SVG diagrams...
  Creating: The Evolution of AI Timeline
  Creating: GPU Market Comparison
  Creating: AI Application Sectors
Generated 3 SVG diagrams
Compiling markdown report...
Compiled markdown (9321 characters)
Saving files to blog-post-results/...
  Saved: blog-post-results/ai_news_blog_20260205_001925.md
  Saved: blog-post-results/ai_evolution_timeline.svg
  Saved: blog-post-results/gpu_market_comparison.svg
  Saved: blog-post-results/ai_application_sectors.svg

Blog post generation complete!
Output location: /home/blake/projects/langgraph-prompt-testing/blog_generator/blog-post-results
```

The generated blog post includes:
- A catchy title and introduction
- 3-5 thematic sections organizing the articles
- 2-3 embedded SVG diagrams
- A conclusion with key takeaways
- Detailed article summaries with citations and links

## Troubleshooting

### NewsAPI Rate Limit

The free tier allows 100 requests per day. If you hit the limit, wait 24 hours or upgrade your plan.

### No Articles Found

- Check that your NEWS_API_KEY is valid
- Verify you have internet connectivity
- Try a different search query or date range
- Ensure the API key has not expired

### Missing API Keys

Make sure your `.env` file exists and contains valid API keys. The agent will fail with a clear error message if keys are missing.

### Token Limit Errors

If you encounter "max_tokens" errors:
- The code is configured with 4096 max_tokens for Claude
- This should be sufficient for 5 articles
- If needed, reduce the number of articles in `ai_blog_generator.py` (line 145)

### SVG Files Not Rendering

If SVG files don't render in your markdown viewer:
- Try opening them directly in a web browser
- Verify the SVG files are valid XML
- Some markdown viewers have limited SVG support

## Advanced Usage

### Customizing Article Count

Edit `ai_blog_generator.py` line 145 to change the number of articles fetched:

```python
articles = fetcher.fetch_techcrunch_ai_news(days_back=7, max_articles=5)
```

### Changing Time Range

Modify the `days_back` parameter to fetch articles from a different time range:

```python
articles = fetcher.fetch_techcrunch_ai_news(days_back=14, max_articles=5)  # Last 2 weeks
```

### Customizing Diagram Count

Edit the `DiagramPlan` Pydantic model in `ai_blog_generator.py` to change the diagram count:

```python
diagrams: List[DiagramSpec] = Field(
    ...,
    description="List of 2-3 diagram specifications",
    min_length=2,  # Change this
    max_length=4   # Change this
)
```

## Architecture

The agent is built using:
- **LangGraph**: Workflow orchestration
- **Claude Sonnet 4.5**: Content generation and structured outputs
- **NewsAPI**: Real-time news fetching
- **Pydantic**: Structured data validation

## License

MIT
