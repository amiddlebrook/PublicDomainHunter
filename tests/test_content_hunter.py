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

    fallback_item = make_item("Fallback", "Mock")
    monkeypatch.setattr(
        hunter,
        "_mock_search_results",
        lambda *args, **kwargs: [fallback_item],
    )

    results = hunter.search("science", "book", 1)
    assert results == [fallback_item]
