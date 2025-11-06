"""
Database migration runner for AI preferences tables.

This script applies the migration to add AI preferences and user activity tables.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine, text
from app.database import DATABASE_URL
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migration():
    """Run the database migration."""
    try:
        # Create database engine
        engine = create_engine(DATABASE_URL)

        # Read migration SQL
        migration_file = Path(__file__).parent / "001_add_ai_preferences.sql"
        with open(migration_file, 'r') as f:
            migration_sql = f.read()

        # Execute migration
        with engine.connect() as connection:
            # Split by semicolons and execute each statement
            statements = [s.strip() for s in migration_sql.split(';') if s.strip() and not s.strip().startswith('--')]

            for statement in statements:
                if statement:
                    logger.info(f"Executing: {statement[:100]}...")
                    connection.execute(text(statement))
                    connection.commit()

        logger.info("Migration completed successfully!")
        return True

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        return False


if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1)
