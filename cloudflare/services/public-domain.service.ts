// cloudflare/services/public-domain.service.ts
// Public Domain Content Sources Integration for Cloudflare Workers

import { KVNamespace } from '@cloudflare/workers-types';

export interface PublicDomainWork {
  id: string;
  title: string;
  author: string;
  publication_year?: number;
  public_domain_year?: number;
  media_type: string; // book, document, image, audio, video
  language: string;
  description: string;
  download_url?: string;
  thumbnail_url?: string;
  source_url: string;
  source: string; // gutenberg, archive, europeana, etc.
  rights_status: string; // public_domain, copyrighted, unknown
  metadata: any; // Original source metadata
}

/**
 * Base class for public domain content APIs
 */
export abstract class PublicDomainAPI {
  constructor(protected apiKey?: string, protected cache?: KVNamespace) {}

  abstract search(query: string, limit?: number): Promise<PublicDomainWork[]>;
  abstract getById(workId: string): Promise<PublicDomainWork | null>;

  /**
   * Extract year from various date formats
   */
  protected extractYear(dateStr: string): number | undefined {
    if (!dateStr) return undefined;

    // Handle formats like "2023-01-01", "2023", "January 2023"
    const parts = String(dateStr).split(/[- /]/);
    for (const part of parts) {
      if (/^\d{4}$/.test(part)) {
        return parseInt(part, 10);
      }
    }
    return undefined;
  }

  /**
   * Determine when work entered public domain (US rules, simplified)
   */
  protected determinePDYear(pubYear?: number): number | undefined {
    if (!pubYear) return undefined;

    if (pubYear < 1928) {
      return pubYear; // Already public domain
    } else if (pubYear < 1978) {
      return pubYear + 28; // 28-year copyright term
    } else {
      return pubYear + 70; // Life + 70 years (simplified)
    }
  }

  /**
   * Cache a search result
   */
  protected async cacheResult(key: string, value: any, ttl: number = 3600): Promise<void> {
    if (this.cache) {
      await this.cache.put(key, JSON.stringify(value), { expirationTtl: ttl });
    }
  }

  /**
   * Get cached result
   */
  protected async getCached<T>(key: string): Promise<T | null> {
    if (!this.cache) return null;

    const cached = await this.cache.get(key);
    if (!cached) return null;

    try {
      return JSON.parse(cached) as T;
    } catch {
      return null;
    }
  }
}

/**
 * Project Gutenberg API integration
 */
export class GutenbergAPI extends PublicDomainAPI {
  private readonly BASE_URL = 'https://gutendex.com';

  async search(query: string, limit: number = 50): Promise<PublicDomainWork[]> {
    const cacheKey = `gutenberg:search:${query}:${limit}`;

    // Check cache first
    const cached = await this.getCached<PublicDomainWork[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      search: query,
      copyright: 'false', // Public domain only
      languages: 'en', // English only for now
    });

    const response = await fetch(`${this.BASE_URL}/books/?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Gutenberg API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const results: PublicDomainWork[] = [];

    for (const book of (data.results || []).slice(0, limit)) {
      const work = this.parseGutenbergBook(book);
      if (work) {
        results.push(work);
      }
    }

    // Cache the results
    await this.cacheResult(cacheKey, results);

    return results;
  }

  async getById(workId: string): Promise<PublicDomainWork | null> {
    const gutenbergId = workId.replace('gutenberg_', '');
    const cacheKey = `gutenberg:book:${gutenbergId}`;

    // Check cache first
    const cached = await this.getCached<PublicDomainWork>(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.BASE_URL}/books/${gutenbergId}`);

    if (!response.ok) {
      return null;
    }

    const book: any = await response.json();
    const work = this.parseGutenbergBook(book);

    if (work) {
      await this.cacheResult(cacheKey, work);
    }

    return work;
  }

  private parseGutenbergBook(book: any): PublicDomainWork | null {
    try {
      // Extract publication year
      const pubYear = this.extractYear(book.first_publish_date || book.publish_date || '');

      // Get author names
      const authors = book.authors || [];
      const authorNames = authors.map((a: any) => a.name).join(', ') || 'Unknown';

      // Get download URL (prefer plain text)
      const downloadUrl = book.formats?.['text/plain'] || book.formats?.['application/epub+zip'];

      return {
        id: `gutenberg_${book.id}`,
        title: book.title || 'Untitled',
        author: authorNames,
        publication_year: pubYear,
        public_domain_year: this.determinePDYear(pubYear),
        media_type: 'book',
        language: (book.languages && book.languages[0]) || 'en',
        description: `Gutenberg eBook: ${book.title}`,
        download_url: downloadUrl,
        thumbnail_url: undefined,
        source_url: `https://gutenberg.org/ebooks/${book.id}`,
        source: 'gutenberg',
        rights_status: 'public_domain',
        metadata: book,
      };
    } catch (error) {
      console.error('Error parsing Gutenberg book:', error);
      return null;
    }
  }
}

/**
 * Internet Archive API integration
 */
export class InternetArchiveAPI extends PublicDomainAPI {
  private readonly BASE_URL = 'https://archive.org';

  async search(query: string, limit: number = 50): Promise<PublicDomainWork[]> {
    const cacheKey = `archive:search:${query}:${limit}`;

    // Check cache first
    const cached = await this.getCached<PublicDomainWork[]>(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({
      q: `${query} AND mediatype:texts`,
      'fl[]': 'identifier,title,creator,date,publicdate,licenseurl,subject,description',
      rows: limit.toString(),
      output: 'json',
      'sort[]': 'publicdate desc',
    });

    const response = await fetch(`${this.BASE_URL}/advancedsearch.php?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Internet Archive API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const results: PublicDomainWork[] = [];

    for (const doc of data.response?.docs || []) {
      const work = this.parseArchiveDoc(doc);
      if (work) {
        results.push(work);
      }
    }

    // Cache the results
    await this.cacheResult(cacheKey, results);

    return results;
  }

  async getById(workId: string): Promise<PublicDomainWork | null> {
    const archiveId = workId.replace('archive_', '');
    const cacheKey = `archive:item:${archiveId}`;

    // Check cache first
    const cached = await this.getCached<PublicDomainWork>(cacheKey);
    if (cached) return cached;

    const response = await fetch(`${this.BASE_URL}/metadata/${archiveId}`);

    if (!response.ok) {
      return null;
    }

    const data: any = await response.json();
    const work = this.parseArchiveDoc(data.metadata);

    if (work) {
      await this.cacheResult(cacheKey, work);
    }

    return work;
  }

  private parseArchiveDoc(doc: any): PublicDomainWork | null {
    try {
      const identifier = doc.identifier;
      const pubYear = this.extractYear(doc.date || doc.publicdate || '');

      return {
        id: `archive_${identifier}`,
        title: doc.title || 'Untitled',
        author: doc.creator || 'Unknown',
        publication_year: pubYear,
        public_domain_year: this.determinePDYear(pubYear),
        media_type: this.mapMediaType(doc.mediatype),
        language: 'en', // Archive doesn't always provide language
        description: doc.description || `Internet Archive item: ${doc.title}`,
        download_url: `${this.BASE_URL}/download/${identifier}`,
        thumbnail_url: `${this.BASE_URL}/services/img/${identifier}`,
        source_url: `${this.BASE_URL}/details/${identifier}`,
        source: 'archive',
        rights_status: this.determineRightsStatus(doc.licenseurl),
        metadata: doc,
      };
    } catch (error) {
      console.error('Error parsing Archive doc:', error);
      return null;
    }
  }

  private mapMediaType(archiveType: string): string {
    const mapping: Record<string, string> = {
      texts: 'book',
      movies: 'video',
      audio: 'audio',
      image: 'image',
    };
    return mapping[archiveType] || 'document';
  }

  private determineRightsStatus(licenseUrl?: string): string {
    if (!licenseUrl) return 'unknown';
    if (licenseUrl.includes('publicdomain')) return 'public_domain';
    if (licenseUrl.includes('creativecommons')) return 'creative_commons';
    return 'unknown';
  }
}

/**
 * Unified Public Domain Service
 * Aggregates results from multiple sources
 */
export class PublicDomainService {
  private gutenberg: GutenbergAPI;
  private archive: InternetArchiveAPI;

  constructor(cache?: KVNamespace) {
    this.gutenberg = new GutenbergAPI(undefined, cache);
    this.archive = new InternetArchiveAPI(undefined, cache);
  }

  /**
   * Search across all sources
   */
  async searchAll(query: string, limit: number = 50): Promise<PublicDomainWork[]> {
    const limitPerSource = Math.ceil(limit / 2);

    const [gutenbergResults, archiveResults] = await Promise.all([
      this.gutenberg.search(query, limitPerSource).catch(() => []),
      this.archive.search(query, limitPerSource).catch(() => []),
    ]);

    // Combine and limit results
    return [...gutenbergResults, ...archiveResults].slice(0, limit);
  }

  /**
   * Search specific source
   */
  async search(
    query: string,
    source: 'gutenberg' | 'archive' | 'all' = 'all',
    limit: number = 50
  ): Promise<PublicDomainWork[]> {
    if (source === 'all') {
      return this.searchAll(query, limit);
    } else if (source === 'gutenberg') {
      return this.gutenberg.search(query, limit);
    } else {
      return this.archive.search(query, limit);
    }
  }

  /**
   * Get work by ID
   */
  async getById(workId: string): Promise<PublicDomainWork | null> {
    if (workId.startsWith('gutenberg_')) {
      return this.gutenberg.getById(workId);
    } else if (workId.startsWith('archive_')) {
      return this.archive.getById(workId);
    }
    return null;
  }
}
