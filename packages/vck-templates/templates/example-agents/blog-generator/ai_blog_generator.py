"""
AI Blog Post Generator with Real TechCrunch News and SVG Diagrams
A LangGraph workflow that fetches AI news, generates blog content,
creates SVG infographics, and outputs a markdown report.
"""

import operator
import os
from typing import Annotated, List, Dict
from typing_extensions import TypedDict
from pathlib import Path
from datetime import datetime

from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv

from news_fetcher import NewsFetcher, NewsAPIError

# Load environment variables
load_dotenv()


# ============================================================================
# Step 1: Define Pydantic models for structured outputs
# ============================================================================

class ArticleSummary(BaseModel):
    """Summary of a single news article."""
    title: str = Field(..., description="Article title")
    key_points: List[str] = Field(
        ...,
        description="2-3 key points from the article",
        min_length=2,
        max_length=3
    )
    source_url: str = Field(..., description="URL to the original article")


class BlogSection(BaseModel):
    """A section of the blog post."""
    heading: str = Field(..., description="Section heading/title")
    content: str = Field(..., description="Section content text with article summaries")
    article_citations: List[str] = Field(
        ...,
        description="List of article titles cited in this section"
    )


class BlogContent(BaseModel):
    """Generated blog post content with real article summaries."""
    title: str = Field(..., description="Catchy blog post title")
    introduction: str = Field(..., description="Engaging introduction paragraph")
    overarching_theme: str = Field(..., description="The main theme connecting all articles")
    sections: List[BlogSection] = Field(
        ...,
        description="List of blog sections covering different aspects",
        min_length=3,
        max_length=5
    )
    conclusion: str = Field(..., description="Concluding paragraph with key takeaways")
    article_summaries: List[ArticleSummary] = Field(
        ...,
        description="Detailed summaries of each article cited"
    )


class DiagramSpec(BaseModel):
    """Specification for a single diagram."""
    id: str = Field(..., description="Unique identifier (e.g., 'diagram_1', 'timeline')")
    title: str = Field(..., description="Diagram title")
    description: str = Field(..., description="What the diagram should visualize")
    section: str = Field(..., description="Which blog section heading this relates to")


class DiagramPlan(BaseModel):
    """Plan for SVG diagrams to include in the blog."""
    diagrams: List[DiagramSpec] = Field(
        ...,
        description="List of 2-3 diagram specifications",
        min_length=2,
        max_length=3
    )


class SVGDiagram(BaseModel):
    """An SVG diagram with metadata."""
    diagram_id: str = Field(..., description="Unique identifier for the diagram")
    title: str = Field(..., description="Title of the diagram")
    svg_code: str = Field(..., description="Complete SVG markup code")


# ============================================================================
# Step 2: Define State
# ============================================================================

class BlogGeneratorState(TypedDict):
    """State for the blog generator workflow."""
    # News fetching
    fetched_articles: List[Dict[str, str]]
    article_sources: List[str]

    # Content generation
    blog_title: str
    blog_introduction: str
    blog_sections: List[Dict[str, any]]
    blog_conclusion: str
    overarching_theme: str
    article_summaries: List[Dict[str, any]]

    # Diagrams
    diagram_plans: List[Dict[str, str]]
    generated_diagrams: Annotated[List[Dict[str, str]], operator.add]

    # Output
    final_markdown: str
    output_path: str

    # Metadata
    step_count: int
    errors: List[str]


# ============================================================================
# Step 3: Initialize LLM
# ============================================================================

model = ChatAnthropic(
    model="claude-sonnet-4-5-20250929",
    temperature=0.7,
    max_tokens=4096
)


# ============================================================================
# Step 4: Define Node Functions
# ============================================================================

def fetch_news_node(state: BlogGeneratorState) -> dict:
    """Fetch AI news articles from TechCrunch using NewsAPI."""

    print("Fetching AI news from TechCrunch...")

    try:
        fetcher = NewsFetcher()
        articles = fetcher.fetch_techcrunch_ai_news(days_back=7, max_articles=5)

        if not articles:
            error_msg = "No articles found from TechCrunch"
            print(f"Error: {error_msg}")
            return {
                "fetched_articles": [],
                "article_sources": [],
                "errors": [error_msg],
                "step_count": state.get("step_count", 0) + 1
            }

        print(f"Successfully fetched {len(articles)} articles")

        # Extract source URLs for citations
        article_sources = [article["url"] for article in articles]

        return {
            "fetched_articles": articles,
            "article_sources": article_sources,
            "errors": [],
            "step_count": state.get("step_count", 0) + 1
        }

    except NewsAPIError as e:
        error_msg = f"Failed to fetch news: {str(e)}"
        print(f"Error: {error_msg}")
        return {
            "fetched_articles": [],
            "article_sources": [],
            "errors": [error_msg],
            "step_count": state.get("step_count", 0) + 1
        }


def generate_content_node(state: BlogGeneratorState) -> dict:
    """Generate blog post content from fetched articles."""

    print("Generating blog post content...")

    # Check if we have articles
    if not state.get("fetched_articles"):
        print("No articles available to generate content")
        return {
            "errors": state.get("errors", []) + ["No articles available for content generation"],
            "step_count": state.get("step_count", 0) + 1
        }

    model_with_structure = model.with_structured_output(BlogContent, method="json_schema")

    # Format articles for the prompt
    articles_text = "\n\n".join([
        f"Article {i+1}:\n"
        f"Title: {article['title']}\n"
        f"URL: {article['url']}\n"
        f"Description: {article['description']}\n"
        f"Published: {article['published_at']}"
        for i, article in enumerate(state["fetched_articles"])
    ])

    prompt = f"""You are a professional tech blogger writing about AI news from TechCrunch.

Here are the latest AI news articles:

{articles_text}

Write an engaging, informative blog post (500-1000 words) that:
1. Has a catchy title that captures the main theme
2. Identifies an overarching theme connecting these articles
3. Starts with a compelling introduction
4. Organizes articles into 3-5 thematic sections with clear headings
5. For each article, provide a 2-3 sentence summary with key points
6. Includes the article title and URL for each citation
7. Ends with a thoughtful conclusion about implications and future outlook

Make the blog post accessible yet substantive. Focus on insights and connections between the articles."""

    result = model_with_structure.invoke(prompt)

    print(f"Generated blog post: '{result.title}'")

    return {
        "blog_title": result.title,
        "blog_introduction": result.introduction,
        "blog_sections": [section.model_dump() for section in result.sections],
        "blog_conclusion": result.conclusion,
        "overarching_theme": result.overarching_theme,
        "article_summaries": [summary.model_dump() for summary in result.article_summaries],
        "step_count": state.get("step_count", 0) + 1
    }


def plan_diagrams_node(state: BlogGeneratorState) -> dict:
    """Plan what SVG diagrams would enhance the blog post."""

    print("Planning infographic diagrams...")

    model_with_structure = model.with_structured_output(DiagramPlan, method="json_schema")

    sections_str = "\n".join(f"- {s['heading']}" for s in state["blog_sections"])
    prompt = f"""You are a data visualization expert. Based on this blog post about AI news,
plan 2-3 SVG diagrams that would serve as informative infographics.

Blog Title: {state["blog_title"]}
Theme: {state["overarching_theme"]}

Sections:
{sections_str}

For each diagram, specify:
- id: A short identifier (e.g., "diagram_1", "ai_timeline", "comparison")
- title: Clear diagram title
- description: What the diagram should show (be specific about data/relationships to visualize)
- section: Which blog section heading this diagram relates to

Good diagram types for AI news:
- Timelines of developments
- Comparison charts (models, companies, capabilities)
- Architecture diagrams
- Market share/adoption charts
- Process flows
- Category hierarchies

Return 2-3 diagram plans that would genuinely add value to the blog post."""

    result = model_with_structure.invoke(prompt)

    print(f"Planned {len(result.diagrams)} diagrams")

    return {
        "diagram_plans": [diagram.model_dump() for diagram in result.diagrams],
        "generated_diagrams": [],  # Initialize empty list
        "step_count": state.get("step_count", 0) + 1
    }


def generate_diagrams_node(state: BlogGeneratorState) -> dict:
    """Generate SVG diagrams based on the plan."""

    print("Generating SVG diagrams...")

    model_with_structure = model.with_structured_output(SVGDiagram, method="json_schema")

    diagrams = []
    for plan in state["diagram_plans"]:
        print(f"  Creating: {plan['title']}")

        prompt = f"""You are an SVG graphics expert. Create a professional, informative SVG diagram.

Title: {plan['title']}
Description: {plan['description']}
Related Section: {plan['section']}

Requirements:
- Create complete, valid SVG markup (including <svg> tag with viewBox)
- Size: 800x400 pixels recommended (use viewBox="0 0 800 400")
- Use a clean, modern design with good typography
- Include clear labels and legends as needed
- Use a professional color palette (e.g., blues #3B82F6, grays #6B7280, accent colors #10B981)
- Make it informative and visually appealing
- Ensure text is readable (minimum 14px font size)
- Use proper SVG elements (rect, circle, path, text, line, etc.)

Return the complete SVG code ready to save as a file."""

        result = model_with_structure.invoke(prompt)

        diagrams.append({
            "id": plan["id"],
            "title": result.title,
            "svg_code": result.svg_code,
            "section": plan["section"]
        })

    print(f"Generated {len(diagrams)} SVG diagrams")

    return {
        "generated_diagrams": diagrams,
        "step_count": state.get("step_count", 0) + 1
    }


def compile_markdown_node(state: BlogGeneratorState) -> dict:
    """Compile the final markdown report with embedded diagram references and citations."""

    print("Compiling markdown report...")

    # Build the markdown content
    markdown_parts = []

    # Title and metadata
    markdown_parts.append(f"# {state['blog_title']}\n")
    markdown_parts.append(f"*AI News Report - Generated from TechCrunch articles*\n")
    markdown_parts.append(f"*Published: {datetime.now().strftime('%B %d, %Y')}*\n")

    # Introduction
    markdown_parts.append("\n## Introduction\n")
    markdown_parts.append(f"{state['blog_introduction']}\n")

    # Main theme
    markdown_parts.append(f"\n**Theme:** {state['overarching_theme']}\n")

    # Sections with diagrams inserted where relevant
    for section in state["blog_sections"]:
        markdown_parts.append(f"\n## {section['heading']}\n")
        markdown_parts.append(f"{section['content']}\n")

        # Check if any diagrams relate to this section
        for diagram in state["generated_diagrams"]:
            if diagram["section"] == section["heading"]:
                markdown_parts.append(f"\n![{diagram['title']}]({diagram['id']}.svg)\n")
                markdown_parts.append(f"*Figure: {diagram['title']}*\n")

    # Conclusion
    markdown_parts.append("\n## Conclusion\n")
    markdown_parts.append(f"{state['blog_conclusion']}\n")

    # Article Summaries and Citations
    markdown_parts.append("\n## Referenced Articles\n")
    for i, summary in enumerate(state["article_summaries"], 1):
        markdown_parts.append(f"\n### {i}. [{summary['title']}]({summary['source_url']})\n")
        markdown_parts.append("**Key Points:**\n")
        for point in summary["key_points"]:
            markdown_parts.append(f"- {point}\n")

    # Footer
    markdown_parts.append("\n---\n")
    markdown_parts.append("*Generated with LangGraph AI Blog Generator*\n")
    markdown_parts.append(f"*Source: TechCrunch via NewsAPI*\n")

    final_markdown = "\n".join(markdown_parts)

    print(f"Compiled markdown ({len(final_markdown)} characters)")

    return {
        "final_markdown": final_markdown,
        "step_count": state.get("step_count", 0) + 1
    }


def save_output_node(state: BlogGeneratorState) -> dict:
    """Save the markdown report and SVG diagrams to the output folder."""

    print("Saving files to blog-post-results/...")

    # Create output directory
    output_dir = Path("blog-post-results")
    output_dir.mkdir(exist_ok=True)

    # Generate timestamp for unique filenames
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Save markdown file
    markdown_path = output_dir / f"ai_news_blog_{timestamp}.md"
    with open(markdown_path, "w", encoding="utf-8") as f:
        f.write(state["final_markdown"])
    print(f"  Saved: {markdown_path}")

    # Save SVG diagrams
    for diagram in state["generated_diagrams"]:
        svg_path = output_dir / f"{diagram['id']}.svg"
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(diagram["svg_code"])
        print(f"  Saved: {svg_path}")

    print(f"\nBlog post generation complete!")
    print(f"Output location: {output_dir.absolute()}")

    return {
        "output_path": str(output_dir.absolute()),
        "step_count": state.get("step_count", 0) + 1
    }


# ============================================================================
# Step 5: Build the Graph
# ============================================================================

def build_blog_generator() -> StateGraph:
    """Build and compile the blog generator workflow."""

    # Create the graph
    builder = StateGraph(BlogGeneratorState)

    # Add nodes
    builder.add_node("fetch_news", fetch_news_node)
    builder.add_node("generate_content", generate_content_node)
    builder.add_node("plan_diagrams", plan_diagrams_node)
    builder.add_node("generate_diagrams", generate_diagrams_node)
    builder.add_node("compile_markdown", compile_markdown_node)
    builder.add_node("save_output", save_output_node)

    # Add edges - linear workflow
    builder.add_edge(START, "fetch_news")
    builder.add_edge("fetch_news", "generate_content")
    builder.add_edge("generate_content", "plan_diagrams")
    builder.add_edge("plan_diagrams", "generate_diagrams")
    builder.add_edge("generate_diagrams", "compile_markdown")
    builder.add_edge("compile_markdown", "save_output")
    builder.add_edge("save_output", END)

    # Compile the graph
    return builder.compile()


# ============================================================================
# Step 6: Main execution
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("AI BLOG POST GENERATOR WITH REAL TECHCRUNCH NEWS")
    print("=" * 70)
    print()

    # Build the graph
    graph = build_blog_generator()

    # Run the workflow
    initial_state = {
        "step_count": 0,
        "fetched_articles": [],
        "article_sources": [],
        "generated_diagrams": [],
        "errors": []
    }

    final_state = graph.invoke(initial_state)

    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)

    if final_state.get("errors"):
        print("Errors encountered:")
        for error in final_state["errors"]:
            print(f"  - {error}")
    else:
        print(f"Blog Title: {final_state.get('blog_title', 'N/A')}")
        print(f"Theme: {final_state.get('overarching_theme', 'N/A')}")
        print(f"Articles Fetched: {len(final_state.get('fetched_articles', []))}")
        print(f"Sections: {len(final_state.get('blog_sections', []))}")
        print(f"Diagrams: {len(final_state.get('generated_diagrams', []))}")
        print(f"Output Path: {final_state.get('output_path', 'N/A')}")

    print(f"Total Steps: {final_state.get('step_count', 0)}")
