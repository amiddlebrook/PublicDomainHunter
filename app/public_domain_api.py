"""
Public Domain Content Sources Integration

This module provides unified access to multiple public domain content sources
for the Public Domain Hunter platform.
"""

import asyncio
import logging
from typing import List, Dict, Optional, AsyncGenerator
from dataclasses import dataclass
from datetime import datetime, timedelta
import httpx
import redis

logger = logging.getLogger(__name__)

@dataclass
class PublicDomainWork:
    """Standardized public domain work metadata"""
    id: str
    title: str
    author: str
    publication_year: Optional[int]
    public_domain_year: Optional[int]
    media_type: str  # book, document, image, audio, video, patent, trademark, scientific_paper, music_score
    language: str
    description: str
    download_url: Optional[str]
    thumbnail_url: Optional[str]
    source_url: str
    source: str  # gutenberg, archive, europeana, etc.
    rights_status: str  # public_domain, copyrighted, unknown
    metadata: Dict  # Original source metadata

class PublicDomainAPI:
    """Base class for public domain content APIs"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search(self, query: str, limit: int = 50) -> List[PublicDomainWork]:
        """Search for public domain works"""
        raise NotImplementedError

    async def get_by_id(self, work_id: str) -> Optional[PublicDomainWork]:
        """Get specific work by ID"""
        raise NotImplementedError

    async def close(self):
        await self.client.aclose()

class GutenbergAPI(PublicDomainAPI):
    """Project Gutenberg API integration"""

    BASE_URL = "https://gutendex.com"

    async def search(self, query: str, limit: int = 50) -> List[PublicDomainWork]:
        """Search Gutenberg catalog"""
        params = {
            'search': query,
            'copyright': 'false',  # Public domain only
            'languages': 'en',     # English only for now
        }

        response = await self.client.get(f"{self.BASE_URL}/books/", params=params)
        response.raise_for_status()

        data = response.json()
        results = []

        for book in data.get('results', [])[:limit]:
            work = await self._parse_gutenberg_book(book)
            if work:
                results.append(work)

        return results

    async def _parse_gutenberg_book(self, book: Dict) -> Optional[PublicDomainWork]:
        """Parse Gutenberg book metadata"""
        try:
            # Extract publication year from various fields
            pub_year = None
            for field in ['first_publish_date', 'publish_date']:
                if book.get(field):
                    pub_year = self._extract_year(book[field])
                    break

            return PublicDomainWork(
                id=f"gutenberg_{book['id']}",
                title=book['title'],
                author=', '.join([author['name'] for author in book['authors']]),
                publication_year=pub_year,
                public_domain_year=self._determine_pd_year(pub_year),
                media_type='book',
                language=book['languages'][0] if book['languages'] else 'en',
                description=f"Gutenberg eBook: {book['title']}",
                download_url=book['formats'].get('text/plain'),
                thumbnail_url=None,
                source_url=f"https://gutenberg.org/ebooks/{book['id']}",
                source='gutenberg',
                rights_status='public_domain',
                metadata=book
            )
        except Exception as e:
            logger.error(f"Error parsing Gutenberg book: {e}")
            return None

    def _extract_year(self, date_str: str) -> Optional[int]:
        """Extract year from various date formats"""
        if not date_str:
            return None

        # Handle formats like "2023-01-01", "2023", "January 2023"
        for part in str(date_str).split():
            if part.isdigit() and len(part) == 4:
                return int(part)
        return None

    def _determine_pd_year(self, pub_year: Optional[int]) -> Optional[int]:
        """Determine when work entered public domain"""
        if not pub_year:
            return None

        # US public domain rules (simplified)
        if pub_year < 1928:
            return pub_year  # Already public domain
        elif pub_year < 1978:
            return pub_year + 28  # 28-year copyright term
        else:
            return pub_year + 70  # Life + 70 years (author deceased)

class InternetArchiveAPI(PublicDomainAPI):
    """Internet Archive API integration"""

    BASE_URL = "https://archive.org"

    async def search(self, query: str, limit: int = 50) -> List[PublicDomainWork]:
        """Search Internet Archive"""
        params = {
            'q': f'{query} AND mediatype:texts',
            'fl[]': 'identifier,title,creator,date,publicdate,licenseurl,subject',
            'rows': limit,
            'output': 'json',
            'sort[]': 'publicdate desc'  # Most recent first
        }

        response = await self.client.get(f"{self.BASE_URL}/advancedsearch.php", params=params)
        response.raise_for_status()

        data = response.json()
        results = []

        for item in data.get('response', {}).get('docs', []):
            work = await self._parse_archive_item(item)
            if work:
                results.append(work)

        return results

    async def _parse_archive_item(self, item: Dict) -> Optional[PublicDomainWork]:
        """Parse Internet Archive item"""
        try:
            # Check if public domain
            license_url = item.get('licenseurl', '')
            if not any(pd_term in license_url.lower() for pd_term in ['public domain', 'no known copyright']):
                return None

            pub_year = self._extract_year(item.get('date', ''))

            return PublicDomainWork(
                id=f"archive_{item['identifier']}",
                title=item['title'],
                author=item.get('creator', 'Unknown'),
                publication_year=pub_year,
                public_domain_year=pub_year,
                media_type=self._determine_media_type(item),
                language='en',  # Default, could be extracted from metadata
                description=f"Internet Archive item: {item['title']}",
                download_url=f"{self.BASE_URL}/download/{item['identifier']}",
                thumbnail_url=None,
                source_url=f"{self.BASE_URL}/details/{item['identifier']}",
                source='archive',
                rights_status='public_domain',
                metadata=item
            )
        except Exception as e:
            logger.error(f"Error parsing Archive item: {e}")
            return None

    def _determine_media_type(self, item: Dict) -> str:
        """Determine media type from Archive metadata"""
        subjects = item.get('subject', [])

        # Check subjects for media type hints
        subject_text = ' '.join(subjects).lower()

        if any(word in subject_text for word in ['patent', 'patents', 'invention', 'inventor']):
            return 'patent'
        elif any(word in subject_text for word in ['trademark', 'trade mark', 'brand']):
            return 'trademark'
        elif any(word in subject_text for word in ['research', 'journal', 'scientific', 'paper', 'study']):
            return 'scientific_paper'
        elif any(word in subject_text for word in ['audio', 'sound', 'music', 'recording', 'score', 'sheet music']):
            return 'audio'
        elif any(word in subject_text for word in ['video', 'film', 'movie']):
            return 'video'
        elif any(word in subject_text for word in ['image', 'photo', 'picture']):
            return 'image'
        else:
            return 'book'

class EuropeanaAPI(PublicDomainAPI):
    """Europeana API integration"""

    BASE_URL = "https://api.europeana.eu/record/v2"

    async def search(self, query: str, limit: int = 50) -> List[PublicDomainWork]:
        """Search Europeana collections"""
        params = {
            'wskey': self.api_key,
            'query': f'{query} AND public_domain:true',
            'rows': limit,
            'profile': 'rich',
            'qf': 'TYPE:TEXT'  # Focus on text content
        }

        response = await self.client.get(f"{self.BASE_URL}/search.json", params=params)
        response.raise_for_status()

        data = response.json()
        results = []

        for item in data.get('items', []):
            work = await self._parse_europeana_item(item)
            if work:
                results.append(work)

        return results

    async def _parse_europeana_item(self, item: Dict) -> Optional[PublicDomainWork]:
        """Parse Europeana item metadata"""
        try:
            # Extract rights information
            rights = item.get('edmRights', {})
            if rights.get('def') != 'public_domain':
                return None

            return PublicDomainWork(
                id=f"europeana_{item['id']}",
                title=item.get('title', ['Unknown'])[0],
                author=item.get('dcCreator', ['Unknown'])[0],
                publication_year=self._extract_year(item.get('year', [''])[0]),
                public_domain_year=self._extract_year(item.get('year', [''])[0]),
                media_type=self._determine_media_type(item),
                language=item.get('language', ['en'])[0],
                description=f"Europeana cultural heritage item",
                download_url=item.get('edmIsShownBy', [''])[0],
                thumbnail_url=item.get('edmPreview', [''])[0],
                source_url=f"https://www.europeana.eu/item{item['id']}",
                source='europeana',
                rights_status='public_domain',
                metadata=item
            )
        except Exception as e:
            logger.error(f"Error parsing Europeana item: {e}")
            return None

class PublicDomainAggregator:
    """Unified interface for all public domain sources"""

    def __init__(self, api_keys: Dict[str, str], redis_client=None):
        self.api_keys = api_keys
        self.redis = redis_client
        self.sources = {
            'gutenberg': GutenbergAPI(),
            'archive': InternetArchiveAPI(api_keys.get('archive')),
            'europeana': EuropeanaAPI(api_keys.get('europeana')),
        }

        # Add more sources as needed
        if api_keys.get('dpla'):
            self.sources['dpla'] = DPLAAPI(api_keys['dpla'])

    async def search_all_sources(self, query: str, limit_per_source: int = 25) -> List[PublicDomainWork]:
        """Search across all configured sources"""
        all_results = []

        # Search each source concurrently
        tasks = []
        for source_name, source_api in self.sources.items():
            tasks.append(source_api.search(query, limit_per_source))

        # Execute all searches
        results_by_source = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        for source_name, results in zip(self.sources.keys(), results_by_source):
            if isinstance(results, Exception):
                logger.error(f"Error searching {source_name}: {results}")
                continue

            # Add source attribution
            for work in results:
                work.source = source_name
                all_results.append(work)

        return all_results

    async def get_work_by_id(self, work_id: str) -> Optional[PublicDomainWork]:
        """Get specific work by ID across all sources"""
        source = work_id.split('_')[0]

        if source in self.sources:
            return await self.sources[source].get_by_id(work_id)

        return None

    async def close(self):
        """Close all API connections"""
        for source_api in self.sources.values():
            await source_api.close()

# Additional source classes would be implemented similarly...

class DPLAAPI(PublicDomainAPI):
    """Digital Public Library of America API"""
    BASE_URL = "https://api.dp.la/v2"

    async def search(self, query: str, limit: int = 50) -> List[PublicDomainWork]:
        # Implementation similar to Europeana
        pass

# Example usage
async def example_search():
    """Example of using the aggregator"""

    # Initialize with API keys
    api_keys = {
        'europeana': 'your_europeana_key',
        'archive': 'your_archive_key',  # Optional
        'dpla': 'your_dpla_key'         # Optional
    }

    aggregator = PublicDomainAggregator(api_keys)

    try:
        # Search for classic literature
        results = await aggregator.search_all_sources("Shakespeare Hamlet")

        print(f"Found {len(results)} public domain works:")
        for work in results[:5]:  # Show first 5
            print(f"- {work.title} by {work.author} ({work.source})")

    finally:
        await aggregator.close()

if __name__ == "__main__":
    asyncio.run(example_search())
