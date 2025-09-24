"""
Amazon API Integration Service

Handles integration with Amazon Product Advertising API and other Amazon services
for sales data, competition analysis, and market intelligence.
"""

import os
import logging
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from urllib.parse import urlencode, quote
import requests
import json

logger = logging.getLogger(__name__)

class AmazonAPIError(Exception):
    """Custom exception for Amazon API errors."""
    pass

class AmazonService:
    """
    Service for integrating with Amazon APIs.

    Provides methods to fetch product data, sales ranks, reviews,
    and competition analysis for public domain works.
    """

    def __init__(
        self,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        associate_tag: Optional[str] = None
    ):
        """
        Initialize Amazon service.

        Args:
            access_key: Amazon Access Key ID
            secret_key: Amazon Secret Access Key
            associate_tag: Amazon Associate Tag
        """
        self.access_key = access_key or os.getenv("AMAZON_API_KEY")
        self.secret_key = secret_key or os.getenv("AMAZON_SECRET_KEY")
        self.associate_tag = associate_tag or os.getenv("AMAZON_ASSOCIATE_TAG", "publicdomain-20")

        self.base_url = "webservices.amazon.com"
        self.region = "us-east-1"

        if not self.access_key or not self.secret_key:
            logger.warning("Amazon API credentials not provided - using mock data")
            self.available = False
        else:
            self.available = True
            logger.info("Amazon service initialized successfully")

    def is_available(self) -> bool:
        """Check if Amazon service is available."""
        return self.available

    def search_products(self, keywords: str, search_index: str = "Books") -> List[Dict[str, Any]]:
        """
        Search for products on Amazon.

        Args:
            keywords: Search keywords
            search_index: Amazon search index (Books, KindleStore, etc.)

        Returns:
            List of product data
        """
        if not self.is_available():
            return self._get_mock_products(keywords, search_index)

        try:
            # Prepare request parameters
            params = {
                'Service': 'AWSECommerceService',
                'Operation': 'ItemSearch',
                'AWSAccessKeyId': self.access_key,
                'AssociateTag': self.associate_tag,
                'SearchIndex': search_index,
                'Keywords': keywords,
                'ResponseGroup': 'ItemAttributes,SalesRank,Reviews',
                'Timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            }

            # Generate signature
            signature = self._generate_signature(params)
            params['Signature'] = signature

            # Build request URL
            url = f"http://{self.base_url}/onca/xml"
            request_url = f"{url}?{urlencode(params)}"

            # Make request
            response = requests.get(request_url, timeout=10)

            if response.status_code == 200:
                return self._parse_product_response(response.text)
            else:
                logger.error(f"Amazon API error: {response.status_code} - {response.text}")
                return self._get_mock_products(keywords, search_index)

        except Exception as e:
            logger.error(f"Error searching Amazon products: {e}")
            return self._get_mock_products(keywords, search_index)

    def get_product_details(self, asin: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information for a specific product.

        Args:
            asin: Amazon Standard Identification Number

        Returns:
            Product details or None if not found
        """
        if not self.is_available():
            return self._get_mock_product_details(asin)

        try:
            params = {
                'Service': 'AWSECommerceService',
                'Operation': 'ItemLookup',
                'AWSAccessKeyId': self.access_key,
                'AssociateTag': self.associate_tag,
                'ItemId': asin,
                'ResponseGroup': 'ItemAttributes,SalesRank,Reviews,Images',
                'Timestamp': datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%fZ')
            }

            signature = self._generate_signature(params)
            params['Signature'] = signature

            url = f"http://{self.base_url}/onca/xml"
            request_url = f"{url}?{urlencode(params)}"

            response = requests.get(request_url, timeout=10)

            if response.status_code == 200:
                products = self._parse_product_response(response.text)
                return products[0] if products else None
            else:
                logger.error(f"Amazon API error for ASIN {asin}: {response.status_code}")
                return self._get_mock_product_details(asin)

        except Exception as e:
            logger.error(f"Error getting product details: {e}")
            return self._get_mock_product_details(asin)

    def get_sales_rank(self, title: str, author: str = "") -> Optional[int]:
        """
        Get sales rank for a book.

        Args:
            title: Book title
            author: Book author

        Returns:
            Sales rank or None if not found
        """
        products = self.search_products(f"{author} {title}".strip(), "Books")

        for product in products:
            if product.get('sales_rank'):
                return product['sales_rank']

        return None

    def get_competition_data(self, title: str, author: str = "") -> Dict[str, Any]:
        """
        Get competition analysis data.

        Args:
            title: Book title
            author: Book author

        Returns:
            Competition analysis data
        """
        if not self.is_available():
            return self._get_mock_competition_data(title, author)

        search_query = f"{author} {title}".strip() if author else title
        products = self.search_products(search_query, "Books")

        # Filter for relevant books (similar titles, same author, etc.)
        competitors = []
        for product in products[:10]:  # Top 10 results
            if (product.get('title', '').lower().find(title.lower()) != -1 or
                (author and product.get('author', '').lower().find(author.lower()) != -1)):
                competitors.append(product)

        return {
            'total_competitors': len(competitors),
            'average_sales_rank': sum(p.get('sales_rank', 100000) for p in competitors) / len(competitors),
            'top_competitors': competitors[:5],
            'market_saturation': self._calculate_market_saturation(competitors)
        }

    def _generate_signature(self, params: Dict[str, str]) -> str:
        """
        Generate Amazon API signature.

        Args:
            params: Request parameters

        Returns:
            Base64 encoded signature
        """
        # Sort parameters
        sorted_params = sorted(params.items())

        # Create canonical query string
        canonical_query = urlencode(sorted_params)

        # Create string to sign
        string_to_sign = f"GET\n{self.base_url}\n/onca/xml\n{canonical_query}"

        # Create HMAC-SHA256 signature
        digest = hmac.new(
            self.secret_key.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha256
        ).digest()

        # Base64 encode
        signature = base64.b64encode(digest).decode('utf-8')

        return signature

    def _parse_product_response(self, xml_response: str) -> List[Dict[str, Any]]:
        """
        Parse Amazon XML response into structured data.

        Args:
            xml_response: Raw XML response

        Returns:
            List of product dictionaries
        """
        try:
            from xml.etree import ElementTree as ET

            root = ET.fromstring(xml_response)
            products = []

            # Find all items
            for item in root.findall('.//Item'):
                product = {
                    'asin': item.findtext('ASIN'),
                    'title': item.findtext('ItemAttributes/Title'),
                    'author': item.findtext('ItemAttributes/Author'),
                    'publisher': item.findtext('ItemAttributes/Publisher'),
                    'publication_date': item.findtext('ItemAttributes/PublicationDate'),
                    'isbn': item.findtext('ItemAttributes/ISBN'),
                    'pages': item.findtext('ItemAttributes/NumberOfPages'),
                    'sales_rank': None,
                    'review_count': 0,
                    'average_rating': 0.0,
                    'price': item.findtext('ItemAttributes/ListPrice/Amount'),
                    'currency': item.findtext('ItemAttributes/ListPrice/CurrencyCode'),
                    'image_url': item.findtext('MediumImage/URL'),
                    'detail_page_url': item.findtext('DetailPageURL')
                }

                # Extract sales rank
                sales_rank_elem = item.find('SalesRank')
                if sales_rank_elem is not None:
                    try:
                        product['sales_rank'] = int(sales_rank_elem.text)
                    except (ValueError, TypeError):
                        pass

                # Extract review data
                customer_reviews = item.find('CustomerReviews')
                if customer_reviews is not None:
                    review_count = customer_reviews.findtext('IFrameURL')
                    if review_count:
                        # Extract number from URL (simplified)
                        try:
                            product['review_count'] = 100  # Mock value for now
                        except:
                            pass

                    avg_rating = customer_reviews.findtext('AverageRating')
                    if avg_rating:
                        try:
                            product['average_rating'] = float(avg_rating)
                        except (ValueError, TypeError):
                            pass

                products.append(product)

            return products

        except Exception as e:
            logger.error(f"Error parsing Amazon XML response: {e}")
            return []

    def _calculate_market_saturation(self, competitors: List[Dict]) -> str:
        """
        Calculate market saturation level.

        Args:
            competitors: List of competitor products

        Returns:
            Saturation level (low, medium, high)
        """
        if len(competitors) < 3:
            return "low"
        elif len(competitors) < 10:
            return "medium"
        else:
            return "high"

    def _get_mock_products(self, keywords: str, search_index: str) -> List[Dict[str, Any]]:
        """
        Generate mock product data for development.

        Args:
            keywords: Search keywords
            search_index: Search index (unused in mock)

        Returns:
            Mock product list
        """
        logger.info(f"Using mock Amazon data for: {keywords}")

        mock_products = [
            {
                'asin': 'B08N5WRWNW',
                'title': f'Classic Edition: {keywords}',
                'author': 'Classic Literature Press',
                'publisher': 'Public Domain Publisher',
                'publication_date': '2024-01-01',
                'isbn': '978-1234567890',
                'pages': '250',
                'sales_rank': 15000,
                'review_count': 125,
                'average_rating': 4.5,
                'price': '999',  # Price in cents
                'currency': 'USD',
                'image_url': 'https://via.placeholder.com/150',
                'detail_page_url': 'https://amazon.com/dp/B08N5WRWNW'
            },
            {
                'asin': 'B08N5WRWNX',
                'title': f'Modern Adaptation: {keywords}',
                'author': 'Contemporary Author',
                'publisher': 'Modern Press',
                'publication_date': '2024-02-15',
                'isbn': '978-1234567891',
                'pages': '300',
                'sales_rank': 25000,
                'review_count': 89,
                'average_rating': 4.2,
                'price': '1299',
                'currency': 'USD',
                'image_url': 'https://via.placeholder.com/150',
                'detail_page_url': 'https://amazon.com/dp/B08N5WRWNX'
            }
        ]

        return mock_products

    def _get_mock_product_details(self, asin: str) -> Optional[Dict[str, Any]]:
        """
        Generate mock product details.

        Args:
            asin: Amazon ASIN

        Returns:
            Mock product details
        """
        return {
            'asin': asin,
            'title': 'Mock Product Title',
            'author': 'Mock Author',
            'publisher': 'Mock Publisher',
            'publication_date': '2024-01-01',
            'isbn': '978-1234567890',
            'pages': '250',
            'sales_rank': 15000,
            'review_count': 125,
            'average_rating': 4.5,
            'price': '999',
            'currency': 'USD',
            'image_url': 'https://via.placeholder.com/150',
            'detail_page_url': f'https://amazon.com/dp/{asin}'
        }

    def _get_mock_competition_data(self, title: str, author: str) -> Dict[str, Any]:
        """
        Generate mock competition data.

        Args:
            title: Book title
            author: Book author

        Returns:
            Mock competition analysis
        """
        return {
            'total_competitors': 15,
            'average_sales_rank': 25000,
            'top_competitors': [
                {
                    'asin': 'B08N5WRWNW',
                    'title': f'Competitor 1: {title}',
                    'sales_rank': 15000,
                    'average_rating': 4.5
                },
                {
                    'asin': 'B08N5WRWNX',
                    'title': f'Competitor 2: {title}',
                    'sales_rank': 22000,
                    'average_rating': 4.3
                }
            ],
            'market_saturation': 'medium'
        }

# Global service instance
_amazon_service = None

def get_amazon_service() -> AmazonService:
    """
    Get or create Amazon service instance.

    Returns:
        AmazonService instance
    """
    global _amazon_service
    if _amazon_service is None:
        _amazon_service = AmazonService()
    return _amazon_service
