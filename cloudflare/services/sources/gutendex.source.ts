import type { OpportunityCandidate } from '../opportunity-engine.service';

interface GutendexPerson { name: string; birth_year?: number | null; death_year?: number | null }
interface GutendexBook {
  id: number;
  title: string;
  subjects: string[];
  authors: GutendexPerson[];
  summaries?: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean | null;
  media_type: string;
  formats: Record<string, string>;
  download_count: number;
}
interface GutendexResponse { count: number; next: string | null; previous: string | null; results: GutendexBook[] }

export async function searchGutendex(query: string, limit = 20): Promise<{ total: number; candidates: OpportunityCandidate[] }> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('search', query.trim());
  params.set('copyright', 'false');
  params.set('sort', 'popular');
  const response = await fetch(`https://gutendex.com/books?${params.toString()}`, {
    headers: { 'accept': 'application/json', 'user-agent': 'PublicDomainHunter/2.0' }
  });
  if (!response.ok) throw new Error(`Gutendex returned ${response.status}`);
  const data = await response.json() as GutendexResponse;
  const candidates = data.results.slice(0, Math.max(1, Math.min(32, limit))).map((book): OpportunityCandidate => ({
    source: 'gutenberg',
    source_id: String(book.id),
    title: book.title,
    creator: book.authors?.map(a => a.name).join(', ') || undefined,
    kind: 'book',
    description: book.summaries?.[0],
    source_url: `https://www.gutenberg.org/ebooks/${book.id}`,
    rights_status: book.copyright === false ? 'public_domain_us' : 'verify_rights',
    rights_url: `https://www.gutenberg.org/policy/license.html`,
    year: null, // Gutendex does not provide a publication year; do not infer one.
    languages: book.languages || [],
    subjects: [...(book.subjects || []), ...(book.bookshelves || [])],
    downloads: book.download_count ?? null,
    formats: Object.keys(book.formats || {}),
  }));
  return { total: data.count, candidates };
}

export async function getGutendexBook(id: string): Promise<OpportunityCandidate | null> {
  const response = await fetch(`https://gutendex.com/books/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Gutendex returned ${response.status}`);
  const book = await response.json() as GutendexBook;
  return {
    source: 'gutenberg', source_id: String(book.id), title: book.title,
    creator: book.authors?.map(a => a.name).join(', ') || undefined, kind: 'book',
    description: book.summaries?.[0], source_url: `https://www.gutenberg.org/ebooks/${book.id}`,
    rights_status: book.copyright === false ? 'public_domain_us' : 'verify_rights',
    rights_url: `https://www.gutenberg.org/policy/license.html`, year: null,
    languages: book.languages || [], subjects: [...(book.subjects || []), ...(book.bookshelves || [])],
    downloads: book.download_count ?? null, formats: Object.keys(book.formats || {})
  };
}
