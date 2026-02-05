"""
News fetching module for TechCrunch AI articles using NewsAPI.
"""

import os
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class NewsAPIError(Exception):
    """Custom exception for NewsAPI errors."""
    pass


class NewsFetcher:
    """Fetches AI news articles from TechCrunch using NewsAPI."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the news fetcher.

        Args:
            api_key: NewsAPI key. If not provided, reads from NEWS_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("NEWS_API_KEY")
        if not self.api_key:
            raise NewsAPIError("NEWS_API_KEY environment variable is not set")

        self.base_url = "https://newsapi.org/v2/everything"

    def fetch_techcrunch_ai_news(
        self,
        days_back: int = 7,
        max_articles: int = 10
    ) -> List[Dict[str, str]]:
        """
        Fetch recent AI news articles from TechCrunch.

        Args:
            days_back: Number of days to look back for articles (default: 7)
            max_articles: Maximum number of articles to return (default: 10)

        Returns:
            List of article dictionaries with keys:
                - title: Article title
                - url: Article URL
                - description: Article description/summary
                - published_at: Publication date
                - source: Source name (TechCrunch)

        Raises:
            NewsAPIError: If the API request fails
        """
        # Calculate date range
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days_back)

        # Build request parameters
        params = {
            "apiKey": self.api_key,
            "domains": "techcrunch.com",
            "q": "AI OR artificial intelligence OR machine learning OR LLM OR GPT",
            "from": from_date.strftime("%Y-%m-%d"),
            "to": to_date.strftime("%Y-%m-%d"),
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": max_articles
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("status") != "ok":
                raise NewsAPIError(f"NewsAPI returned error: {data.get('message', 'Unknown error')}")

            articles = data.get("articles", [])

            # Parse and structure article data
            structured_articles = []
            for article in articles:
                # Skip articles without descriptions or URLs
                if not article.get("description") or not article.get("url"):
                    continue

                structured_articles.append({
                    "title": article.get("title", "Untitled"),
                    "url": article["url"],
                    "description": article["description"],
                    "published_at": article.get("publishedAt", ""),
                    "source": article.get("source", {}).get("name", "TechCrunch")
                })

            return structured_articles

        except requests.exceptions.RequestException as e:
            raise NewsAPIError(f"Failed to fetch articles: {str(e)}")
        except ValueError as e:
            raise NewsAPIError(f"Failed to parse API response: {str(e)}")
        except Exception as e:
            raise NewsAPIError(f"Failed to fetch articles: {str(e)}")

    def format_articles_for_prompt(self, articles: List[Dict[str, str]]) -> str:
        """
        Format articles as a readable string for LLM prompts.

        Args:
            articles: List of article dictionaries

        Returns:
            Formatted string with article information
        """
        if not articles:
            return "No articles found."

        formatted = []
        for i, article in enumerate(articles, 1):
            formatted.append(
                f"{i}. {article['title']}\n"
                f"   URL: {article['url']}\n"
                f"   Summary: {article['description']}\n"
                f"   Published: {article['published_at']}\n"
            )

        return "\n".join(formatted)


# Convenience function for direct use
def fetch_ai_news(days_back: int = 7, max_articles: int = 10) -> List[Dict[str, str]]:
    """
    Convenience function to fetch AI news articles.

    Args:
        days_back: Number of days to look back (default: 7)
        max_articles: Maximum number of articles (default: 10)

    Returns:
        List of article dictionaries
    """
    fetcher = NewsFetcher()
    return fetcher.fetch_techcrunch_ai_news(days_back=days_back, max_articles=max_articles)


if __name__ == "__main__":
    # Test the news fetcher
    print("Fetching TechCrunch AI news articles...")
    print("=" * 70)

    try:
        articles = fetch_ai_news(days_back=7, max_articles=5)

        if not articles:
            print("No articles found.")
        else:
            print(f"Found {len(articles)} articles:\n")

            for i, article in enumerate(articles, 1):
                print(f"{i}. {article['title']}")
                print(f"   URL: {article['url']}")
                print(f"   Published: {article['published_at']}")
                print(f"   Description: {article['description'][:100]}...")
                print()

    except NewsAPIError as e:
        print(f"Error: {e}")
