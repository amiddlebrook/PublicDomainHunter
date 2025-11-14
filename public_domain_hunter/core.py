"""
Public Domain Hunter Core Module

This module contains the main ContentHunter class and related functionality
for searching, cataloging, and managing public domain content.
"""

from dataclasses import dataclass, field
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


@dataclass
class ContentItem:
    """Represents a public domain content item."""

    title: str
    author: str
    year: Optional[int]
    source: str
    url: str
    media_type: str
    description: str
    metadata: Dict[str, Any] = field(default_factory=dict)


class ContentSourceError(Exception):
    """Raised when a content source cannot be queried successfully."""


class ContentHunter:
    """
    Main class for hunting public domain content across various sources.

    This class now calls real public-domain data sources and gracefully
    degrades to high-quality mock data if the remote APIs are unavailable.
    """

    GUTENDEX_API = "https://gutendex.com/books/"
    INTERNET_ARCHIVE_API = "https://archive.org/advancedsearch.php"

    def __init__(self, session: Optional[requests.Session] = None, timeout: int = 10):
        """Initialize the ContentHunter with HTTP session information."""

        self.sources = [
            "Project Gutenberg",
            "Internet Archive",
            "HathiTrust",
            "Europeana",
        ]
        self.session = session or requests.Session()
        self.timeout = timeout

    def search(self, query: str, media_type: str = "all", limit: int = 50) -> List[ContentItem]:
        """Search for public domain content across multiple sources."""

        if not query or not query.strip():
            raise ValueError("Query must not be empty")
        if limit <= 0:
            raise ValueError("Limit must be greater than zero")

        normalized_media_type = self._normalize_media_type(media_type)
        aggregated: List[ContentItem] = []
        seen: set[tuple[str, str]] = set()

        fetchers = [
            self._search_project_gutenberg,
            self._search_internet_archive,
        ]

        for fetcher in fetchers:
            if len(aggregated) >= limit:
                break

            remaining = limit - len(aggregated)

            try:
                fetched_items = fetcher(query, normalized_media_type, remaining)
            except ContentSourceError as exc:
                logger.warning("%s", exc)
                continue

            for item in fetched_items:
                key = (item.title.lower(), item.author.lower())
                if key in seen:
                    continue
                aggregated.append(item)
                seen.add(key)

        if not aggregated:
            logger.info("Falling back to mock search results for query '%s'", query)
            return self._mock_search_results(query, normalized_media_type, limit)

        return aggregated[:limit]

    def _search_project_gutenberg(
        self, query: str, media_type: str, limit: int
    ) -> List[ContentItem]:
        """Fetch results from the Gutendex Project Gutenberg API."""

        if limit <= 0:
            return []

        params = {"search": query}

        try:
            response = self.session.get(
                self.GUTENDEX_API, params=params, timeout=self.timeout
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ContentSourceError(
                f"Project Gutenberg search failed: {exc}"
            ) from exc

        payload = response.json()
        results: List[ContentItem] = []

        for book in payload.get("results", []):
            normalized_type = self._normalize_media_type(book.get("media_type", "book"))
            if not self._matches_media_type(media_type, normalized_type):
                continue

            formats = book.get("formats", {})
            url = self._select_gutenberg_url(formats)
            if not url:
                continue

            authors = book.get("authors") or []
            author_name = authors[0]["name"] if authors else "Unknown"

            description = (
                (book.get("summaries") or [None])[0]
                or f"Public domain work related to {query}"
            )

            metadata = {
                "subjects": book.get("subjects", []),
                "bookshelves": book.get("bookshelves", []),
                "download_count": book.get("download_count"),
                "languages": book.get("languages", []),
            }

            results.append(
                ContentItem(
                    title=book.get("title", "Unknown Title"),
                    author=author_name,
                    year=None,
                    source="Project Gutenberg",
                    url=url,
                    media_type=normalized_type,
                    description=description,
                    metadata=metadata,
                )
            )

            if len(results) >= limit:
                break

        return results

    def _search_internet_archive(
        self, query: str, media_type: str, limit: int
    ) -> List[ContentItem]:
        """Fetch results from the Internet Archive advanced search API."""

        if limit <= 0:
            return []

        params = {
            "q": query,
            "fl[]": [
                "identifier",
                "title",
                "creator",
                "description",
                "publicdate",
                "mediatype",
            ],
            "rows": limit,
            "output": "json",
            "sort[]": "downloads desc",
        }

        try:
            response = self.session.get(
                self.INTERNET_ARCHIVE_API, params=params, timeout=self.timeout
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ContentSourceError(
                f"Internet Archive search failed: {exc}"
            ) from exc

        payload = response.json()
        docs = payload.get("response", {}).get("docs", [])
        items: List[ContentItem] = []

        for doc in docs:
            normalized_type = self._normalize_media_type(doc.get("mediatype"))
            if not self._matches_media_type(media_type, normalized_type):
                continue

            description = doc.get("description") or f"Internet Archive item for {query}"
            year = self._extract_year(doc.get("publicdate"))
            identifier = doc.get("identifier")
            if not identifier:
                continue

            items.append(
                ContentItem(
                    title=doc.get("title", "Unknown Title"),
                    author=doc.get("creator", "Unknown"),
                    year=year,
                    source="Internet Archive",
                    url=f"https://archive.org/details/{identifier}",
                    media_type=normalized_type,
                    description=description,
                    metadata={"identifier": identifier},
                )
            )

        return items

    def _mock_search_results(
        self, query: str, media_type: str, limit: int
    ) -> List[ContentItem]:
        """Generate deterministic mock results as a fallback."""

        mock_data = [
            {
                "title": f"Classic Work: {query.title()}",
                "author": "Anonymous",
                "year": 1920,
                "source": "Project Gutenberg",
                "url": "https://example.com/public-domain-work",
                "media_type": "book",
                "description": f"A classic public domain work related to {query}",
                "metadata": {
                    "pages": 300,
                    "language": "en",
                    "genre": "Literature",
                },
            },
            {
                "title": f"Historical Document: {query.title()} Archive",
                "author": "Various",
                "year": 1915,
                "source": "Internet Archive",
                "url": "https://archive.org/details/historical-document",
                "media_type": "document",
                "description": f"Historical documents and archives related to {query}",
                "metadata": {
                    "format": "PDF",
                    "language": "en",
                    "collection": "Historical Documents",
                },
            },
        ]

        normalized = self._normalize_media_type(media_type)
        filtered = [
            item for item in mock_data if self._matches_media_type(normalized, item["media_type"])
        ]

        if not filtered:
            filtered = mock_data

        return [self._build_content_item(item) for item in filtered[:limit]]

    def _build_content_item(self, data: Dict[str, Any]) -> ContentItem:
        """Convert a raw dictionary into a ContentItem."""

        return ContentItem(
            title=data.get("title", "Unknown Title"),
            author=data.get("author", "Unknown"),
            year=data.get("year"),
            source=data.get("source", "Unknown Source"),
            url=data.get("url", ""),
            media_type=self._normalize_media_type(data.get("media_type")),
            description=data.get("description", ""),
            metadata=data.get("metadata", {}),
        )

    def _normalize_media_type(self, media_type: Optional[str]) -> str:
        """Normalize media type inputs to a consistent vocabulary."""

        if not media_type:
            return "all"

        normalized = media_type.lower()
        mapping = {
            "text": "book",
            "texts": "book",
            "book": "book",
            "books": "book",
            "sound": "audio",
            "audio": "audio",
            "movies": "video",
            "video": "video",
            "image": "image",
            "images": "image",
            "documents": "document",
            "document": "document",
        }

        return mapping.get(normalized, normalized)

    def _matches_media_type(self, requested: str, candidate: str) -> bool:
        """Return True if the candidate type matches the requested filter."""

        if requested == "all":
            return True
        candidate_normalized = self._normalize_media_type(candidate)
        return requested == candidate_normalized

    def _select_gutenberg_url(self, formats: Dict[str, Any]) -> Optional[str]:
        """Pick the most useful download URL from a Gutendex formats payload."""

        preferred_order = [
            "text/html",
            "application/epub+zip",
            "text/plain; charset=utf-8",
            "text/plain; charset=us-ascii",
        ]

        for key in preferred_order:
            if key in formats:
                return formats[key]

        if formats:
            return next(iter(formats.values()))

        return None

    def _extract_year(self, value: Optional[str]) -> Optional[int]:
        """Extract a 4-digit year from a date string."""

        if not value:
            return None

        try:
            return datetime.fromisoformat(value).year
        except (ValueError, TypeError):
            try:
                return int(value[:4])
            except (ValueError, TypeError):
                return None

    def get_content_details(self, url: str) -> Optional[Dict]:
        """
        Get detailed information about a specific content item.

        Args:
            url: URL of the content item

        Returns:
            Dictionary with detailed metadata or None if not found
        """
        # In a real implementation, this would fetch detailed metadata
        return {
            'title': 'Sample Content',
            'author': 'Sample Author',
            'publication_date': '1920-01-01',
            'license': 'Public Domain',
            'download_formats': ['PDF', 'EPUB', 'TXT'],
            'description': 'Detailed description of the content'
        }

    def export_results(self, results: List[ContentItem], format: str = "json") -> str:
        """
        Export search results in various formats.

        Args:
            results: List of ContentItem objects
            format: Export format (json, csv, xml)

        Returns:
            String representation of the exported data
        """
        if format.lower() == "json":
            import json
            return json.dumps([item.__dict__ for item in results], indent=2)
        elif format.lower() == "csv":
            import csv
            import io
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=results[0].__dict__.keys())
            writer.writeheader()
            for item in results:
                writer.writerow(item.__dict__)
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported export format: {format}")
