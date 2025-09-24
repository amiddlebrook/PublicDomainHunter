#!/usr/bin/env python3
"""
Public Domain Hunter CLI

Command-line interface for the Public Domain Hunter tool.
"""

import argparse
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from public_domain_hunter.core import ContentHunter


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Public Domain Hunter - Find and manage public domain content"
    )

    parser.add_argument(
        "query",
        help="Search query for public domain content"
    )

    parser.add_argument(
        "-t", "--type",
        choices=["book", "image", "audio", "video", "document", "all"],
        default="all",
        help="Type of media to search for (default: all)"
    )

    parser.add_argument(
        "-l", "--limit",
        type=int,
        default=20,
        help="Maximum number of results to return (default: 20)"
    )

    parser.add_argument(
        "-e", "--export",
        choices=["json", "csv"],
        help="Export results to specified format"
    )

    parser.add_argument(
        "-o", "--output",
        help="Output file path for exported results"
    )

    args = parser.parse_args()

    try:
        # Initialize the hunter
        hunter = ContentHunter()

        # Perform the search
        print(f"🔍 Searching for '{args.query}' in {args.type} content...")
        results = hunter.search(args.query, args.type, args.limit)

        if not results:
            print("❌ No results found.")
            return 1

        # Display results
        print(f"\n📚 Found {len(results)} results:\n")

        for i, item in enumerate(results, 1):
            print(f"{i}. {item.title}")
            print(f"   Author: {item.author} ({item.year})")
            print(f"   Source: {item.source}")
            print(f"   Type: {item.media_type}")
            print(f"   URL: {item.url}")
            print(f"   Description: {item.description}")
            print()

        # Export if requested
        if args.export:
            exported_data = hunter.export_results(results, args.export)

            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(exported_data)
                print(f"✅ Results exported to {args.output}")
            else:
                print(f"\n📄 Exported {args.export.upper()} data:")
                print(exported_data)

        return 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
