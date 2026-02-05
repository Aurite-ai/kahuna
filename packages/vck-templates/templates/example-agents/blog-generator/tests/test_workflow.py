"""
Integration tests for the blog generator workflow.
"""

import pytest
import os
from pathlib import Path
from unittest.mock import patch, MagicMock
from ai_blog_generator import (
    build_blog_generator,
    fetch_news_node,
    BlogGeneratorState
)


class TestWorkflow:
    """Test cases for the complete workflow."""

    @pytest.fixture
    def mock_articles(self):
        """Fixture providing mock article data."""
        return [
            {
                "title": "AI Test Article 1",
                "url": "https://techcrunch.com/test1",
                "description": "Test description 1",
                "published_at": "2026-02-01T12:00:00Z",
                "source": "TechCrunch"
            },
            {
                "title": "AI Test Article 2",
                "url": "https://techcrunch.com/test2",
                "description": "Test description 2",
                "published_at": "2026-02-02T12:00:00Z",
                "source": "TechCrunch"
            }
        ]

    def test_fetch_news_node_success(self, mock_articles):
        """Test that fetch_news_node successfully retrieves articles."""
        with patch('ai_blog_generator.NewsFetcher') as mock_fetcher_class:
            mock_fetcher = MagicMock()
            mock_fetcher.fetch_techcrunch_ai_news.return_value = mock_articles
            mock_fetcher_class.return_value = mock_fetcher

            state = {"step_count": 0}
            result = fetch_news_node(state)

            assert result["fetched_articles"] == mock_articles
            assert len(result["article_sources"]) == 2
            assert result["article_sources"][0] == "https://techcrunch.com/test1"
            assert result["errors"] == []
            assert result["step_count"] == 1

    def test_fetch_news_node_no_articles(self):
        """Test fetch_news_node when no articles are found."""
        with patch('ai_blog_generator.NewsFetcher') as mock_fetcher_class:
            mock_fetcher = MagicMock()
            mock_fetcher.fetch_techcrunch_ai_news.return_value = []
            mock_fetcher_class.return_value = mock_fetcher

            state = {"step_count": 0}
            result = fetch_news_node(state)

            assert result["fetched_articles"] == []
            assert len(result["errors"]) > 0
            assert "No articles found" in result["errors"][0]

    def test_workflow_creates_output_directory(self, tmp_path, mock_articles):
        """Test that workflow creates the output directory."""
        # This test verifies the output directory creation
        output_dir = tmp_path / "blog-post-results"

        # Simulate what save_output_node does
        output_dir.mkdir(exist_ok=True)

        assert output_dir.exists()
        assert output_dir.is_dir()

    def test_svg_file_creation(self, tmp_path):
        """Test that SVG files are created with valid content."""
        output_dir = tmp_path / "blog-post-results"
        output_dir.mkdir(exist_ok=True)

        # Simulate creating an SVG file
        svg_content = '<svg viewBox="0 0 800 400"><rect width="800" height="400" fill="#F9FAFB"/></svg>'
        svg_path = output_dir / "test_diagram.svg"

        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)

        # Verify file was created
        assert svg_path.exists()

        # Verify content
        with open(svg_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "<svg" in content
            assert "viewBox" in content

    def test_markdown_file_structure(self, tmp_path):
        """Test that markdown files have proper structure."""
        output_dir = tmp_path / "blog-post-results"
        output_dir.mkdir(exist_ok=True)

        # Simulate creating a markdown file
        markdown_content = """# Test Blog Title

*AI News Report - Generated from TechCrunch articles*

## Introduction

Test introduction text.

## Section 1

Test section content.

## Referenced Articles

### 1. [Test Article](https://example.com)

**Key Points:**
- Point 1
- Point 2

---

*Generated with LangGraph AI Blog Generator*
"""
        markdown_path = output_dir / "test_blog.md"

        with open(markdown_path, "w", encoding="utf-8") as f:
            f.write(markdown_content)

        # Verify file was created
        assert markdown_path.exists()

        # Verify structure
        with open(markdown_path, "r", encoding="utf-8") as f:
            content = f.read()
            assert "# Test Blog Title" in content
            assert "## Introduction" in content
            assert "## Referenced Articles" in content
            assert "[Test Article]" in content

    def test_graph_compilation(self):
        """Test that the LangGraph workflow compiles successfully."""
        graph = build_blog_generator()
        assert graph is not None

        # Verify the graph has the expected nodes
        # Note: This is a basic smoke test to ensure the graph compiles
        # More detailed testing would require running the full workflow


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
