"""
Full-text search service for documents and metadata.

Provides advanced search capabilities including full-text search,
filtering, faceting, highlighting, and search suggestions.
"""

import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_, desc, text
from sqlalchemy.dialects.postgresql import aggregate_order_by
import re

from app.database import get_db
from app.models import Work, User, WorkMetric

logger = logging.getLogger(__name__)

class SearchService:
    """
    Service for full-text search across documents and metadata.

    Provides comprehensive search functionality with filtering,
    faceting, highlighting, and ranking capabilities.
    """

    def __init__(self):
        """Initialize search service."""
        self.db = next(get_db())

    def search_works(
        self,
        query: str,
        user_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: str = "relevance",
        sort_order: str = "desc",
        page: int = 1,
        page_size: int = 20,
        include_facets: bool = True
    ) -> Dict[str, Any]:
        """
        Perform advanced search across works.

        Args:
            query: Search query string
            user_id: Optional user ID to filter results
            filters: Optional filters (media_type, language, year_range, etc.)
            sort_by: Sort field (relevance, title, author, trend_score, created_at)
            sort_order: Sort order (asc, desc)
            page: Page number (1-based)
            page_size: Number of results per page
            include_facets: Whether to include facet information

        Returns:
            Search results with pagination and facets
        """
        try:
            # Build search query
            search_query = self._build_search_query(query, filters or {})

            # Apply user filter
            if user_id:
                search_query = search_query.filter(Work.user_id == user_id)

            # Apply sorting
            search_query = self._apply_sorting(search_query, sort_by, sort_order)

            # Get total count
            total_count = search_query.count()

            # Apply pagination
            offset = (page - 1) * page_size
            search_query = search_query.offset(offset).limit(page_size)

            # Execute query
            works = search_query.all()

            # Process results
            results = []
            for work in works:
                result = self._process_work_result(work, query)
                results.append(result)

            # Build facets if requested
            facets = {}
            if include_facets:
                facets = self._build_facets(query, user_id, filters or {})

            return {
                "query": query,
                "total_results": total_count,
                "page": page,
                "page_size": page_size,
                "total_pages": (total_count + page_size - 1) // page_size,
                "results": results,
                "facets": facets,
                "search_time": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error performing search: {e}")
            return {
                "query": query,
                "total_results": 0,
                "page": page,
                "page_size": page_size,
                "total_pages": 0,
                "results": [],
                "facets": {},
                "error": "Search failed"
            }

    def _build_search_query(self, query: str, filters: Dict[str, Any]):
        """Build SQLAlchemy search query with full-text search."""
        # Base query
        search_query = self.db.query(Work)

        if not query or not query.strip():
            return search_query

        # Clean and tokenize query
        query_terms = self._tokenize_query(query)

        # Build search conditions
        search_conditions = []

        for term in query_terms:
            term_conditions = []

            # Search in title
            if len(term) >= 2:
                term_conditions.append(Work.title.ilike(f"%{term}%"))

            # Search in author
            if len(term) >= 2:
                term_conditions.append(Work.author.ilike(f"%{term}%"))

            # Search in description/summary
            if Work.metadata.has_key('description'):
                term_conditions.append(
                    text("works.metadata->>'description' ILIKE :term")
                )

            # Search in content (if available)
            if Work.metadata.has_key('content'):
                term_conditions.append(
                    text("works.metadata->>'content' ILIKE :term")
                )

            # Add term to search conditions
            if term_conditions:
                search_conditions.append(or_(*term_conditions))

        # Apply search conditions
        if search_conditions:
            search_query = search_query.filter(and_(*search_conditions))

        # Apply filters
        for filter_key, filter_value in filters.items():
            if filter_value is not None:
                search_query = self._apply_filter(search_query, filter_key, filter_value)

        return search_query

    def _tokenize_query(self, query: str) -> List[str]:
        """Tokenize search query into individual terms."""
        if not query:
            return []

        # Remove special characters and split
        query = re.sub(r'[^\w\s]', ' ', query.lower())
        terms = query.split()

        # Filter out stop words and short terms
        stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'}
        filtered_terms = [term for term in terms if len(term) >= 2 and term not in stop_words]

        return filtered_terms

    def _apply_filter(self, query, filter_key: str, filter_value: Any):
        """Apply a specific filter to the search query."""
        if filter_key == "media_type":
            return query.filter(Work.media_type == filter_value)

        elif filter_key == "language":
            return query.filter(Work.language == filter_value)

        elif filter_key == "public_domain_year":
            if isinstance(filter_value, dict) and 'min' in filter_value and 'max' in filter_value:
                return query.filter(
                    and_(
                        Work.public_domain_year >= filter_value['min'],
                        Work.public_domain_year <= filter_value['max']
                    )
                )

        elif filter_key == "trend_score":
            if isinstance(filter_value, dict) and 'min' in filter_value:
                return query.filter(
                    text("CAST(works.metadata->>'trend_score' AS FLOAT) >= :min_score")
                ).params(min_score=filter_value['min'])

        elif filter_key == "created_after":
            return query.filter(Work.created_at >= filter_value)

        elif filter_key == "created_before":
            return query.filter(Work.created_at <= filter_value)

        elif filter_key == "has_content":
            if filter_value:
                return query.filter(Work.metadata.has_key('content'))
            else:
                return query.filter(~Work.metadata.has_key('content'))

        return query

    def _apply_sorting(self, query, sort_by: str, sort_order: str):
        """Apply sorting to the search query."""
        order_func = desc if sort_order.lower() == 'desc' else lambda x: x

        if sort_by == "relevance":
            # Sort by relevance (works with content match first, then title match)
            return query.order_by(
                order_func(text("CASE WHEN works.metadata ? 'content' THEN 1 ELSE 0 END")),
                order_func(text("CASE WHEN works.title ILIKE '%query%' THEN 1 ELSE 0 END")),
                order_func(Work.created_at)
            )

        elif sort_by == "title":
            return query.order_by(order_func(Work.title))

        elif sort_by == "author":
            return query.order_by(order_func(Work.author))

        elif sort_by == "trend_score":
            return query.order_by(
                order_func(text("CAST(COALESCE(works.metadata->>'trend_score', '0') AS FLOAT)")),
                order_func(Work.created_at)
            )

        elif sort_by == "created_at":
            return query.order_by(order_func(Work.created_at))

        elif sort_by == "public_domain_year":
            return query.order_by(order_func(Work.public_domain_year))

        else:
            return query.order_by(order_func(Work.created_at))

    def _process_work_result(self, work: Work, query: str) -> Dict[str, Any]:
        """Process a work result for search response."""
        # Extract relevant metadata
        metadata = work.metadata or {}

        # Generate snippet with highlighting
        snippet = self._generate_snippet(work, query)

        # Calculate relevance score
        relevance_score = self._calculate_relevance_score(work, query)

        return {
            "id": work.id,
            "title": work.title,
            "author": work.author,
            "media_type": work.media_type,
            "language": work.language,
            "public_domain_year": work.public_domain_year,
            "created_at": work.created_at.isoformat(),
            "updated_at": work.updated_at.isoformat(),
            "metadata": metadata,
            "snippet": snippet,
            "relevance_score": relevance_score,
            "has_content": 'content' in metadata,
            "content_length": len(metadata.get('content', '')) if 'content' in metadata else 0
        }

    def _generate_snippet(self, work: Work, query: str) -> str:
        """Generate a search result snippet with highlighting."""
        metadata = work.metadata or {}

        # Try to find snippet in content first
        if 'content' in metadata and metadata['content']:
            content = metadata['content'][:1000]  # First 1000 chars
            query_terms = self._tokenize_query(query)

            # Simple highlighting
            snippet = content
            for term in query_terms:
                if len(term) >= 3:  # Only highlight longer terms
                    snippet = re.sub(
                        f'({re.escape(term)})',
                        r'**\1**',
                        snippet,
                        flags=re.IGNORECASE
                    )

            if len(snippet) >= 500:
                snippet = snippet[:497] + "..."

            return snippet

        # Fallback to description
        elif 'description' in metadata and metadata['description']:
            return metadata['description'][:300] + "..."

        # Fallback to title
        else:
            return f"**{work.title}** by {work.author or 'Unknown'}"

    def _calculate_relevance_score(self, work: Work, query: str) -> float:
        """Calculate relevance score for search result."""
        score = 0.0
        query_terms = self._tokenize_query(query)
        metadata = work.metadata or {}

        for term in query_terms:
            # Title matches (highest weight)
            if term.lower() in work.title.lower():
                score += 10

            # Author matches
            if work.author and term.lower() in work.author.lower():
                score += 8

            # Description matches
            if 'description' in metadata and metadata['description']:
                if term.lower() in metadata['description'].lower():
                    score += 5

            # Content matches (if available)
            if 'content' in metadata and metadata['content']:
                if term.lower() in metadata['content'].lower():
                    score += 3

        # Boost based on trend score if available
        if 'trend_score' in metadata:
            try:
                trend_score = float(metadata['trend_score'])
                score += trend_score * 0.1  # Small boost for trending content
            except (ValueError, TypeError):
                pass

        return score

    def _build_facets(self, query: str, user_id: Optional[int] = None, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Build facet information for search results."""
        facets = {}

        try:
            # Media type facet
            media_types = self.db.query(
                Work.media_type,
                func.count(Work.id).label('count')
            )

            if user_id:
                media_types = media_types.filter(Work.user_id == user_id)

            media_types = media_types.filter(Work.media_type.isnot(None))
            media_types = media_types.group_by(Work.media_type).all()

            facets['media_types'] = [
                {'value': mt, 'count': count}
                for mt, count in media_types
            ]

            # Language facet
            languages = self.db.query(
                Work.language,
                func.count(Work.id).label('count')
            )

            if user_id:
                languages = languages.filter(Work.user_id == user_id)

            languages = languages.filter(Work.language.isnot(None))
            languages = languages.group_by(Work.language).all()

            facets['languages'] = [
                {'value': lang, 'count': count}
                for lang, count in languages
            ]

            # Publication year facet (decades)
            decades = self.db.query(
                text("FLOOR(public_domain_year / 10) * 10 as decade"),
                func.count(Work.id).label('count')
            )

            if user_id:
                decades = decades.filter(text("user_id = :user_id")).params(user_id=user_id)

            decades = decades.filter(text("public_domain_year IS NOT NULL"))
            decades = decades.group_by(text("FLOOR(public_domain_year / 10) * 10"))
            decades = decades.order_by(text("FLOOR(public_domain_year / 10) * 10")).all()

            facets['decades'] = [
                {'value': decade, 'count': count}
                for decade, count in decades
            ]

            # Trend score ranges
            trend_ranges = [
                {'range': '0-25', 'min': 0, 'max': 25},
                {'range': '26-50', 'min': 26, 'max': 50},
                {'range': '51-75', 'min': 51, 'max': 75},
                {'range': '76-100', 'min': 76, 'max': 100}
            ]

            for trend_range in trend_ranges:
                count = self.db.query(func.count(Work.id)).filter(
                    text("CAST(COALESCE(metadata->>'trend_score', '0') AS FLOAT) BETWEEN :min_score AND :max_score")
                ).params(min_score=trend_range['min'], max_score=trend_range['max'])

                if user_id:
                    count = count.filter(Work.user_id == user_id)

                trend_range['count'] = count.scalar() or 0

            facets['trend_score_ranges'] = trend_ranges

        except Exception as e:
            logger.error(f"Error building facets: {e}")
            facets = {}

        return facets

    def get_search_suggestions(self, query: str, limit: int = 10) -> List[str]:
        """Get search suggestions based on query."""
        if not query or len(query.strip()) < 2:
            return []

        try:
            suggestions = set()

            # Get suggestions from titles
            title_suggestions = self.db.query(Work.title).filter(
                Work.title.ilike(f"%{query}%")
            ).distinct().limit(limit).all()

            for (title,) in title_suggestions:
                suggestions.add(title)

            # Get suggestions from authors
            author_suggestions = self.db.query(Work.author).filter(
                Work.author.ilike(f"%{query}%")
            ).filter(Work.author.isnot(None)).distinct().limit(limit).all()

            for (author,) in author_suggestions:
                suggestions.add(author)

            return list(suggestions)[:limit]

        except Exception as e:
            logger.error(f"Error getting search suggestions: {e}")
            return []

    def get_popular_searches(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get popular search terms."""
        # This would typically come from a search analytics table
        # For now, return some mock data based on content analysis
        try:
            popular_terms = []

            # Analyze titles for common terms
            title_words = self.db.query(
                func.unnest(func.string_to_array(func.lower(Work.title), ' ')).label('word')
            ).filter(
                Work.title.isnot(None)
            ).subquery()

            word_counts = self.db.query(
                title_words.c.word,
                func.count(title_words.c.word).label('count')
            ).filter(
                title_words.c.word.notin_(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', ''])
            ).filter(
                func.length(title_words.c.word) >= 4
            ).group_by(title_words.c.word).order_by(func.count(title_words.c.word).desc()).limit(limit).all()

            for word, count in word_counts:
                popular_terms.append({
                    'term': word,
                    'count': count,
                    'type': 'title'
                })

            return popular_terms

        except Exception as e:
            logger.error(f"Error getting popular searches: {e}")
            return []

    def index_work(self, work_id: int) -> bool:
        """
        Index a work for search.

        Args:
            work_id: Work ID to index

        Returns:
            True if indexing successful
        """
        try:
            # In a real implementation, this would update a search index
            # For now, we just ensure the work exists and is properly stored
            work = self.db.query(Work).filter(Work.id == work_id).first()
            if work:
                # Trigger any necessary updates
                self.db.commit()
                return True
            return False

        except Exception as e:
            logger.error(f"Error indexing work {work_id}: {e}")
            return False

# Global search service instance
_search_service = None

def get_search_service() -> SearchService:
    """
    Get or create search service instance.

    Returns:
        SearchService instance
    """
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service
