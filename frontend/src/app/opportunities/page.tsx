import { OpportunityExplorer } from '@/components/opportunity/OpportunityExplorer'

export default function OpportunitiesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Research workspace</div>
        <h1 className="mt-2 text-3xl font-bold text-white">Opportunity Explorer</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Search source material, rank candidates by available evidence, inspect exactly why they scored, and save the ones worth deeper validation.</p>
      </div>
      <OpportunityExplorer />
    </div>
  )
}
