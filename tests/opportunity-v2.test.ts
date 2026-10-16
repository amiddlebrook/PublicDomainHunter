import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreOpportunity, type OpportunityCandidate } from '../cloudflare/services/opportunity-engine.service';
import { rightsFromLicense, searchInternetArchive } from '../cloudflare/services/sources/internet-archive.source';
import { searchGutendex } from '../cloudflare/services/sources/gutendex.source';

const candidate: OpportunityCandidate = {
  source: 'gutenberg',
  source_id: '123',
  title: 'A Book of Fairy Stories',
  kind: 'book',
  source_url: 'https://www.gutenberg.org/ebooks/123',
  creator: 'Example Writer',
  rights_status: 'public_domain_us',
  subjects: ['Folklore', 'Fiction', 'Juvenile'],
  formats: ['text/html'],
  downloads: 1200,
};

test('evidence-based opportunity score never invents market competition', () => {
  const scored = scoreOpportunity(candidate);
  assert.equal(scored.score.competition, null);
  assert.equal(scored.score.evidence.find(e => e.key === 'competition')?.measured, false);
  assert.ok(scored.score.overall >= 0 && scored.score.overall <= 100);
  assert.ok(scored.score.missing_signals.includes('retailer competition'));
});

test('rights uncertainty reduces rank and missing demand stays missing', () => {
  const trusted = scoreOpportunity(candidate);
  const unclear = scoreOpportunity({ ...candidate, rights_status: 'verify_rights', downloads: null });
  assert.ok(unclear.score.overall < trusted.score.overall);
  assert.equal(unclear.score.demand, null);
  assert.ok(unclear.score.missing_signals.includes('observed source demand'));
});

test('CC licenses with NC or ND constraints are not labeled commercially reusable', () => {
  assert.equal(rightsFromLicense('https://creativecommons.org/licenses/by-nc/4.0/'), 'verify_rights');
  assert.equal(rightsFromLicense('https://creativecommons.org/licenses/by-nd/4.0/'), 'verify_rights');
  assert.equal(rightsFromLicense('https://creativecommons.org/licenses/by-nc-sa/4.0/'), 'verify_rights');
  assert.equal(rightsFromLicense('https://creativecommons.org/licenses/by-sa/4.0/'), 'open_license');
  assert.equal(rightsFromLicense('https://creativecommons.org/publicdomain/zero/1.0/'), 'open_license');
  assert.equal(rightsFromLicense('https://random.example/publicdomain-claim'), 'verify_rights');
});

test('Gutendex maps rights only from explicit copyright=false', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    count: 1, results: [{ id: 5, title: 'Test',
      authors: [], subjects: [], bookshelves: [], languages: ['en'],
      formats: {}, copyright: null, media_type: 'Text', download_count: 100 }]
  }), { headers: { 'content-type': 'application/json' } });
  try {
    const result = await searchGutendex('test');
    assert.equal(result.candidates[0].rights_status, 'verify_rights');
    assert.equal(result.total, 1);
  } finally { globalThis.fetch = originalFetch; }
});

test('Internet Archive marks unlicensed records as needing verification', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    response: { numFound: 1, docs: [{ identifier: 'sample-book', title: 'Sample', downloads: 55 }] }
  }), { headers: { 'content-type': 'application/json' } });
  try {
    const result = await searchInternetArchive('sample');
    assert.equal(result.candidates[0].rights_status, 'verify_rights');
    assert.equal(result.candidates[0].source_url, 'https://archive.org/details/sample-book');
  } finally { globalThis.fetch = originalFetch; }
});

test('Gutenberg 403 falls back to the Archive Gutenberg collection without asserting unverified rights', async () => {
  const { default: worker } = await import('../cloudflare/worker');
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    if (url.includes('gutendex.com')) return new Response('Forbidden', { status: 403 });
    return new Response(JSON.stringify({
      response: { numFound: 1, docs: [{ identifier: 'gutenberg-book', title: 'Archive Gutenberg book', downloads: 29 }] }
    }), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const response = await worker.fetch(new Request('https://pdh.test/api/opportunities?source=gutenberg&q=folklore'), {} as any, {} as any);
    assert.equal(response.status, 200);
    const payload = await response.json() as any;
    assert.equal(payload.provider, 'internet-archive-gutenberg');
    assert.equal(payload.opportunities[0].rights_status, 'verify_rights');
    assert.ok(requested.some(u => u.includes('collection%3Agutenberg')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
