from public_domain_hunter.core import ContentHunter, ContentItem, ContentSourceError


def make_item(title: str, source: str) -> ContentItem:
    return ContentItem(
        title=title,
        author="Test Author",
        year=1900,
        source=source,
        url=f"https://example.com/{title}",
        media_type="book",
        description="",
        metadata={},
    )


def test_search_project_gutenberg_parses_results(monkeypatch):
    hunter = ContentHunter()
    payload = {
        "results": [
            {
                "title": "Sample Book",
                "authors": [{"name": "Jane Doe"}],
                "media_type": "Text",
                "formats": {
                    "text/html": "https://www.gutenberg.org/ebooks/123.html",
                    "text/plain; charset=utf-8": "https://www.gutenberg.org/ebooks/123.txt",
                },
                "summaries": ["Summary"],
                "subjects": ["Fiction"],
                "bookshelves": ["Shelf"],
                "download_count": 42,
                "languages": ["en"],
            }
        ]
    }

    class _Response:
        def json(self):
            return payload

        def raise_for_status(self):
            return None

    monkeypatch.setattr(hunter.session, "get", lambda *_, **__: _Response())

    results = hunter._search_project_gutenberg("sample", "book", 5)
    assert len(results) == 1
    item = results[0]
    assert item.source == "Project Gutenberg"
    assert item.media_type == "book"
    assert item.url.endswith("123.html")
    assert item.metadata["download_count"] == 42


def test_search_combines_sources(monkeypatch):
    hunter = ContentHunter()

    monkeypatch.setattr(
        hunter,
        "_search_project_gutenberg",
        lambda q, m, l: [make_item("Book One", "Project Gutenberg")],
    )
    monkeypatch.setattr(
        hunter,
        "_search_internet_archive",
        lambda q, m, l: [make_item("Book Two", "Internet Archive")],
    )
    monkeypatch.setattr(hunter, "_search_library_of_congress", lambda *_, **__: [])
    monkeypatch.setattr(hunter, "_search_europeana", lambda *_, **__: [])

    results = hunter.search("history", "all", 5)
    assert len(results) == 2
    sources = {item.source for item in results}
    assert sources == {"Project Gutenberg", "Internet Archive"}


def test_search_falls_back_to_mock(monkeypatch):
    hunter = ContentHunter()

    def raise_gutenberg(*_args, **_kwargs):
        raise ContentSourceError("gutenberg")

    def raise_archive(*_args, **_kwargs):
        raise ContentSourceError("archive")

    monkeypatch.setattr(hunter, "_search_project_gutenberg", raise_gutenberg)
    monkeypatch.setattr(hunter, "_search_internet_archive", raise_archive)
    monkeypatch.setattr(hunter, "_search_library_of_congress", lambda *_, **__: [])
    monkeypatch.setattr(hunter, "_search_europeana", lambda *_, **__: [])

    fallback_item = make_item("Fallback", "Mock")
    monkeypatch.setattr(
        hunter,
        "_mock_search_results",
        lambda *args, **kwargs: [fallback_item],
    )

    results = hunter.search("science", "book", 1)
    assert results == [fallback_item]


def test_search_library_of_congress_parses_results(monkeypatch):
    hunter = ContentHunter()
    payload = {
        "results": [
            {
                "title": "LOC Sample",
                "creator": ["LOC Author"],
                "format": ["Book"],
                "description": ["LOC Description"],
                "id": "https://loc.gov/item/123",
                "date": "1910",
                "subject": ["History"],
                "collection": "LOC Collection",
            }
        ]
    }

    class _Response:
        def json(self):
            return payload

        def raise_for_status(self):
            return None

    monkeypatch.setattr(hunter.session, "get", lambda *_, **__: _Response())

    results = hunter._search_library_of_congress("history", "book", 5)
    assert len(results) == 1
    item = results[0]
    assert item.source == "Library of Congress"
    assert item.media_type == "book"
    assert "History" in item.metadata["subject"]


def test_search_europeana_requires_key(monkeypatch):
    hunter = ContentHunter()
    hunter.europeana_api_key = None

    called = {"count": 0}

    def _raise_call(*_args, **_kwargs):
        called["count"] += 1
        raise AssertionError("Should not call Europeana without a key")

    monkeypatch.setattr(hunter.session, "get", _raise_call)

    assert hunter._search_europeana("history", "book", 5) == []
    assert called["count"] == 0


def test_search_europeana_parses_results(monkeypatch):
    hunter = ContentHunter()
    hunter.europeana_api_key = "demo-key"

    payload = {
        "items": [
            {
                "title": ["Europeana Book"],
                "dcCreator": ["Europeana Author"],
                "type": "TEXT",
                "guid": "https://europeana.eu/item/123",
                "year": ["1901"],
                "dcDescription": ["Europeana Description"],
                "dataProvider": "Provider",
                "provider": "Aggregator",
                "country": "Country",
            }
        ]
    }

    class _Response:
        def json(self):
            return payload

        def raise_for_status(self):
            return None

    monkeypatch.setattr(hunter.session, "get", lambda *_, **__: _Response())

    items = hunter._search_europeana("history", "book", 5)
    assert len(items) == 1
    assert items[0].source == "Europeana"
    assert items[0].media_type == "book"
