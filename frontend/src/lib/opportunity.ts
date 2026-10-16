export type OpportunitySource = 'gutenberg' | 'internet_archive' | 'manual'
export type RightsStatus = 'public_domain_us' | 'open_license' | 'verify_rights' | 'unknown'

export interface EvidenceSignal {
  key: string
  label: string
  value: string | number | null
  score: number | null
  weight: number
  measured: boolean
  source: string
  note?: string
}

export interface OpportunityScore {
  overall: number
  confidence: number
  coverage: number
  demand: number | null
  rights_clarity: number | null
  derivative_fit: number | null
  discoverability: number | null
  competition: number | null
  evidence: EvidenceSignal[]
  missing_signals: string[]
  thesis: string
  product_angles: string[]
  cautions: string[]
}

export interface Opportunity {
  source: OpportunitySource
  source_id: string
  title: string
  creator?: string
  kind: string
  description?: string
  source_url: string
  rights_status: RightsStatus
  rights_url?: string
  year?: number | null
  languages?: string[]
  subjects?: string[]
  downloads?: number | null
  formats?: string[]
  score: OpportunityScore
}

export interface OpportunitySearchResponse {
  query: string
  source: string
  provider?: string
  notice?: string | null
  total_source_results: number
  returned: number
  generated_at: string
  methodology: string
  opportunities: Opportunity[]
}

export const rightsLabel: Record<RightsStatus, string> = {
  public_domain_us: 'Public domain (U.S.)',
  open_license: 'Open license',
  verify_rights: 'Verify rights',
  unknown: 'Unknown rights',
}

export function formatNumber(value?: number | null) {
  if (value === null || value === undefined) return 'Not measured'
  return new Intl.NumberFormat('en-US', { notation: value >= 10_000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value)
}
