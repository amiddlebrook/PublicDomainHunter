"""
AI-powered insights and recommendation service.

Provides machine learning-powered content analysis, recommendations,
topic modeling, sentiment analysis, and intelligent content discovery.
"""

import logging
import re
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import math
import random

from sqlalchemy.orm import Session
from sqlalchemy import func, text, desc, and_
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import LatentDirichletAllocation

from app.database import get_db
from app.models import Work, User, WorkMetric, UserActivity
from app.search_service import get_search_service

logger = logging.getLogger(__name__)

class AIInsightsService:
    """
    Service for AI-powered content analysis and recommendations.

    Provides machine learning capabilities including:
    - Content recommendations
    - Topic modeling and analysis
    - Sentiment analysis
    - Content similarity detection
    - User preference learning
    - Trend prediction
    """

    def __init__(self):
        """Initialize AI insights service."""
        self.db = next(get_db())
        self.search_service = get_search_service()

        # Initialize ML models
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.95
        )

        self.lda_model = None
        self.content_vectors = {}
        self.trained = False

    def train_models(self) -> bool:
        """
        Train machine learning models on existing content.

        Returns:
            True if training successful
        """
        try:
            # Get all works with content
            works = self.db.query(Work).filter(
                Work.metadata.has_key('content')
            ).all()

            if len(works) < 10:
                logger.warning("Not enough content for training ML models")
                return False

            # Extract text content
            texts = []
            work_ids = []
            for work in works:
                metadata = work.metadata or {}
                content = metadata.get('content', '')
                if content and len(content.strip()) > 100:
                    texts.append(self._preprocess_text(content))
                    work_ids.append(work.id)

            if len(texts) < 5:
                logger.warning("Not enough quality content for training")
                return False

            # Train TF-IDF vectorizer
            self.content_vectors = dict(zip(work_ids, self.tfidf_vectorizer.fit_transform(texts).toarray()))

            # Train LDA topic model if we have enough content
            if len(texts) >= 20:
                n_topics = min(10, len(texts) // 5)
                self.lda_model = LatentDirichletAllocation(
                    n_components=n_topics,
                    random_state=42,
                    max_iter=100
                )
                self.lda_model.fit(self.tfidf_vectorizer.transform(texts))

            self.trained = True
            logger.info(f"Trained AI models on {len(texts)} documents")
            return True

        except Exception as e:
            logger.error(f"Error training AI models: {e}")
            return False

    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for analysis."""
        if not text:
            return ""

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters but keep meaningful punctuation
        text = re.sub(r'[^\w\s.,!?-]', '', text)

        # Convert to lowercase
        text = text.lower()

        return text.strip()

    def get_content_recommendations(
        self,
        user_id: int,
        content_ids: List[int] = None,
        limit: int = 10,
        include_metadata: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get AI-powered content recommendations for a user.

        Args:
            user_id: User ID to get recommendations for
            content_ids: Optional list of content IDs to base recommendations on
            limit: Maximum number of recommendations
            include_metadata: Whether to include detailed metadata

        Returns:
            List of recommended content with scores
        """
        try:
            if not self.trained:
                self.train_models()

            # Get user's reading history and preferences
            user_activity = self._get_user_activity(user_id)

            # Get content vectors for similarity calculation
            if not self.content_vectors:
                return []

            # Calculate recommendations based on different strategies
            recommendations = []

            # Content-based filtering
            if content_ids:
                content_recs = self._content_based_recommendations(content_ids, limit)
                recommendations.extend(content_recs)

            # User preference-based recommendations
            preference_recs = self._preference_based_recommendations(user_id, limit)
            recommendations.extend(preference_recs)

            # Collaborative filtering (if we have enough data)
            collab_recs = self._collaborative_recommendations(user_id, limit)
            recommendations.extend(collab_recs)

            # Remove duplicates and sort by score
            seen_ids = set()
            unique_recommendations = []
            for rec in sorted(recommendations, key=lambda x: x['score'], reverse=True):
                if rec['work_id'] not in seen_ids:
                    unique_recommendations.append(rec)
                    seen_ids.add(rec['work_id'])
                    if len(unique_recommendations) >= limit:
                        break

            # Add metadata if requested
            if include_metadata:
                unique_recommendations = self._add_recommendation_metadata(unique_recommendations)

            return unique_recommendations[:limit]

        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []

    def _get_user_activity(self, user_id: int) -> Dict[str, Any]:
        """Get user's activity and preferences."""
        try:
            # Get user's viewed/searched works
            user_works = self.db.query(Work).filter(Work.user_id == user_id).all()

            # Get user's search history (if available)
            # This would come from a search analytics table

            # Analyze user's content preferences
            preferences = {
                'preferred_authors': [],
                'preferred_topics': [],
                'preferred_languages': [],
                'preferred_media_types': [],
                'avg_content_length': 0,
                'recent_activity': []
            }

            if user_works:
                # Extract author preferences
                authors = [work.author for work in user_works if work.author]
                if authors:
                    preferences['preferred_authors'] = [
                        author for author, count in Counter(authors).most_common(5)
                    ]

                # Extract topic preferences (based on titles)
                titles = [work.title for work in user_works if work.title]
                if titles:
                    all_words = []
                    for title in titles:
                        words = self._preprocess_text(title).split()
                        all_words.extend(words)

                    if all_words:
                        preferences['preferred_topics'] = [
                            word for word, count in Counter(all_words).most_common(10)
                            if count >= 2 and len(word) >= 4
                        ]

                # Extract language preferences
                languages = [work.language for work in user_works if work.language]
                if languages:
                    preferences['preferred_languages'] = [
                        lang for lang, count in Counter(languages).most_common(3)
                    ]

                # Extract media type preferences
                media_types = [work.media_type for work in user_works if work.media_type]
                if media_types:
                    preferences['preferred_media_types'] = [
                        mt for mt, count in Counter(media_types).most_common(3)
                    ]

                # Calculate average content length
                content_lengths = []
                for work in user_works:
                    metadata = work.metadata or {}
                    if 'content' in metadata:
                        content_lengths.append(len(metadata['content']))

                if content_lengths:
                    preferences['avg_content_length'] = sum(content_lengths) / len(content_lengths)

            return preferences

        except Exception as e:
            logger.error(f"Error getting user activity: {e}")
            return {}

    def _content_based_recommendations(self, content_ids: List[int], limit: int) -> List[Dict[str, Any]]:
        """Get content-based recommendations."""
        recommendations = []

        try:
            # Get vectors for input content
            input_vectors = []
            for content_id in content_ids:
                if content_id in self.content_vectors:
                    input_vectors.append(self.content_vectors[content_id])

            if not input_vectors:
                return []

            # Calculate average vector for input content
            avg_vector = np.mean(input_vectors, axis=0)

            # Find similar content
            for work_id, vector in self.content_vectors.items():
                if work_id in content_ids:
                    continue  # Don't recommend the same content

                # Calculate cosine similarity
                similarity = cosine_similarity([avg_vector], [vector])[0][0]

                if similarity > 0.1:  # Minimum similarity threshold
                    recommendations.append({
                        'work_id': work_id,
                        'score': float(similarity),
                        'reason': 'content_similarity'
                    })

        except Exception as e:
            logger.error(f"Error in content-based recommendations: {e}")

        return recommendations[:limit]

    def _preference_based_recommendations(self, user_id: int, limit: int) -> List[Dict[str, Any]]:
        """Get recommendations based on user preferences."""
        recommendations = []

        try:
            user_activity = self._get_user_activity(user_id)

            # Get all works that match user preferences
            query = self.db.query(Work)

            # Filter by preferred authors
            if user_activity.get('preferred_authors'):
                author_conditions = [
                    Work.author.ilike(f"%{author}%")
                    for author in user_activity['preferred_authors'][:3]
                ]
                if author_conditions:
                    query = query.filter(or_(*author_conditions))

            # Filter by preferred languages
            if user_activity.get('preferred_languages'):
                query = query.filter(Work.language.in_(user_activity['preferred_languages']))

            # Filter by preferred media types
            if user_activity.get('preferred_media_types'):
                query = query.filter(Work.media_type.in_(user_activity['preferred_media_types']))

            # Get works with content for analysis
            query = query.filter(Work.metadata.has_key('content'))

            candidate_works = query.all()

            for work in candidate_works:
                score = 0.0

                # Boost score based on various factors
                metadata = work.metadata or {}

                # Author preference boost
                if work.author and user_activity.get('preferred_authors'):
                    for pref_author in user_activity['preferred_authors']:
                        if pref_author.lower() in work.author.lower():
                            score += 0.3

                # Language preference boost
                if work.language in user_activity.get('preferred_languages', []):
                    score += 0.2

                # Media type preference boost
                if work.media_type in user_activity.get('preferred_media_types', []):
                    score += 0.2

                # Content length preference
                if 'content' in metadata:
                    content_length = len(metadata['content'])
                    avg_length = user_activity.get('avg_content_length', 50000)
                    if abs(content_length - avg_length) < avg_length * 0.5:
                        score += 0.1

                # Trend score boost
                if 'trend_score' in metadata:
                    trend_score = float(metadata['trend_score'])
                    score += trend_score * 0.01  # Small boost for trending content

                if score > 0:
                    recommendations.append({
                        'work_id': work.id,
                        'score': score,
                        'reason': 'user_preferences'
                    })

        except Exception as e:
            logger.error(f"Error in preference-based recommendations: {e}")

        return recommendations[:limit]

    def _collaborative_recommendations(self, user_id: int, limit: int) -> List[Dict[str, Any]]:
        """Get collaborative filtering recommendations."""
        recommendations = []

        try:
            # Simple collaborative filtering based on similar users
            # In a real implementation, this would use user similarity metrics

            # For now, get popular content that user hasn't seen
            user_works = self.db.query(Work.id).filter(Work.user_id == user_id).subquery()

            popular_works = self.db.query(
                Work,
                func.count(Work.user_id).label('user_count')
            ).filter(
                Work.metadata.has_key('content')
            ).filter(
                ~Work.id.in_(user_works)
            ).group_by(Work.id).order_by(desc('user_count')).limit(limit * 2).all()

            for work, user_count in popular_works:
                # Calculate popularity score
                base_score = min(user_count * 0.1, 0.5)  # Cap at 0.5

                # Add trend score if available
                metadata = work.metadata or {}
                if 'trend_score' in metadata:
                    trend_boost = float(metadata['trend_score']) * 0.01
                    base_score += trend_boost

                recommendations.append({
                    'work_id': work.id,
                    'score': base_score,
                    'reason': 'collaborative_popularity'
                })

        except Exception as e:
            logger.error(f"Error in collaborative recommendations: {e}")

        return recommendations[:limit]

    def _add_recommendation_metadata(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Add metadata to recommendations."""
        try:
            work_ids = [rec['work_id'] for rec in recommendations]
            works = self.db.query(Work).filter(Work.id.in_(work_ids)).all()

            work_map = {work.id: work for work in works}

            for rec in recommendations:
                work = work_map.get(rec['work_id'])
                if work:
                    metadata = work.metadata or {}
                    rec.update({
                        'title': work.title,
                        'author': work.author,
                        'media_type': work.media_type,
                        'language': work.language,
                        'public_domain_year': work.public_domain_year,
                        'metadata': metadata,
                        'created_at': work.created_at.isoformat()
                    })

            return recommendations

        except Exception as e:
            logger.error(f"Error adding recommendation metadata: {e}")
            return recommendations

    def analyze_content_topics(self, content_ids: List[int] = None, num_topics: int = 5) -> Dict[str, Any]:
        """
        Analyze content topics using topic modeling.

        Args:
            content_ids: Optional list of content IDs to analyze
            num_topics: Number of topics to extract

        Returns:
            Topic analysis results
        """
        try:
            if not self.trained or not self.lda_model:
                self.train_models()
                if not self.lda_model:
                    return {"error": "Not enough content for topic analysis"}

            # Get content to analyze
            if content_ids:
                works = self.db.query(Work).filter(Work.id.in_(content_ids)).all()
            else:
                works = self.db.query(Work).filter(
                    Work.metadata.has_key('content')
                ).limit(100).all()

            if not works:
                return {"error": "No content available for analysis"}

            # Extract and preprocess content
            texts = []
            work_info = []
            for work in works:
                metadata = work.metadata or {}
                content = metadata.get('content', '')
                if content and len(content.strip()) > 100:
                    texts.append(self._preprocess_text(content))
                    work_info.append({
                        'id': work.id,
                        'title': work.title,
                        'author': work.author
                    })

            if len(texts) < 5:
                return {"error": "Not enough quality content for topic analysis"}

            # Transform texts and get topic distributions
            tfidf_matrix = self.tfidf_vectorizer.transform(texts)
            topic_distributions = self.lda_model.transform(tfidf_matrix)

            # Get top words for each topic
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            topics = []

            for topic_idx, topic in enumerate(self.lda_model.components_):
                top_words = [feature_names[i] for i in topic.argsort()[-10:]]
                topics.append({
                    'id': topic_idx,
                    'top_words': top_words,
                    'size': int(topic.sum())
                })

            # Analyze topic distribution for each work
            work_topics = []
            for i, (work, distribution) in enumerate(zip(work_info, topic_distributions)):
                dominant_topic = distribution.argmax()
                work_topics.append({
                    'work_id': work['id'],
                    'title': work['title'],
                    'author': work['author'],
                    'dominant_topic': int(dominant_topic),
                    'topic_distribution': distribution.tolist()
                })

            return {
                'topics': topics,
                'work_topics': work_topics,
                'total_works': len(work_info),
                'analysis_timestamp': datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Error analyzing content topics: {e}")
            return {"error": "Topic analysis failed"}

    def get_content_insights(self, work_id: int) -> Dict[str, Any]:
        """
        Get AI-powered insights for a specific work.

        Args:
            work_id: Work ID to analyze

        Returns:
            Content insights and analysis
        """
        try:
            work = self.db.query(Work).filter(Work.id == work_id).first()
            if not work:
                return {"error": "Work not found"}

            metadata = work.metadata or {}
            insights = {
                'work_id': work_id,
                'title': work.title,
                'author': work.author,
                'basic_insights': {},
                'content_analysis': {},
                'recommendations': [],
                'similar_works': []
            }

            # Basic insights
            insights['basic_insights'] = {
                'media_type': work.media_type,
                'language': work.language,
                'public_domain_year': work.public_domain_year,
                'has_full_content': 'content' in metadata,
                'content_length': len(metadata.get('content', '')) if 'content' in metadata else 0,
                'trend_score': metadata.get('trend_score', 0)
            }

            # Content analysis
            if 'content' in metadata and metadata['content']:
                content = metadata['content']
                insights['content_analysis'] = self._analyze_single_content(content, work.title)

            # Get similar works
            if self.content_vectors and work_id in self.content_vectors:
                similar_works = self._find_similar_works(work_id, limit=5)
                insights['similar_works'] = similar_works

            # Get recommendations based on this work
            recommendations = self.get_content_recommendations(
                user_id=work.user_id or 1,
                content_ids=[work_id],
                limit=5,
                include_metadata=True
            )
            insights['recommendations'] = recommendations

            return insights

        except Exception as e:
            logger.error(f"Error getting content insights: {e}")
            return {"error": "Content analysis failed"}

    def _analyze_single_content(self, content: str, title: str) -> Dict[str, Any]:
        """Analyze a single piece of content."""
        try:
            analysis = {
                'word_count': len(content.split()),
                'character_count': len(content),
                'sentence_count': len(re.split(r'[.!?]+', content)),
                'avg_word_length': 0,
                'complexity_score': 0,
                'topics': [],
                'sentiment': 'neutral'
            }

            if analysis['word_count'] > 0:
                analysis['avg_word_length'] = analysis['character_count'] / analysis['word_count']

            # Simple complexity score based on word length and sentence structure
            words = content.split()
            long_words = [word for word in words if len(word) > 6]
            analysis['complexity_score'] = (len(long_words) / len(words)) * 100 if words else 0

            # Extract potential topics (simple keyword extraction)
            content_lower = content.lower()
            potential_topics = []
            common_words = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']

            for word in words:
                word_clean = re.sub(r'[^\w]', '', word.lower())
                if (len(word_clean) >= 4 and
                    word_clean not in common_words and
                    content_lower.count(word_clean) >= 2):
                    potential_topics.append(word_clean)

            # Get most common potential topics
            if potential_topics:
                topic_counts = Counter(potential_topics)
                analysis['topics'] = [word for word, count in topic_counts.most_common(5)]

            # Simple sentiment analysis (very basic)
            positive_words = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'like', 'best']
            negative_words = ['bad', 'terrible', 'awful', 'hate', 'worst', 'boring', 'stupid']

            positive_count = sum(1 for word in positive_words if word in content_lower)
            negative_count = sum(1 for word in negative_words if word in content_lower)

            if positive_count > negative_count:
                analysis['sentiment'] = 'positive'
            elif negative_count > positive_count:
                analysis['sentiment'] = 'negative'
            else:
                analysis['sentiment'] = 'neutral'

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing single content: {e}")
            return {}

    def _find_similar_works(self, work_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Find works similar to the given work."""
        try:
            if work_id not in self.content_vectors:
                return []

            target_vector = self.content_vectors[work_id]
            similar_works = []

            for other_id, vector in self.content_vectors.items():
                if other_id == work_id:
                    continue

                similarity = cosine_similarity([target_vector], [vector])[0][0]

                if similarity > 0.2:  # Similarity threshold
                    work = self.db.query(Work).filter(Work.id == other_id).first()
                    if work:
                        similar_works.append({
                            'work_id': other_id,
                            'title': work.title,
                            'author': work.author,
                            'similarity_score': float(similarity)
                        })

            # Sort by similarity and return top results
            similar_works.sort(key=lambda x: x['similarity_score'], reverse=True)
            return similar_works[:limit]

        except Exception as e:
            logger.error(f"Error finding similar works: {e}")
            return []

    def get_trend_predictions(self, days_ahead: int = 30) -> Dict[str, Any]:
        """
        Get trend predictions based on historical data.

        Args:
            days_ahead: Number of days to predict ahead

        Returns:
            Trend predictions and analysis
        """
        try:
            # Get works with trend scores
            works = self.db.query(Work).filter(
                Work.metadata.has_key('trend_score')
            ).all()

            if not works:
                return {"error": "No trend data available"}

            # Analyze trend patterns
            trend_data = []
            for work in works:
                metadata = work.metadata or {}
                trend_score = metadata.get('trend_score', 0)
                if trend_score > 0:
                    trend_data.append({
                        'work_id': work.id,
                        'title': work.title,
                        'trend_score': trend_score,
                        'created_at': work.created_at,
                        'media_type': work.media_type,
                        'author': work.author
                    })

            if not trend_data:
                return {"error": "No trend data available"}

            # Simple trend analysis
            current_date = datetime.utcnow()
            recent_works = [w for w in trend_data
                          if (current_date - w['created_at']).days <= 30]

            if not recent_works:
                return {"error": "No recent trend data available"}

            # Calculate average trend scores by media type
            media_trends = defaultdict(list)
            for work in recent_works:
                media_trends[work['media_type']].append(work['trend_score'])

            trend_predictions = {}
            for media_type, scores in media_trends.items():
                if scores:
                    avg_score = sum(scores) / len(scores)
                    # Simple prediction: assume current trend continues
                    trend_predictions[media_type] = {
                        'current_avg': avg_score,
                        'predicted_trend': 'stable' if avg_score < 50 else 'rising',
                        'confidence': min(0.7, len(scores) / 10),  # Confidence based on sample size
                        'sample_size': len(scores)
                    }

            return {
                'trend_predictions': trend_predictions,
                'total_works_analyzed': len(trend_data),
                'recent_works': len(recent_works),
                'prediction_horizon_days': days_ahead,
                'analysis_timestamp': current_date.isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting trend predictions: {e}")
            return {"error": "Trend prediction failed"}

# Global AI service instance
_ai_service = None

def get_ai_insights_service() -> AIInsightsService:
    """
    Get or create AI insights service instance.

    Returns:
        AIInsightsService instance
    """
    global _ai_service
    if _ai_service is None:
        _ai_service = AIInsightsService()
    return _ai_service
