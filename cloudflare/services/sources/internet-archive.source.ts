import type { OpportunityCandidate } from '../opportunity-engine.service';

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
  description?: string | string[];
  downloads?: number;
  year?: number | string | Array<number | string>;
  mediatype?: string;
  subject?: string | string[];
  licenseurl?: string | string[];
  language?: string | string[];
}
interface ArchiveResponse { response: { numFound: number; docs: ArchiveDoc[] } }

const asArray = (v?: string | string[]) => !v ? [] : Array.isArray(v) ? v : [v];

function kind(media?: string): OpportunityCandidate['kind'] {
  if (media === 'audio') return 'audio';
  if (media === 'movies') return 'video';
  if (media === 'image') return 'image';
  if (media === 'texts') return 'book';
  return 'other';
}

export function rightsFromLicense(url?: string | string[]): OpportunityCandidate['rights_status'] {
  const entries = asArray(url).map(item => item.toLowerCase());
  if (entries.length === 0) return 'verify_rights';
  // License URLs must be unambiguous. NC prohibits many commercial uses;
  // ND prohibits derivative works, so neither is cleared for adaptation.
  if (entries.some(u => /creativecommons\.org\/licenses\/[^/]*(?:nc|nd)/.test(u))) return 'verify_rights';
  if (entries.some(u => /creativecommons\.org\/licenses\/(?:by|by-sa)\//.test(u))) return 'open_license';
  if (entries.some(u => /creativecommons\.org\/publicdomain\/(?:zero|mark)\//.test(u))) return 'open_license';
  // Unknown / ambiguous claims are NOT proof of public-domain status.
  return 'verify_rights';
}

export async function searchInternetArchive(query: string, limit = 20): Promise<{ total: number; candidates: OpportunityCandidate[] }> {
  const q = query.trim() ? `(${query.trim()})` : '*:*';
  const params = new URLSearchParams();
  params.set('q', q);
  for (const field of ['identifier','title','creator','description','downloads','year','mediatype','subject','licenseurl','language']) {
    params.append('fl[]', field);
  }
  params.set('rows', String(Math.max(1, Math.min(50, limit))));
  params.set('page', '1');
  params.set('output', 'json');
  params.set('sort[]', 'downloads desc');
  const response = await fetch(`https://archive.org/advancedsearch.php?${params.toString()}`, {
    headers: { accept: 'application/json', 'user-agent': 'PublicDomainHunter/2.0' }
  });
  if (!response.ok) throw new Error(`Internet Archive returned ${response.status}`);
  const data = await response.json() as ArchiveResponse;
  const candidates = (data.response?.docs || []).map((doc): OpportunityCandidate => ({
    source: 'internet_archive', source_id: doc.identifier, title: doc.title || doc.identifier,
    creator: asArray(doc.creator).join(', ') || undefined, kind: kind(doc.mediatype),
    description: asArray(doc.description)[0], source_url: `https://archive.org/details/${encodeURIComponent(doc.identifier)}`,
    rights_status: rightsFromLicense(doc.licenseurl), rights_url: asArray(doc.licenseurl)[0],
    year: doc.year ? Number(String(Array.isArray(doc.year) ? doc.year[0] : doc.year).slice(0,4)) || null : null,
    languages: asArray(doc.language), subjects: asArray(doc.subject), downloads: doc.downloads ?? null,
    formats: doc.mediatype ? [doc.mediatype] : []
  }));
  return { total: data.response?.numFound || candidates.length, candidates };
}
