"""
Patent Data Sources API Integration

Provides unified access to patent databases:
- USPTO PatentsView API (free, no key required)
- Google Patents Public Datasets (via BigQuery)
- EPO Open Patent Services (free with registration)
- Lens.org (free for research)
"""

import asyncio
import logging
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, date
from enum import Enum
import httpx
import re

logger = logging.getLogger(__name__)


class PatentType(str, Enum):
    UTILITY = "utility"
    DESIGN = "design"
    PLANT = "plant"
    REISSUE = "reissue"


class PatentStatus(str, Enum):
    ACTIVE = "active"  # Patent still in force
    EXPIRED = "expired"  # Term ended
    LAPSED = "lapsed"  # Maintenance fee not paid
    PUBLIC_DOMAIN = "public_domain"  # Confirmed PD


@dataclass
class PatentInventor:
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None


@dataclass
class PatentResult:
    """Standardized patent result from any source"""
    patent_number: str
    title: str
    abstract: Optional[str] = None
    patent_type: PatentType = PatentType.UTILITY
    status: PatentStatus = PatentStatus.PUBLIC_DOMAIN

    # Dates
    filing_date: Optional[date] = None
    grant_date: Optional[date] = None
    expiration_date: Optional[date] = None
    public_domain_date: Optional[date] = None

    # People/Organizations
    inventors: List[PatentInventor] = field(default_factory=list)
    assignee: Optional[str] = None
    current_assignee: Optional[str] = None

    # Classification
    cpc_codes: List[str] = field(default_factory=list)
    ipc_codes: List[str] = field(default_factory=list)
    uspc_codes: List[str] = field(default_factory=list)

    # Content
    claims_count: int = 0
    independent_claims_count: int = 0
    claims_text: Optional[str] = None
    description: Optional[str] = None

    # Citations
    cited_patents: List[str] = field(default_factory=list)
    cited_by_count: int = 0

    # Assets
    drawing_count: int = 0
    drawing_urls: List[str] = field(default_factory=list)

    # Source metadata
    source: str = ""
    source_url: Optional[str] = None
    raw_data: Optional[Dict] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "patent_number": self.patent_number,
            "title": self.title,
            "abstract": self.abstract,
            "patent_type": self.patent_type.value,
            "status": self.status.value,
            "filing_date": self.filing_date.isoformat() if self.filing_date else None,
            "grant_date": self.grant_date.isoformat() if self.grant_date else None,
            "expiration_date": self.expiration_date.isoformat() if self.expiration_date else None,
            "public_domain_date": self.public_domain_date.isoformat() if self.public_domain_date else None,
            "inventors": [{"name": i.name, "city": i.city, "state": i.state, "country": i.country} for i in self.inventors],
            "assignee": self.assignee,
            "cpc_codes": self.cpc_codes,
            "ipc_codes": self.ipc_codes,
            "claims_count": self.claims_count,
            "cited_by_count": self.cited_by_count,
            "drawing_count": self.drawing_count,
            "source": self.source,
            "source_url": self.source_url,
        }


class USPTOPatentsViewAPI:
    """
    USPTO PatentsView API - Free, no API key required

    Provides access to US patent data from 1976 to present.
    Rate limit: ~45 requests/minute (be respectful)

    Docs: https://patentsview.org/apis/api-endpoints
    """

    BASE_URL = "https://api.patentsview.org/patents/query"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search(
        self,
        query: str,
        expired_only: bool = True,
        limit: int = 50,
        offset: int = 0,
        cpc_section: Optional[str] = None,
        year_range: Optional[tuple] = None,
    ) -> List[PatentResult]:
        """
        Search USPTO patents.

        Args:
            query: Search terms (searches title and abstract)
            expired_only: Only return expired/public domain patents
            limit: Max results (up to 1000)
            offset: Pagination offset
            cpc_section: Filter by CPC section (A-H, Y)
            year_range: (start_year, end_year) for grant date
        """
        # Build query criteria
        criteria = []

        # Text search on title and abstract
        if query:
            criteria.append({
                "_or": [
                    {"_text_any": {"patent_title": query}},
                    {"_text_any": {"patent_abstract": query}}
                ]
            })

        # Expired patents filter (granted before 2005 = definitely expired)
        if expired_only:
            # Patents granted 20+ years ago are expired
            cutoff_year = datetime.now().year - 20
            criteria.append({"_lte": {"patent_date": f"{cutoff_year}-12-31"}})

        # CPC section filter
        if cpc_section:
            criteria.append({"_begins": {"cpc_section_id": cpc_section}})

        # Year range filter
        if year_range:
            start_year, end_year = year_range
            criteria.append({"_gte": {"patent_date": f"{start_year}-01-01"}})
            criteria.append({"_lte": {"patent_date": f"{end_year}-12-31"}})

        # Combine criteria
        query_obj = {"_and": criteria} if len(criteria) > 1 else criteria[0] if criteria else {}

        # Fields to retrieve
        fields = [
            "patent_number",
            "patent_title",
            "patent_abstract",
            "patent_date",
            "patent_type",
            "patent_num_claims",
            "patent_num_cited_by_us_patents",
            "patent_num_combined_citations",
        ]

        # Include related entities
        options = {
            "include_subentity_total_counts": True,
        }

        payload = {
            "q": query_obj,
            "f": fields,
            "o": {"page": offset // limit + 1, "per_page": min(limit, 1000)},
            "s": [{"patent_date": "desc"}],
        }

        try:
            response = await self.client.post(
                self.BASE_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for patent in data.get("patents", []):
                result = self._parse_patent(patent)
                if result:
                    results.append(result)

            return results

        except httpx.HTTPError as e:
            logger.error(f"USPTO API error: {e}")
            return []

    async def get_patent(self, patent_number: str) -> Optional[PatentResult]:
        """Get detailed patent information by number."""
        # Normalize patent number
        patent_number = self._normalize_patent_number(patent_number)

        query_obj = {"patent_number": patent_number}

        fields = [
            "patent_number",
            "patent_title",
            "patent_abstract",
            "patent_date",
            "patent_type",
            "patent_num_claims",
            "patent_num_cited_by_us_patents",
            "patent_firstnamed_assignee_city",
            "patent_firstnamed_assignee_country",
        ]

        payload = {
            "q": query_obj,
            "f": fields,
        }

        try:
            response = await self.client.post(
                self.BASE_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()

            patents = data.get("patents", [])
            if patents:
                return self._parse_patent(patents[0])
            return None

        except httpx.HTTPError as e:
            logger.error(f"USPTO API error fetching {patent_number}: {e}")
            return None

    async def get_expiring_soon(self, months: int = 12, limit: int = 100) -> List[PatentResult]:
        """
        Get patents expiring in the next N months.
        These are about to enter public domain.
        """
        today = datetime.now()
        # Patents filed 20 years ago are expiring now
        filing_cutoff_start = today.year - 20
        filing_cutoff_end = today.year - 20 + (months / 12)

        query_obj = {
            "_and": [
                {"_gte": {"app_date": f"{int(filing_cutoff_start)}-01-01"}},
                {"_lte": {"app_date": f"{int(filing_cutoff_end)}-12-31"}},
            ]
        }

        fields = [
            "patent_number",
            "patent_title",
            "patent_abstract",
            "patent_date",
            "app_date",
            "patent_type",
            "patent_num_claims",
        ]

        payload = {
            "q": query_obj,
            "f": fields,
            "o": {"per_page": min(limit, 1000)},
            "s": [{"app_date": "asc"}],
        }

        try:
            response = await self.client.post(
                self.BASE_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for patent in data.get("patents", []):
                result = self._parse_patent(patent)
                if result:
                    results.append(result)

            return results

        except httpx.HTTPError as e:
            logger.error(f"USPTO API error: {e}")
            return []

    async def get_by_cpc(
        self,
        cpc_code: str,
        expired_only: bool = True,
        limit: int = 50
    ) -> List[PatentResult]:
        """Get patents by CPC classification code."""
        criteria = [{"_begins": {"cpc_subgroup_id": cpc_code}}]

        if expired_only:
            cutoff_year = datetime.now().year - 20
            criteria.append({"_lte": {"patent_date": f"{cutoff_year}-12-31"}})

        query_obj = {"_and": criteria}

        fields = [
            "patent_number",
            "patent_title",
            "patent_abstract",
            "patent_date",
            "patent_type",
            "patent_num_claims",
            "cpc_subgroup_id",
            "cpc_subgroup_title",
        ]

        payload = {
            "q": query_obj,
            "f": fields,
            "o": {"per_page": min(limit, 1000)},
            "s": [{"patent_date": "desc"}],
        }

        try:
            response = await self.client.post(
                self.BASE_URL,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for patent in data.get("patents", []):
                result = self._parse_patent(patent)
                if result:
                    results.append(result)

            return results

        except httpx.HTTPError as e:
            logger.error(f"USPTO API error: {e}")
            return []

    def _parse_patent(self, data: Dict) -> Optional[PatentResult]:
        """Parse USPTO PatentsView response into PatentResult."""
        try:
            patent_number = data.get("patent_number", "")

            # Parse grant date
            grant_date = None
            if data.get("patent_date"):
                try:
                    grant_date = datetime.strptime(data["patent_date"], "%Y-%m-%d").date()
                except ValueError:
                    pass

            # Calculate expiration (20 years from filing, approximated from grant)
            expiration_date = None
            if grant_date:
                # Utility patents: 20 years from earliest filing date
                # Approximate using grant date - average pendency (~2-3 years)
                filing_year = grant_date.year - 2
                expiration_date = date(filing_year + 20, grant_date.month, grant_date.day)

            # Determine status
            status = PatentStatus.PUBLIC_DOMAIN
            if expiration_date and expiration_date > date.today():
                status = PatentStatus.ACTIVE

            # Parse inventors
            inventors = []
            for inv in data.get("inventors", []):
                inventors.append(PatentInventor(
                    name=f"{inv.get('inventor_first_name', '')} {inv.get('inventor_last_name', '')}".strip(),
                    city=inv.get("inventor_city"),
                    state=inv.get("inventor_state"),
                    country=inv.get("inventor_country"),
                ))

            # Parse CPC codes
            cpc_codes = []
            for cpc in data.get("cpcs", []):
                if cpc.get("cpc_subgroup_id"):
                    cpc_codes.append(cpc["cpc_subgroup_id"])

            return PatentResult(
                patent_number=patent_number,
                title=data.get("patent_title", ""),
                abstract=data.get("patent_abstract"),
                patent_type=self._parse_patent_type(data.get("patent_type")),
                status=status,
                grant_date=grant_date,
                expiration_date=expiration_date,
                public_domain_date=expiration_date if status == PatentStatus.PUBLIC_DOMAIN else None,
                inventors=inventors,
                assignee=data.get("assignees", [{}])[0].get("assignee_organization") if data.get("assignees") else None,
                cpc_codes=cpc_codes,
                claims_count=data.get("patent_num_claims", 0),
                cited_by_count=data.get("patent_num_cited_by_us_patents", 0),
                source="uspto_patentsview",
                source_url=f"https://patents.google.com/patent/US{patent_number}",
                raw_data=data,
            )

        except Exception as e:
            logger.error(f"Error parsing patent data: {e}")
            return None

    def _parse_patent_type(self, type_str: Optional[str]) -> PatentType:
        """Parse patent type string to enum."""
        if not type_str:
            return PatentType.UTILITY

        type_lower = type_str.lower()
        if "design" in type_lower:
            return PatentType.DESIGN
        elif "plant" in type_lower:
            return PatentType.PLANT
        elif "reissue" in type_lower:
            return PatentType.REISSUE
        return PatentType.UTILITY

    def _normalize_patent_number(self, number: str) -> str:
        """Normalize patent number format."""
        # Remove common prefixes and formatting
        number = re.sub(r'^US|^USPTO|^Patent\s*', '', number, flags=re.IGNORECASE)
        number = re.sub(r'[,\s]', '', number)
        return number

    async def close(self):
        await self.client.aclose()


class GooglePatentsAPI:
    """
    Google Patents search via web scraping fallback.
    For full API access, use BigQuery public datasets.

    BigQuery dataset: patents-public-data
    Tables:
    - patents-public-data.patents.publications
    - patents-public-data.patents.publications_latest
    """

    SEARCH_URL = "https://patents.google.com/xhr/query"

    def __init__(self, bigquery_client=None):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.bigquery = bigquery_client

    async def search(
        self,
        query: str,
        country: str = "US",
        expired_only: bool = True,
        limit: int = 50,
    ) -> List[PatentResult]:
        """
        Search Google Patents.

        For production use, implement BigQuery integration instead.
        """
        # Build search query
        search_query = query
        if expired_only:
            # Add date filter for expired patents
            cutoff_year = datetime.now().year - 20
            search_query += f" before:granted:{cutoff_year}0101"
        if country:
            search_query += f" country:{country}"

        params = {
            "q": search_query,
            "num": min(limit, 100),
            "type": "PATENT",
        }

        try:
            response = await self.client.get(
                self.SEARCH_URL,
                params=params,
                headers={
                    "User-Agent": "PublicDomainHunter/1.0",
                    "Accept": "application/json",
                }
            )

            if response.status_code == 200:
                data = response.json()
                return self._parse_results(data)
            else:
                logger.warning(f"Google Patents returned {response.status_code}")
                return []

        except Exception as e:
            logger.error(f"Google Patents search error: {e}")
            return []

    def _parse_results(self, data: Dict) -> List[PatentResult]:
        """Parse Google Patents response."""
        results = []
        # Note: Actual parsing depends on Google's response format
        # This is a placeholder - implement based on actual API response
        for item in data.get("results", {}).get("cluster", []):
            try:
                result = item.get("result", {}).get("patent", {})
                if result:
                    results.append(PatentResult(
                        patent_number=result.get("publication_number", ""),
                        title=result.get("title", ""),
                        abstract=result.get("abstract", ""),
                        source="google_patents",
                        source_url=f"https://patents.google.com/patent/{result.get('publication_number')}",
                    ))
            except Exception as e:
                logger.error(f"Error parsing Google patent: {e}")
                continue

        return results

    async def close(self):
        await self.client.aclose()


class LensOrgAPI:
    """
    Lens.org API - Free scholarly and patent search.
    Requires registration for API key.

    Docs: https://docs.api.lens.org/
    """

    BASE_URL = "https://api.lens.org/patent/search"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def search(
        self,
        query: str,
        expired_only: bool = True,
        limit: int = 50,
    ) -> List[PatentResult]:
        """Search Lens.org patents."""
        if not self.api_key:
            logger.warning("Lens.org API key not configured")
            return []

        # Build query
        must_clauses = [{"query_string": {"query": query}}]

        if expired_only:
            # Filter for expired patents
            cutoff_date = f"{datetime.now().year - 20}-01-01"
            must_clauses.append({
                "range": {
                    "date_published": {"lte": cutoff_date}
                }
            })

        payload = {
            "query": {
                "bool": {"must": must_clauses}
            },
            "size": min(limit, 100),
            "sort": [{"date_published": "desc"}],
        }

        try:
            response = await self.client.post(
                self.BASE_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for hit in data.get("data", []):
                result = self._parse_patent(hit)
                if result:
                    results.append(result)

            return results

        except httpx.HTTPError as e:
            logger.error(f"Lens.org API error: {e}")
            return []

    def _parse_patent(self, data: Dict) -> Optional[PatentResult]:
        """Parse Lens.org response."""
        try:
            return PatentResult(
                patent_number=data.get("doc_number", ""),
                title=data.get("title", ""),
                abstract=data.get("abstract", ""),
                grant_date=datetime.strptime(data["date_published"], "%Y-%m-%d").date() if data.get("date_published") else None,
                cpc_codes=[c.get("code") for c in data.get("cpc_classifications", []) if c.get("code")],
                claims_count=data.get("claims_count", 0),
                cited_by_count=data.get("cited_by_count", 0),
                source="lens_org",
                source_url=f"https://www.lens.org/lens/patent/{data.get('lens_id')}",
                raw_data=data,
            )
        except Exception as e:
            logger.error(f"Error parsing Lens patent: {e}")
            return None

    async def close(self):
        await self.client.aclose()


class PatentAggregator:
    """
    Unified interface for searching across multiple patent sources.
    """

    def __init__(
        self,
        uspto_enabled: bool = True,
        google_enabled: bool = False,
        lens_api_key: Optional[str] = None,
    ):
        self.sources = {}

        if uspto_enabled:
            self.sources["uspto"] = USPTOPatentsViewAPI()

        if google_enabled:
            self.sources["google"] = GooglePatentsAPI()

        if lens_api_key:
            self.sources["lens"] = LensOrgAPI(lens_api_key)

    async def search(
        self,
        query: str,
        expired_only: bool = True,
        limit: int = 50,
        sources: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Search across all configured patent sources.

        Returns:
            {
                "results": [...],
                "total": int,
                "sources_queried": [...],
                "errors": [...]
            }
        """
        sources_to_query = sources or list(self.sources.keys())

        # Run searches in parallel
        tasks = []
        source_names = []

        for source_name in sources_to_query:
            if source_name in self.sources:
                tasks.append(
                    self.sources[source_name].search(
                        query=query,
                        expired_only=expired_only,
                        limit=limit,
                    )
                )
                source_names.append(source_name)

        results_by_source = await asyncio.gather(*tasks, return_exceptions=True)

        # Combine results
        all_results = []
        errors = []

        for source_name, results in zip(source_names, results_by_source):
            if isinstance(results, Exception):
                errors.append({"source": source_name, "error": str(results)})
                continue

            for result in results:
                result.source = source_name
                all_results.append(result)

        # Deduplicate by patent number
        seen = set()
        unique_results = []
        for result in all_results:
            if result.patent_number not in seen:
                seen.add(result.patent_number)
                unique_results.append(result)

        return {
            "results": [r.to_dict() for r in unique_results],
            "total": len(unique_results),
            "sources_queried": source_names,
            "errors": errors,
        }

    async def get_expiring_patents(self, months: int = 12, limit: int = 100) -> Dict[str, Any]:
        """Get patents expiring soon (entering public domain)."""
        if "uspto" in self.sources:
            results = await self.sources["uspto"].get_expiring_soon(months, limit)
            return {
                "results": [r.to_dict() for r in results],
                "total": len(results),
                "period_months": months,
            }
        return {"results": [], "total": 0, "error": "USPTO source not configured"}

    async def get_by_classification(
        self,
        cpc_code: str,
        expired_only: bool = True,
        limit: int = 50,
    ) -> Dict[str, Any]:
        """Get patents by CPC classification."""
        if "uspto" in self.sources:
            results = await self.sources["uspto"].get_by_cpc(cpc_code, expired_only, limit)
            return {
                "results": [r.to_dict() for r in results],
                "total": len(results),
                "cpc_code": cpc_code,
            }
        return {"results": [], "total": 0, "error": "USPTO source not configured"}

    async def close(self):
        """Close all API connections."""
        for source in self.sources.values():
            await source.close()


# CPC Classification Reference
CPC_SECTIONS = {
    "A": "Human Necessities (Agriculture, Food, Health, Amusement)",
    "B": "Performing Operations; Transporting (Vehicles, Printing, Manufacturing)",
    "C": "Chemistry; Metallurgy",
    "D": "Textiles; Paper",
    "E": "Fixed Constructions (Buildings, Mining, Tunnels)",
    "F": "Mechanical Engineering; Lighting; Heating; Weapons",
    "G": "Physics (Instruments, Computing, Control, Signaling)",
    "H": "Electricity (Generation, Transmission, Electronics)",
    "Y": "General Tagging of New Technologies",
}


# Example usage
async def example_usage():
    """Example of using the patent APIs."""
    aggregator = PatentAggregator(uspto_enabled=True)

    try:
        # Search for expired patents
        results = await aggregator.search(
            query="coffee brewing",
            expired_only=True,
            limit=10,
        )
        print(f"Found {results['total']} patents")
        for patent in results["results"][:3]:
            print(f"  - {patent['patent_number']}: {patent['title']}")

        # Get patents expiring soon
        expiring = await aggregator.get_expiring_patents(months=6, limit=10)
        print(f"\n{expiring['total']} patents expiring in next 6 months")

        # Search by classification
        mechanical = await aggregator.get_by_classification("F16", expired_only=True, limit=10)
        print(f"\n{mechanical['total']} mechanical engineering patents")

    finally:
        await aggregator.close()


if __name__ == "__main__":
    asyncio.run(example_usage())
