"""
Google Trends API Integration Service

Handles integration with Google Trends API for trend analysis and search volume data.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    GOOGLE_TRENDS_AVAILABLE = True
except ImportError:
    GOOGLE_TRENDS_AVAILABLE = False
    logging.warning("Google API client not available. Install with: pip install google-api-python-client")

logger = logging.getLogger(__name__)

class GoogleTrendsService:
    """
    Service for integrating with Google Trends API.

    Provides methods to fetch trend data, interest over time,
    and related queries for public domain works.
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Google Trends service.

        Args:
            api_key: Google Trends API key (optional, will use environment variable)
        """
        self.api_key = api_key or os.getenv("GOOGLE_TRENDS_API_KEY")

        if not GOOGLE_TRENDS_AVAILABLE:
            logger.warning("Google Trends integration disabled - required packages not installed")
            self.available = False
            return

        if not self.api_key:
            logger.warning("Google Trends API key not provided - using mock data")
            self.available = False
            return

        try:
            # Build the Google Trends service
            self.service = build('trends', 'v1beta', developerKey=self.api_key)
            self.available = True
            logger.info("Google Trends service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Trends service: {e}")
            self.available = False

    def is_available(self) -> bool:
        """Check if Google Trends service is available."""
        return self.available and GOOGLE_TRENDS_AVAILABLE

    def get_interest_over_time(self, keywords: List[str], timeframe: str = "today 12-m") -> Dict[str, Any]:
        """
        Get interest over time for given keywords.

        Args:
            keywords: List of keywords to search for
            timeframe: Time frame for the search (e.g., "today 12-m", "2023-01-01 2024-01-01")

        Returns:
            Dictionary containing trend data
        """
        if not self.is_available():
            return self._get_mock_trend_data(keywords, timeframe)

        try:
            request = self.service.getTimelinesForHealth(
                keywords=keywords,
                timeframe=timeframe
            )
            response = request.execute()

            # Process the response
            processed_data = self._process_trend_response(response, keywords)
            return processed_data

        except HttpError as e:
            logger.error(f"Google Trends API error: {e}")
            return self._get_mock_trend_data(keywords, timeframe)
        except Exception as e:
            logger.error(f"Unexpected error in Google Trends API: {e}")
            return self._get_mock_trend_data(keywords, timeframe)

    def get_related_queries(self, keyword: str, timeframe: str = "today 12-m") -> Dict[str, List[Dict]]:
        """
        Get related queries for a keyword.

        Args:
            keyword: Main keyword to search for
            timeframe: Time frame for the search

        Returns:
            Dictionary with 'top' and 'rising' related queries
        """
        if not self.is_available():
            return self._get_mock_related_queries(keyword)

        try:
            request = self.service.getRelatedQueries(
                keyword=keyword,
                timeframe=timeframe
            )
            response = request.execute()

            return {
                'top': response.get('top', [])[:10],  # Top 10 related queries
                'rising': response.get('rising', [])[:10]  # Top 10 rising queries
            }

        except HttpError as e:
            logger.error(f"Google Trends related queries error: {e}")
            return self._get_mock_related_queries(keyword)
        except Exception as e:
            logger.error(f"Unexpected error in related queries: {e}")
            return self._get_mock_related_queries(keyword)

    def get_trend_score(self, title: str, author: str = "") -> float:
        """
        Calculate a trend score for a work based on Google Trends data.

        Args:
            title: Title of the work
            author: Author of the work

        Returns:
            Trend score between 0 and 100
        """
        if not self.is_available():
            return self._get_mock_trend_score(title, author)

        # Combine title and author for search
        search_terms = [title]
        if author:
            search_terms.append(f"{author} {title}")
            search_terms.append(title)  # Also search title alone

        try:
            # Get interest data for the past 12 months
            trend_data = self.get_interest_over_time(search_terms, "today 12-m")

            # Calculate average interest score
            max_score = 0
            for term_data in trend_data.get('data', []):
                if term_data.get('average_interest', 0) > max_score:
                    max_score = term_data.get('average_interest', 0)

            return min(max_score, 100.0)  # Cap at 100

        except Exception as e:
            logger.error(f"Error calculating trend score: {e}")
            return self._get_mock_trend_score(title, author)

    def _process_trend_response(self, response: Dict, keywords: List[str]) -> Dict[str, Any]:
        """
        Process Google Trends API response.

        Args:
            response: Raw API response
            keywords: Original keywords searched

        Returns:
            Processed trend data
        """
        processed_data = {
            'keywords': keywords,
            'data': [],
            'timestamp': datetime.now().isoformat()
        }

        # Extract timeline data
        for line in response.get('lines', []):
            keyword_data = {
                'keyword': keywords[line.get('keyword', 0)] if line.get('keyword', 0) < len(keywords) else 'unknown',
                'points': []
            }

            for point in line.get('points', []):
                if point.get('value'):
                    keyword_data['points'].append({
                        'date': point.get('date'),
                        'value': int(point['value'])
                    })

            if keyword_data['points']:
                # Calculate average interest
                values = [p['value'] for p in keyword_data['points']]
                keyword_data['average_interest'] = sum(values) / len(values)
                keyword_data['max_interest'] = max(values)
                keyword_data['min_interest'] = min(values)

                processed_data['data'].append(keyword_data)

        return processed_data

    def _get_mock_trend_data(self, keywords: List[str], timeframe: str) -> Dict[str, Any]:
        """
        Generate mock trend data for development/testing.

        Args:
            keywords: List of keywords
            timeframe: Time frame (unused in mock)

        Returns:
            Mock trend data
        """
        logger.info(f"Using mock trend data for keywords: {keywords}")

        mock_data = {
            'keywords': keywords,
            'data': [],
            'timestamp': datetime.now().isoformat(),
            'is_mock': True
        }

        for i, keyword in enumerate(keywords):
            # Generate realistic mock data
            base_score = 50 + (i * 10)  # Vary scores by keyword index
            points = []

            for j in range(52):  # 52 weeks of data
                # Add some randomness and trend
                variation = (j % 4) * 5  # Seasonal variation
                trend = j * 0.5  # Slight upward trend
                value = max(0, min(100, base_score + variation + trend + (j % 10 - 5)))
                points.append({
                    'date': (datetime.now() - timedelta(weeks=51-j)).strftime('%Y-%m-%d'),
                    'value': int(value)
                })

            keyword_data = {
                'keyword': keyword,
                'points': points,
                'average_interest': sum(p['value'] for p in points) / len(points),
                'max_interest': max(p['value'] for p in points),
                'min_interest': min(p['value'] for p in points)
            }

            mock_data['data'].append(keyword_data)

        return mock_data

    def _get_mock_related_queries(self, keyword: str) -> Dict[str, List[Dict]]:
        """
        Generate mock related queries data.

        Args:
            keyword: Main keyword

        Returns:
            Mock related queries
        """
        mock_queries = {
            'top': [
                {'query': f'{keyword} book', 'value': 100},
                {'query': f'{keyword} summary', 'value': 85},
                {'query': f'{keyword} pdf', 'value': 70},
                {'query': f'{keyword} analysis', 'value': 65},
                {'query': f'{keyword} review', 'value': 60},
                {'query': f'{keyword} characters', 'value': 55},
                {'query': f'{keyword} themes', 'value': 50},
                {'query': f'{keyword} quotes', 'value': 45},
                {'query': f'{keyword} movie', 'value': 40},
                {'query': f'{keyword} adaptation', 'value': 35}
            ],
            'rising': [
                {'query': f'{keyword} 2024', 'value': 500},
                {'query': f'{keyword} modern adaptation', 'value': 300},
                {'query': f'{keyword} audiobook', 'value': 250},
                {'query': f'{keyword} netflix', 'value': 200},
                {'query': f'{keyword} graphic novel', 'value': 150}
            ]
        }

        return mock_queries

    def _get_mock_trend_score(self, title: str, author: str = "") -> float:
        """
        Generate mock trend score.

        Args:
            title: Work title
            author: Work author

        Returns:
            Mock trend score
        """
        # Generate pseudo-random but consistent score based on title
        base_score = hash(title.lower()) % 100
        author_bonus = hash(author.lower()) % 20 if author else 0
        return min(100.0, base_score + author_bonus)

# Global service instance
_trends_service = None

def get_trends_service() -> GoogleTrendsService:
    """
    Get or create Google Trends service instance.

    Returns:
        GoogleTrendsService instance
    """
    global _trends_service
    if _trends_service is None:
        _trends_service = GoogleTrendsService()
    return _trends_service
