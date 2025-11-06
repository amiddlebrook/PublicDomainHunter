#!/usr/bin/env python3
"""
Initial Data Import Script for Public Domain Hunter

Imports public domain works from multiple sources to populate the database.
Run this after setting up the database to get started with content.

Usage:
    python scripts/import_initial_data.py --count 100
    python scripts/import_initial_data.py --source gutenberg --count 50
    python scripts/import_initial_data.py --search "shakespeare" --count 20
"""

import asyncio
import argparse
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Work, User
from app.public_domain_api import (
    GutenbergAPI,
    InternetArchiveAPI,
    EuropeanaAPI,
    DPLAAPI,
    PublicDomainAggregator
)
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DataImporter:
    """Handles importing public domain works from various sources."""

    def __init__(self, db: Session):
        """Initialize the importer."""
        self.db = db
        self.imported_count = 0
        self.skipped_count = 0
        self.error_count = 0

    async def import_from_gutenberg(self, search_query: str = None, limit: int = 50):
        """
        Import works from Project Gutenberg.

        Args:
            search_query: Optional search term (default: popular classics)
            limit: Maximum number of works to import
        """
        logger.info(f"Importing up to {limit} works from Project Gutenberg...")

        api = GutenbergAPI()

        # Use search query or default to popular public domain works
        query = search_query or "shakespeare dickens austen"

        try:
            works = await api.search(query, limit=limit)
            await self._import_works(works, source="gutenberg")
        finally:
            await api.close()

    async def import_from_internet_archive(self, search_query: str = None, limit: int = 50):
        """
        Import works from Internet Archive.

        Args:
            search_query: Optional search term
            limit: Maximum number of works to import
        """
        logger.info(f"Importing up to {limit} works from Internet Archive...")

        api = InternetArchiveAPI()
        query = search_query or "public domain classic literature"

        try:
            works = await api.search(query, limit=limit)
            await self._import_works(works, source="archive")
        finally:
            await api.close()

    async def import_from_europeana(self, api_key: str, search_query: str = None, limit: int = 50):
        """
        Import works from Europeana (requires API key).

        Args:
            api_key: Europeana API key
            search_query: Optional search term
            limit: Maximum number of works to import
        """
        if not api_key:
            logger.warning("Skipping Europeana - no API key provided")
            return

        logger.info(f"Importing up to {limit} works from Europeana...")

        api = EuropeanaAPI(api_key)
        query = search_query or "classic literature"

        try:
            works = await api.search(query, limit=limit)
            await self._import_works(works, source="europeana")
        finally:
            await api.close()

    async def import_from_dpla(self, api_key: str, search_query: str = None, limit: int = 50):
        """
        Import works from DPLA (requires API key).

        Args:
            api_key: DPLA API key
            search_query: Optional search term
            limit: Maximum number of works to import
        """
        if not api_key:
            logger.warning("Skipping DPLA - no API key provided")
            return

        logger.info(f"Importing up to {limit} works from DPLA...")

        api = DPLAAPI(api_key)
        query = search_query or "literature"

        try:
            works = await api.search(query, limit=limit)
            await self._import_works(works, source="dpla")
        finally:
            await api.close()

    async def import_all_sources(self, search_query: str = None, limit_per_source: int = 25):
        """
        Import from all available sources.

        Args:
            search_query: Optional search term
            limit_per_source: Max works per source
        """
        logger.info("Importing from all available sources...")

        # Get API keys from environment
        europeana_key = os.getenv("EUROPEANA_API_KEY")
        dpla_key = os.getenv("DPLA_API_KEY")

        # Import from each source
        await self.import_from_gutenberg(search_query, limit_per_source)
        await self.import_from_internet_archive(search_query, limit_per_source)

        if europeana_key:
            await self.import_from_europeana(europeana_key, search_query, limit_per_source)

        if dpla_key:
            await self.import_from_dpla(dpla_key, search_query, limit_per_source)

    async def _import_works(self, works, source: str):
        """
        Import a list of works into the database.

        Args:
            works: List of PublicDomainWork objects
            source: Source name for logging
        """
        # Get the admin user (or create one if doesn't exist)
        admin = self.db.query(User).filter(User.username == "admin").first()
        if not admin:
            logger.warning("No admin user found, creating one...")
            from app.auth import get_password_hash
            admin = User(
                username="admin",
                email="admin@publicdomainhunter.com",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True
            )
            self.db.add(admin)
            self.db.commit()
            self.db.refresh(admin)

        for work_data in works:
            try:
                # Check if work already exists (by title and author)
                existing = self.db.query(Work).filter(
                    Work.title == work_data.title,
                    Work.author == work_data.author
                ).first()

                if existing:
                    logger.debug(f"Skipping duplicate: {work_data.title}")
                    self.skipped_count += 1
                    continue

                # Calculate public domain year
                public_domain_year = work_data.publication_year or 1900
                if work_data.publication_year and work_data.publication_year >= 1928:
                    public_domain_year = work_data.publication_year + 95
                elif work_data.publication_year:
                    public_domain_year = work_data.publication_year + 28

                # Create work record
                work = Work(
                    title=work_data.title[:500],  # Truncate if too long
                    author=work_data.author[:200] if work_data.author else "Unknown",
                    original_publication_year=work_data.publication_year,
                    public_domain_year=public_domain_year,
                    description=work_data.description[:2000] if work_data.description else None,
                    source_url=work_data.source_url,
                    media_type=work_data.media_type,
                    language=work_data.language or "en",
                    status="active",
                    user_id=admin.id,
                    metadata={
                        "source": work_data.source,
                        "external_id": work_data.external_id,
                        "imported_at": datetime.utcnow().isoformat(),
                        **(work_data.metadata or {})
                    }
                )

                self.db.add(work)
                self.db.commit()
                self.imported_count += 1

                logger.info(f"✓ Imported: {work.title} by {work.author} (from {source})")

            except Exception as e:
                logger.error(f"✗ Error importing work '{work_data.title}': {e}")
                self.error_count += 1
                self.db.rollback()

    def print_summary(self):
        """Print import summary."""
        logger.info("=" * 60)
        logger.info("IMPORT SUMMARY")
        logger.info("=" * 60)
        logger.info(f"✓ Successfully imported: {self.imported_count} works")
        logger.info(f"⊘ Skipped (duplicates):  {self.skipped_count} works")
        logger.info(f"✗ Errors:                {self.error_count} works")
        logger.info(f"Total processed:         {self.imported_count + self.skipped_count + self.error_count}")
        logger.info("=" * 60)


async def main():
    """Main import function."""
    parser = argparse.ArgumentParser(
        description="Import public domain works into the database"
    )
    parser.add_argument(
        "--source",
        choices=["gutenberg", "archive", "europeana", "dpla", "all"],
        default="all",
        help="Data source to import from (default: all)"
    )
    parser.add_argument(
        "--search",
        type=str,
        default=None,
        help="Search query (default: popular classics)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=50,
        help="Number of works to import (default: 50)"
    )
    parser.add_argument(
        "--europeana-key",
        type=str,
        default=None,
        help="Europeana API key (or set EUROPEANA_API_KEY env var)"
    )
    parser.add_argument(
        "--dpla-key",
        type=str,
        default=None,
        help="DPLA API key (or set DPLA_API_KEY env var)"
    )

    args = parser.parse_args()

    # Set API keys from arguments if provided
    if args.europeana_key:
        os.environ["EUROPEANA_API_KEY"] = args.europeana_key
    if args.dpla_key:
        os.environ["DPLA_API_KEY"] = args.dpla_key

    # Create database session
    db = SessionLocal()

    try:
        # Create tables if they don't exist
        logger.info("Ensuring database tables exist...")
        Base.metadata.create_all(bind=engine)

        # Initialize importer
        importer = DataImporter(db)

        # Import based on source
        if args.source == "all":
            await importer.import_all_sources(args.search, args.count // 2)
        elif args.source == "gutenberg":
            await importer.import_from_gutenberg(args.search, args.count)
        elif args.source == "archive":
            await importer.import_from_internet_archive(args.search, args.count)
        elif args.source == "europeana":
            key = args.europeana_key or os.getenv("EUROPEANA_API_KEY")
            if not key:
                logger.error("Europeana API key required. Use --europeana-key or set EUROPEANA_API_KEY env var")
                return
            await importer.import_from_europeana(key, args.search, args.count)
        elif args.source == "dpla":
            key = args.dpla_key or os.getenv("DPLA_API_KEY")
            if not key:
                logger.error("DPLA API key required. Use --dpla-key or set DPLA_API_KEY env var")
                return
            await importer.import_from_dpla(key, args.search, args.count)

        # Print summary
        importer.print_summary()

    finally:
        db.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\nImport cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
