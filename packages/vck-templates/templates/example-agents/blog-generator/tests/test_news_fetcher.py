"""
Tests for the news fetcher module.
"""

import pytest
from unittest.mock import patch, MagicMock
from news_fetcher import NewsFetcher, NewsAPIError, fetch_ai_news


class TestNewsFetcher:
    """Test cases for NewsFetcher class."""

    def test_initialization_with_api_key(self):
        """Test that NewsFetcher initializes with provided API key."""
        fetcher = NewsFetcher(api_key="test_key")
        assert fetcher.api_key == "test_key"

    def test_initialization_without_api_key_raises_error(self):
        """Test that NewsFetcher raises error when no API key is provided."""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(NewsAPIError, match="NEWS_API_KEY environment variable is not set"):
                NewsFetcher()

    @patch('news_fetcher.requests.get')
    def test_fetch_techcrunch_ai_news_success(self, mock_get):
        """Test successful article fetching."""
        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "ok",
            "articles": [
                {
                    "title": "AI Test Article",
                    "url": "https://techcrunch.com/test",
                    "description": "Test description",
                    "publishedAt": "2026-02-01T12:00:00Z",
                    "source": {"name": "TechCrunch"}
                }
            ]
        }
        mock_get.return_value = mock_response

        fetcher = NewsFetcher(api_key="test_key")
        articles = fetcher.fetch_techcrunch_ai_news()

        assert len(articles) == 1
        assert articles[0]["title"] == "AI Test Article"
        assert articles[0]["url"] == "https://techcrunch.com/test"
        assert articles[0]["description"] == "Test description"

    @patch('news_fetcher.requests.get')
    def test_fetch_techcrunch_ai_news_filters_incomplete_articles(self, mock_get):
        """Test that articles without descriptions or URLs are filtered out."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "ok",
            "articles": [
                {
                    "title": "Complete Article",
                    "url": "https://techcrunch.com/complete",
                    "description": "Has description",
                    "publishedAt": "2026-02-01T12:00:00Z",
                    "source": {"name": "TechCrunch"}
                },
                {
                    "title": "Missing URL",
                    "description": "Has description but no URL",
                    "publishedAt": "2026-02-01T12:00:00Z",
                    "source": {"name": "TechCrunch"}
                },
                {
                    "title": "Missing Description",
                    "url": "https://techcrunch.com/missing-desc",
                    "publishedAt": "2026-02-01T12:00:00Z",
                    "source": {"name": "TechCrunch"}
                }
            ]
        }
        mock_get.return_value = mock_response

        fetcher = NewsFetcher(api_key="test_key")
        articles = fetcher.fetch_techcrunch_ai_news()

        # Only the complete article should be returned
        assert len(articles) == 1
        assert articles[0]["title"] == "Complete Article"

    @patch('news_fetcher.requests.get')
    def test_fetch_techcrunch_ai_news_api_error(self, mock_get):
        """Test handling of API errors."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "status": "error",
            "message": "Invalid API key"
        }
        mock_get.return_value = mock_response

        fetcher = NewsFetcher(api_key="test_key")

        with pytest.raises(NewsAPIError, match="Invalid API key"):
            fetcher.fetch_techcrunch_ai_news()

    @patch('news_fetcher.requests.get')
    def test_fetch_techcrunch_ai_news_network_error(self, mock_get):
        """Test handling of network errors."""
        mock_get.side_effect = Exception("Network error")

        fetcher = NewsFetcher(api_key="test_key")

        with pytest.raises(NewsAPIError, match="Failed to fetch articles"):
            fetcher.fetch_techcrunch_ai_news()

    def test_format_articles_for_prompt(self):
        """Test article formatting for LLM prompts."""
        fetcher = NewsFetcher(api_key="test_key")
        articles = [
            {
                "title": "Test Article 1",
                "url": "https://example.com/1",
                "description": "Description 1",
                "published_at": "2026-02-01T12:00:00Z"
            },
            {
                "title": "Test Article 2",
                "url": "https://example.com/2",
                "description": "Description 2",
                "published_at": "2026-02-02T12:00:00Z"
            }
        ]

        formatted = fetcher.format_articles_for_prompt(articles)

        assert "Test Article 1" in formatted
        assert "Test Article 2" in formatted
        assert "https://example.com/1" in formatted
        assert "https://example.com/2" in formatted
        assert "Description 1" in formatted
        assert "Description 2" in formatted

    def test_format_articles_for_prompt_empty_list(self):
        """Test formatting with no articles."""
        fetcher = NewsFetcher(api_key="test_key")
        formatted = fetcher.format_articles_for_prompt([])

        assert formatted == "No articles found."
