import { AlertTriangle, CheckCircle2, Database, Scale, Sigma } from 'lucide-react'

const rows = [
  ['Observed demand', '35%', 'Source-reported download count, normalized on a logarithmic scale.', 'Measured when available'],
  ['Rights clarity', '30%', 'Explicit source rights/copyright metadata. Uncertain rights also reduce final score.', 'Measured'],
  ['Derivative fit', '20%', 'Transparent subject/format keyword heuristic for adaptation/product flexibility.', 'Heuristic'],
  ['Metadata quality', '15%', 'Completeness of creator, subject, language, year, and format metadata.', 'Measured'],
  ['Competition', '0% today', 'Reserved for real retailer, search, adaptation, and product-market connectors.', 'Not measured'],
]

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Evidence-first v2</div>
        <h1 className="mt-2 text-3xl font-bold text-white">Scoring Methodology</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">The old application tried to estimate too many things at once. The rebuild scores only signals it can explain and exposes missing evidence instead of turning unknowns into fake precision.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-300" /><div className="mt-3 text-sm font-semibold text-white">Evidence has provenance</div><div className="mt-1 text-xs leading-5 text-slate-500">Each signal states where it came from and how it was interpreted.</div></div>
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4"><Database className="h-5 w-5 text-cyan-300" /><div className="mt-3 text-sm font-semibold text-white">Missing stays missing</div><div className="mt-1 text-xs leading-5 text-slate-500">Competition is currently N/A instead of a randomly generated number.</div></div>
        <div className="rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4"><Scale className="h-5 w-5 text-violet-300" /><div className="mt-3 text-sm font-semibold text-white">Rights affect rank</div><div className="mt-1 text-xs leading-5 text-slate-500">Uncertain rights are both flagged and penalized until independently verified.</div></div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-white/10">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold text-white"><Sigma className="h-4 w-4 text-violet-300" /> Current score composition</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-black/20 text-xs uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3">Signal</th><th className="px-5 py-3">Weight</th><th className="px-5 py-3">Definition</th><th className="px-5 py-3">Type</th></tr></thead>
            <tbody className="divide-y divide-white/8">{rows.map(row => <tr key={row[0]}><td className="px-5 py-4 font-medium text-slate-200">{row[0]}</td><td className="px-5 py-4 font-mono text-violet-200">{row[1]}</td><td className="px-5 py-4 text-slate-400">{row[2]}</td><td className="px-5 py-4 text-slate-500">{row[3]}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-5">
        <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><div><h2 className="text-sm font-semibold text-amber-100">What the score is not</h2><p className="mt-1 text-xs leading-6 text-amber-100/60">It is not a legal opinion, valuation, sales forecast, or statement that a derivative product is clear of trademarks, later patents, publicity rights, or non-U.S. copyright. It is a research-priority score.</p></div></div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
        <h2 className="text-lg font-semibold text-white">Next evidence connectors</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">The architecture is ready to add retailer/search saturation, adaptation databases, marketplace pricing, search trends, and USPTO patent data. Each connector should contribute an auditable signal rather than overwrite the core score with an opaque LLM guess.</p>
      </section>
    </div>
  )
}
