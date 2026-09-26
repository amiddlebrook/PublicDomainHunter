'use client'

import Link from 'next/link'
import { ArrowRight, BadgeCheck, Database, Gauge, Radar, Scale, Sparkles } from 'lucide-react'
import { OpportunityExplorer } from '@/components/opportunity/OpportunityExplorer'

const pillars = [
  { icon: Database, label: 'Live source evidence', detail: 'Project Gutenberg now; Internet Archive candidate search included.' },
  { icon: Scale, label: 'Rights-aware', detail: 'Rights certainty affects ranking and uncertain works are explicitly flagged.' },
  { icon: Gauge, label: 'Transparent scoring', detail: 'Every score expands into the actual signals, weights, and missing evidence.' },
]

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b10] p-6 md:p-9">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200">
            <Radar className="h-3.5 w-3.5" /> Opportunity Engine 2.0
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
            Find old IP with <span className="bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">new commercial potential.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 md:text-lg">
            Public Domain Hunter searches reusable source material, measures the evidence that actually exists, and ranks what deserves deeper business research next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/opportunities" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-200">Open Explorer <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/methodology" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10"><BadgeCheck className="h-4 w-4" /> See methodology</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {pillars.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Icon className="h-4 w-4" /></div>
            <div className="text-sm font-semibold text-white">{label}</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">{detail}</div>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300"><Sparkles className="h-3.5 w-3.5" /> Live radar</div>
            <h2 className="mt-2 text-2xl font-bold text-white">Research candidates</h2>
          </div>
          <Link href="/opportunities" className="hidden items-center gap-1 text-sm text-slate-400 hover:text-white sm:flex">Full explorer <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <OpportunityExplorer compact />
      </section>
    </div>
  )
}
