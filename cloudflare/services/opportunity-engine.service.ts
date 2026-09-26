export type OpportunityKind = 'book' | 'audio' | 'video' | 'image' | 'patent' | 'other';

export interface EvidenceSignal {
  key: string;
  label: string;
  value: string | number | null;
  score: number | null;
  weight: number;
  measured: boolean;
  source: string;
  note?: string;
}

export interface OpportunityCandidate {
  source: 'gutenberg' | 'internet_archive' | 'manual';
  source_id: string;
  title: string;
  creator?: string;
  kind: OpportunityKind;
  description?: string;
  source_url: string;
  rights_status: 'public_domain_us' | 'open_license' | 'verify_rights' | 'unknown';
  rights_url?: string;
  year?: number | null;
  languages?: string[];
  subjects?: string[];
  downloads?: number | null;
  formats?: string[];
  raw?: unknown;
}

export interface OpportunityScore {
  overall: number;
  confidence: number;
  coverage: number;
  demand: number | null;
  rights_clarity: number | null;
  derivative_fit: number | null;
  discoverability: number | null;
  competition: number | null;
  evidence: EvidenceSignal[];
  missing_signals: string[];
  thesis: string;
  product_angles: string[];
  cautions: string[];
}

export interface ScoredOpportunity extends OpportunityCandidate {
  score: OpportunityScore;
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function demandScore(downloads?: number | null): number | null {
  if (downloads === null || downloads === undefined) return null;
  // Log scale: ~10 downloads = 28, 1k = 64, 100k+ approaches 100.
  return clamp(Math.round(10 + Math.log10(Math.max(1, downloads)) * 18));
}

function rightsScore(status: OpportunityCandidate['rights_status']): number {
  switch (status) {
    case 'public_domain_us': return 100;
    case 'open_license': return 85;
    case 'verify_rights': return 35;
    default: return 15;
  }
}

function derivativeFit(candidate: OpportunityCandidate): number {
  const haystack = `${candidate.title} ${(candidate.subjects || []).join(' ')} ${candidate.description || ''}`.toLowerCase();
  let score = 45;
  const narrative = ['fiction', 'stories', 'novel', 'adventure', 'fantasy', 'myth', 'legend', 'mystery', 'drama', 'play'];
  const visual = ['illustrated', 'art', 'design', 'architecture', 'maps', 'costume', 'botany', 'animals', 'nature'];
  const education = ['history', 'science', 'manual', 'handbook', 'philosophy', 'education', 'biography', 'travel'];
  const children = ['children', 'juvenile', 'fairy tales', 'folklore'];

  if (narrative.some(k => haystack.includes(k))) score += 18;
  if (visual.some(k => haystack.includes(k))) score += 12;
  if (education.some(k => haystack.includes(k))) score += 10;
  if (children.some(k => haystack.includes(k))) score += 12;
  if ((candidate.formats || []).some(f => /image|epub|html|text/.test(f))) score += 6;
  return clamp(score);
}

function discoverabilityScore(candidate: OpportunityCandidate): number {
  let score = 25;
  if (candidate.creator) score += 15;
  if (candidate.year) score += 10;
  if ((candidate.subjects || []).length >= 3) score += 20;
  else score += Math.min(15, (candidate.subjects || []).length * 5);
  if ((candidate.languages || []).length) score += 10;
  if ((candidate.formats || []).length >= 3) score += 15;
  else score += Math.min(10, (candidate.formats || []).length * 3);
  if (candidate.description) score += 5;
  return clamp(score);
}

function productAngles(candidate: OpportunityCandidate): string[] {
  const text = `${candidate.title} ${(candidate.subjects || []).join(' ')} ${candidate.description || ''}`.toLowerCase();
  const ideas: string[] = [];
  if (/fiction|novel|stories|adventure|fantasy|mystery|drama|play|myth|legend/.test(text)) {
    ideas.push('Premium illustrated edition', 'Narrated audiobook', 'Screen/game adaptation research');
  }
  if (/children|juvenile|fairy|folklore/.test(text)) {
    ideas.push('Modern children’s edition', 'Activity or coloring adaptation');
  }
  if (/art|illustrat|poster|map|architecture|botany|nature|animals|costume/.test(text)) {
    ideas.push('Print/poster collection', 'Design asset pack');
  }
  if (/manual|handbook|science|history|education|philosophy|biography|travel/.test(text)) {
    ideas.push('Annotated modern edition', 'Course or reference companion');
  }
  if (ideas.length === 0) ideas.push('Annotated reissue', 'Audiobook', 'Derivative concept research');
  return Array.from(new Set(ideas)).slice(0, 5);
}

export function scoreOpportunity(candidate: OpportunityCandidate): ScoredOpportunity {
  const demand = demandScore(candidate.downloads);
  const rights = rightsScore(candidate.rights_status);
  const derivative = derivativeFit(candidate);
  const discoverability = discoverabilityScore(candidate);

  const evidence: EvidenceSignal[] = [
    {
      key: 'demand', label: 'Observed demand', value: candidate.downloads ?? null,
      score: demand, weight: 0.35, measured: demand !== null, source: candidate.source,
      note: demand === null ? 'No source download count was available.' : 'Uses source-reported downloads on a logarithmic scale.'
    },
    {
      key: 'rights', label: 'Rights clarity', value: candidate.rights_status,
      score: rights, weight: 0.30, measured: true, source: candidate.source,
      note: candidate.rights_status === 'public_domain_us'
        ? 'Source metadata explicitly marks the work public domain in the U.S.'
        : 'Rights should be independently verified before commercial use.'
    },
    {
      key: 'derivative', label: 'Derivative fit', value: (candidate.subjects || []).slice(0, 5).join(', ') || 'metadata heuristics',
      score: derivative, weight: 0.20, measured: true, source: 'PDH metadata heuristic',
      note: 'A transparent content-format heuristic, not a revenue prediction.'
    },
    {
      key: 'discoverability', label: 'Metadata quality', value: `${(candidate.subjects || []).length} subjects / ${(candidate.formats || []).length} formats`,
      score: discoverability, weight: 0.15, measured: true, source: candidate.source,
      note: 'Measures how much structured metadata is available for downstream research.'
    },
    {
      key: 'competition', label: 'Current competition', value: null,
      score: null, weight: 0, measured: false, source: 'not measured',
      note: 'Not fabricated. Add retailer/search/adaptation connectors to measure this.'
    }
  ];

  const measurable = evidence.filter(e => e.measured && e.score !== null && e.weight > 0);
  const weightTotal = measurable.reduce((sum, e) => sum + e.weight, 0);
  const raw = measurable.reduce((sum, e) => sum + (e.score as number) * e.weight, 0) / Math.max(0.001, weightTotal);
  const coverage = Math.round(weightTotal * 100);

  // Confidence deliberately discounts Archive candidates with uncertain rights.
  let confidence = 45 + (candidate.downloads !== null && candidate.downloads !== undefined ? 20 : 0) +
    ((candidate.subjects || []).length >= 3 ? 10 : 0) +
    (candidate.rights_status === 'public_domain_us' ? 20 : candidate.rights_status === 'open_license' ? 10 : 0);
  confidence = clamp(confidence);

  const rightsPenalty = candidate.rights_status === 'public_domain_us' ? 1 : candidate.rights_status === 'open_license' ? 0.9 : 0.65;
  const overall = Math.round(clamp(raw * rightsPenalty));

  const missing: string[] = ['retailer competition', 'search trend', 'adaptation saturation', 'estimated unit economics'];
  if (candidate.downloads === null || candidate.downloads === undefined) missing.unshift('observed source demand');

  const cautions: string[] = [];
  if (candidate.rights_status !== 'public_domain_us') cautions.push('Verify copyright/license status in your target jurisdiction before commercial use.');
  cautions.push('Opportunity score ranks research priority; it is not a revenue forecast.');

  const thesis = overall >= 78
    ? 'High-priority research candidate with strong observed signals and reusable source material.'
    : overall >= 62
      ? 'Promising candidate worth a focused competition and customer-demand check.'
      : 'Exploratory candidate; stronger external market evidence is needed before pursuing.';

  return {
    ...candidate,
    score: {
      overall,
      confidence,
      coverage,
      demand,
      rights_clarity: rights,
      derivative_fit: derivative,
      discoverability,
      competition: null,
      evidence,
      missing_signals: missing,
      thesis,
      product_angles: productAngles(candidate),
      cautions
    }
  };
}
