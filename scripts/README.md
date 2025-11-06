# Scripts Directory

Utility scripts for Public Domain Hunter administration and data management.

## Available Scripts

### `import_initial_data.py` 🎯

**Purpose**: Import public domain works from external APIs to populate the database.

**Usage**:
```bash
# Quick start - import 100 works (no API keys needed)
python scripts/import_initial_data.py --count 100

# Import with specific search
python scripts/import_initial_data.py --search "shakespeare" --count 50

# Import from specific source
python scripts/import_initial_data.py --source gutenberg --count 100

# Import with API keys
python scripts/import_initial_data.py \
    --europeana-key "YOUR_KEY" \
    --dpla-key "YOUR_KEY" \
    --count 200
```

**Options**:
- `--source`: Choose data source (gutenberg, archive, europeana, dpla, all)
- `--search`: Search query for filtering content
- `--count`: Number of works to import (default: 50)
- `--europeana-key`: Europeana API key
- `--dpla-key`: DPLA API key

**What it does**:
1. Connects to external public domain APIs
2. Searches for relevant works
3. Filters for true public domain status
4. Imports works into your database
5. Prevents duplicates
6. Creates admin user if needed
7. Provides detailed progress logging

**Output**:
```
2024-01-01 12:00:00 - Importing up to 100 works from Project Gutenberg...
2024-01-01 12:00:05 - ✓ Imported: Romeo and Juliet by William Shakespeare (from gutenberg)
2024-01-01 12:00:06 - ✓ Imported: Pride and Prejudice by Jane Austen (from gutenberg)
...
============================================================
IMPORT SUMMARY
============================================================
✓ Successfully imported: 95 works
⊘ Skipped (duplicates):  5 works
✗ Errors:                0 works
Total processed:         100
============================================================
```

## Creating New Scripts

When adding new administrative scripts:

1. **Naming**: Use descriptive names with underscores (e.g., `export_analytics_data.py`)
2. **Shebang**: Start with `#!/usr/bin/env python3`
3. **Docstring**: Include usage examples and purpose
4. **Logging**: Use the logging module for output
5. **Arguments**: Use argparse for command-line options
6. **Error Handling**: Wrap in try/except blocks
7. **Database**: Always use `SessionLocal()` and close sessions
8. **Executable**: Make scripts executable with `chmod +x`

### Template

```python
#!/usr/bin/env python3
"""
Script description here.

Usage:
    python scripts/script_name.py --option value
"""

import sys
import argparse
import logging
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import Work

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    parser = argparse.ArgumentParser(description="Script description")
    parser.add_argument("--option", help="Option description")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        # Your script logic here
        pass
    finally:
        db.close()


if __name__ == "__main__":
    main()
```

## Future Script Ideas

Potential scripts that could be useful:

- `export_works_csv.py` - Export works to CSV format
- `cleanup_duplicates.py` - Find and remove duplicate works
- `refresh_all_metrics.py` - Trigger metrics refresh for all works
- `backup_database.py` - Create database backup
- `generate_sitemap.py` - Generate sitemap for SEO
- `analyze_trends.py` - Run batch trend analysis
- `import_from_csv.py` - Import works from CSV file
- `migrate_data.py` - Data migration utilities
