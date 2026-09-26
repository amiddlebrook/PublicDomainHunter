import { ArrowUpRight, KeyRound, ScrollText, ShieldAlert } from 'lucide-react'

export default function PatentRadarPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">Connector stage</div>
        <h1 className="mt-2 text-3xl font-bold text-white">Patent Radar</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">The old repo pretended to know manufacturing viability and market size from patent keywords. That logic is intentionally not carried into the rebuild.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-5">
          <ScrollText className="h-6 w-6 text-cyan-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Planned source</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">USPTO Open Data Portal / PatentsView datasets, with grant, classification, assignee, citation, and status data stored as evidence fields.</p>
        </div>
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-5">
          <KeyRound className="h-6 w-6 text-amber-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Why it is not faked</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">USPTO ODP now requires registered access. The production connector should use a real authorized account rather than silently falling back to stale or invented data.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" /><div><h2 className="font-semibold text-white">Patent opportunity model</h2><p className="mt-2 text-sm leading-6 text-slate-500">When connected, PDH should separate legal/status evidence, technical complexity, market evidence, and blocking-IP research. Expiration of one patent does not guarantee freedom to operate, so the UI will never label an invention “safe to manufacture” from expiration alone.</p></div></div>
      </div>
      <a href="https://www.uspto.gov/ip-policy/economic-research/research-datasets" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-cyan-300 hover:text-cyan-200">USPTO research datasets <ArrowUpRight className="h-4 w-4" /></a>
    </div>
  )
}
