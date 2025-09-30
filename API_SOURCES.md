# 🌐 Public Domain Hunter - Comprehensive API Sources Guide

This guide details all major public domain content sources and their APIs for building a comprehensive content discovery platform.

## 📚 Primary Content Sources

### 1. Project Gutenberg
**Website**: https://www.gutenberg.org/
**API Type**: REST API, RDF Catalog
**Content**: 70,000+ public domain books

**API Endpoints**:
```bash
# Catalog API (RDF/XML)
https://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.zip

# Text Search API
https://gutendex.com/books/ (Unofficial API)

# Recent additions
https://www.gutenberg.org/browse/recent/last1
```

**Rate Limits**: 1,000 requests/hour
**Authentication**: None required
**Cost**: Free

**Integration Code Example**:
```python
import requests
import xml.etree.ElementTree as ET

def get_gutenberg_books():
    response = requests.get("https://gutendex.com/books/")
    books = response.json().get('results', [])

    for book in books:
        if book['copyright'] == False:  # Public domain
            yield {
                'title': book['title'],
                'author': ', '.join([author['name'] for author in book['authors']]),
                'download_url': book['formats']['text/plain'],
                'gutenberg_id': book['id'],
                'language': book['languages'][0] if book['languages'] else 'en',
                'subjects': book['subjects']
            }
```

---

### 2. Internet Archive
**Website**: https://archive.org/
**API Type**: REST API, Search API, Metadata API
**Content**: 35+ million items (books, movies, audio, etc.)

**API Endpoints**:
```bash
# Search API
https://archive.org/advancedsearch.php

# Metadata API
https://archive.org/metadata/{identifier}

# Full text search
https://archive.org/services/search/v1/scrape
```

**Rate Limits**: 1,500 requests/hour (registered), 150/hour (anonymous)
**Authentication**: API key recommended for higher limits
**Cost**: Free (API key: $100/year for higher limits)

**Integration Code Example**:
```python
import requests

def search_archive(query, media_type='texts'):
    params = {
        'q': f'{query} AND mediatype:{media_type}',
        'fl[]': 'identifier,title,creator,date,publicdate,licenseurl',
        'rows': 50,
        'output': 'json'
    }

    response = requests.get('https://archive.org/advancedsearch.php', params=params)
    results = response.json().get('response', {}).get('docs', [])

    for item in results:
        if 'public domain' in item.get('licenseurl', '').lower():
            yield {
                'title': item['title'],
                'author': item.get('creator', 'Unknown'),
                'archive_id': item['identifier'],
                'publication_date': item.get('date', ''),
                'added_date': item.get('publicdate', ''),
                'download_url': f"https://archive.org/download/{item['identifier']}"
            }
```

---

### 3. HathiTrust Digital Library
**Website**: https://www.hathitrust.org/
**API Type**: SRU Search API, OAI-PMH
**Content**: 17+ million volumes

**API Endpoints**:
```bash
# SRU Search API
https://catalog.hathitrust.org/Search/SearchServlet

# Bib API (for metadata)
https://catalog.hathitrust.org/api/volumes/brief/{htid}.json

# Full text search (restricted)
https://babel.hathitrust.org/cgi/ls
```

**Rate Limits**: Varies by institution
**Authentication**: IP-based institutional access
**Cost**: Free for member institutions

**Integration Notes**:
- Requires institutional partnership for full access
- Public domain determination requires rights information
- Limited API for external users

---

### 4. Europeana
**Website**: https://www.europeana.eu/
**API Type**: REST API, SPARQL endpoint
**Content**: 50+ million cultural heritage items

**API Endpoints**:
```bash
# Search API
https://api.europeana.eu/record/v2/search.json

# Record API
https://api.europeana.eu/record/v2/{dataset}/{id}.json

# SPARQL endpoint
https://api.europeana.eu/sparql
```

**Rate Limits**: 10,000 requests/day
**Authentication**: API key required
**Cost**: Free (registration required)

**Integration Code Example**:
```python
import requests

def search_europeana(api_key, query):
    params = {
        'wskey': api_key,
        'query': f'{query} AND public_domain:true',
        'rows': 100,
        'profile': 'rich'
    }

    response = requests.get('https://api.europeana.eu/record/v2/search.json', params=params)
    items = response.json().get('items', [])

    for item in items:
        if item.get('edmRights', {}).get('def') == 'public_domain':
            yield {
                'title': item.get('title', ['Unknown'])[0],
                'creator': item.get('dcCreator', ['Unknown'])[0],
                'year': item.get('year', [''])[0],
                'europeana_id': item['id'],
                'thumbnail': item.get('edmPreview', [''])[0],
                'dataProvider': item.get('dataProvider', [''])[0]
            }
```

---

## 🌍 Regional & National Libraries

### 5. Digital Public Library of America (DPLA)
**Website**: https://dp.la/
**API Type**: REST API
**Content**: 40+ million items from US institutions

**API Endpoints**:
```bash
# Search API
https://api.dp.la/v2/items
```

**Rate Limits**: 1,000 requests/hour
**Authentication**: API key required
**Cost**: Free

### 6. Library of Congress
**Website**: https://www.loc.gov/
**API Type**: SRU Search, IIIF API
**Content**: Digital collections and manuscripts

**API Endpoints**:
```bash
# Search API
https://www.loc.gov/search/

# IIIF Manifests
https://tile.loc.gov/image-services/iiif/service:pnp:
```

### 7. British Library
**Website**: https://www.bl.uk/
**API Type**: SPARQL endpoint, IIIF
**Content**: 170+ million items

**API Endpoints**:
```bash
# SPARQL endpoint
https://data.bl.uk/bl_sparql/
```

### 8. Gallica (Bibliothèque nationale de France)
**Website**: https://gallica.bnf.fr/
**API Type**: SRU Search API
**Content**: 10+ million documents

**API Endpoints**:
```bash
# Search API
https://gallica.bnf.fr/SRU
```

---

## 📖 Academic & Research Sources

### 9. Directory of Open Access Books (DOAB)
**Website**: https://www.doabooks.org/
**API Type**: OAI-PMH
**Content**: 50,000+ academic books

**API Endpoints**:
```bash
# OAI-PMH endpoint
https://www.doabooks.org/oai/request
```

### 10. Biodiversity Heritage Library
**Website**: https://www.biodiversitylibrary.org/
**API Type**: REST API
**Content**: 55+ million pages of biodiversity literature

**API Endpoints**:
```bash
# API v2
https://www.biodiversitylibrary.org/api2/
```

### 11. Perseus Digital Library
**Website**: https://www.perseus.tufts.edu/
**API Type**: Custom API, SPARQL
**Content**: Classical texts and manuscripts

---

## 🏛️ International Organizations

### 12. UNESCO World Digital Library
**Website**: https://www.wdl.org/
**API Type**: Custom search interface
**Content**: Cultural artifacts from around the world

### 13. International Music Score Library Project (IMSLP)
**Website**: https://imslp.org/
**API Type**: Web scraping (no official API)
**Content**: 150,000+ public domain scores

---

## 🔧 Integration Strategy

### Multi-Source Content Pipeline

```python
class PublicDomainAggregator:
    def __init__(self, api_keys):
        self.sources = {
            'gutenberg': GutenbergAPI(),
            'archive': InternetArchiveAPI(api_keys.get('archive')),
            'europeana': EuropeanaAPI(api_keys.get('europeana')),
            'dpla': DPLAAPI(api_keys.get('dpla'))
        }

    def search_all_sources(self, query):
        results = []
        for source_name, source_api in self.sources.items():
            try:
                source_results = source_api.search(query)
                for result in source_results:
                    result['source'] = source_name
                    results.append(result)
            except Exception as e:
                print(f"Error with {source_name}: {e}")
        return results
```

### Data Standardization

```python
def standardize_metadata(item, source):
    """Convert source-specific metadata to common format"""
    return {
        'id': item.get(f'{source}_id', item.get('id')),
        'title': item.get('title', 'Unknown'),
        'author': item.get('author') or item.get('creator', 'Unknown'),
        'publication_year': extract_year(item),
        'public_domain_year': determine_pd_year(item, source),
        'media_type': determine_media_type(item),
        'language': item.get('language', 'en'),
        'description': item.get('description', ''),
        'download_url': item.get('download_url'),
        'thumbnail_url': item.get('thumbnail'),
        'source_url': item.get('source_url'),
        'rights_status': item.get('rights', 'public_domain'),
        'metadata': item  # Keep original metadata
    }
```

### Rate Limiting & Caching Strategy

```python
import time
from functools import lru_cache
import redis

class APIRateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.limits = {
            'gutenberg': (1000, 3600),  # 1000 per hour
            'archive': (1500, 3600),    # 1500 per hour
            'europeana': (10000, 86400), # 10000 per day
            'dpla': (1000, 3600)        # 1000 per hour
        }

    def can_make_request(self, source):
        key = f"api_calls:{source}"
        current = self.redis.get(key) or 0

        limit, window = self.limits[source]
        if current >= limit:
            return False

        self.redis.incr(key)
        self.redis.expire(key, window)
        return True
```

## 📊 Content Statistics by Source

| Source | Content Volume | Update Frequency | API Reliability |
|--------|----------------|------------------|------------------|
| **Project Gutenberg** | 70,000+ books | Daily | ⭐⭐⭐⭐⭐ |
| **Internet Archive** | 35M+ items | Hourly | ⭐⭐⭐⭐ |
| **HathiTrust** | 17M+ volumes | Weekly | ⭐⭐⭐ |
| **Europeana** | 50M+ items | Daily | ⭐⭐⭐⭐ |
| **DPLA** | 40M+ items | Daily | ⭐⭐⭐⭐ |
| **British Library** | 170M+ items | Weekly | ⭐⭐⭐ |
| **Biodiversity Heritage** | 55M+ pages | Monthly | ⭐⭐⭐⭐ |

## 🔑 API Keys Required

| Source | API Key Required | Registration | Cost |
|--------|------------------|--------------|------|
| Project Gutenberg | No | No | Free |
| Internet Archive | Optional | Yes | Free/$100 |
| Europeana | Yes | Yes | Free |
| DPLA | Yes | Yes | Free |
| Library of Congress | No | No | Free |
| British Library | No | No | Free |

## 🚨 Legal & Ethical Considerations

### Public Domain Determination

```python
def determine_public_domain_status(item, source):
    """Determine if work is in public domain"""

    # US Public Domain Rules
    if source in ['gutenberg', 'archive']:
        publication_year = extract_publication_year(item)

        # US: Published before 1928 = public domain
        if publication_year and publication_year < 1928:
            return 'public_domain'

        # US: Published 1928-1963, not renewed = public domain
        if publication_year and 1928 <= publication_year <= 1963:
            # Check renewal status in item metadata
            return check_copyright_renewal(item)

    # EU Public Domain Rules (70 years post-mortem)
    if source == 'europeana':
        death_year = item.get('death_year')
        if death_year and (datetime.now().year - death_year) > 70:
            return 'public_domain'

    return 'unknown'
```

### Content Restrictions

- **Respect API terms of service**
- **Implement proper attribution**
- **Cache content appropriately**
- **Monitor for takedown requests**
- **Geographic licensing restrictions**

## 🎯 Implementation Priority

### Phase 1 (MVP)
1. **Project Gutenberg** - Easy integration, reliable
2. **Internet Archive** - Most comprehensive collection

### Phase 2 (Growth)
3. **Europeana** - European cultural content
4. **DPLA** - US institutional content

### Phase 3 (Scale)
5. **HathiTrust** - Academic collections
6. **British Library** - International scope

This comprehensive API integration will provide your platform with access to hundreds of millions of public domain works across books, manuscripts, images, audio, and video content from the world's most prestigious cultural institutions.
