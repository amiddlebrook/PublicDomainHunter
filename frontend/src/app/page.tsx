'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BookOpen, Compass, Database, Fingerprint, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { OpportunityExplorer } from '@/components/opportunity/OpportunityExplorer'

const steps = [
  { number: '01', title: 'Discover', body: 'Query live public catalogs for books, media and overlooked source works.', icon: Compass },
  { number: '02', title: 'Evaluate', body: 'See actual evidence, rights caveats and what is still unmeasured.', icon: Fingerprint },
  { number: '03', title: 'Develop', body: 'Shortlist candidate materials for your own market and product validation.', icon: Target },
]

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0d111c]">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#94a3b822 1px, transparent 1px)', backgroundSize: '24px 24px', maskImage: 'linear-gradient(to left, black, transparent 82%)' }} />
        <div className="pointer-events-none absolute -right-32 -top-44 h-[440px] w-[440px] rounded-full bg-cyan-400/10 blur-[80px]" />
        <div className="relative grid items-center gap-8 px-6 py-9 sm:px-9 sm:py-12 lg:grid-cols-[1.45fr_0.85fr] lg:gap-14 lg:px-12 lg:py-16">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Public-domain intelligence
            </div>
            <h1 className="max-w-[780px] text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-slate-50 sm:text-5xl lg:text-[58px]">
              Valuable ideas.<br /><span className="text-cyan-300">Hidden in plain sight.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-400">
              Uncover works you can investigate for modern products. We surface source records, explain each research score, and distinguish documented rights from assumptions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/opportunities" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#06121b] transition hover:bg-cyan-200">Explore the archive <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/methodology" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10">How scoring works <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Evidence over estimates</span>
              <span className="inline-flex items-center gap-2"><Database className="h-4 w-4 text-cyan-300" /> Live external catalogs</span>
              <span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-violet-300" /> No login required</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-white/15 bg-[#101929]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300"><Sparkles className="h-4 w-4 text-cyan-300" /> Research protocol</span>
                <span className="rounded-md border border-emerald-400/20 bg-emerald-300/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">Transparent by design</span>
              </div>
              <div className="space-y-0 py-2">
                {[
                  { name: 'Observed demand', weight: '35%', note: 'Source download records' },
                  { name: 'Rights clarity', weight: '30%', note: 'Explicit rights metadata' },
                  { name: 'Derivative fit', weight: '20%', note: 'Labeled content heuristic' },
                  { name: 'Metadata quality', weight: '15%', note: 'Completeness of catalog data' },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between gap-4 border-b border-white/[0.07] py-3 last:border-0">
                    <div><div className="text-sm font-medium text-slate-100">{item.name}</div><div className="mt-1 text-xs text-slate-500">{item.note}</div></div>
                    <span className="font-mono text-sm text-cyan-200">{item.weight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 rounded-lg border border-amber-400/15 bg-amber-400/[0.06] p-3 text-xs leading-5 text-amber-100/70">
                Competition and revenue are intentionally unscored until grounded by external evidence.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {steps.map(({ number, title, body, icon: Icon }) => (
          <div key={number} className="group rounded-2xl border border-white/10 bg-[#0d1119] p-5 transition hover:border-cyan-300/25">
            <div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/[0.07] text-cyan-200"><Icon className="h-5 w-5" /></div><span className="font-mono text-xs text-slate-600">{number} / 03</span></div>
            <h2 className="mt-5 text-base font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
          </div>
        ))}
      </section>

      <section id="radar" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Start a search</div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Opportunity radar</h2><p className="mt-2 text-sm text-slate-400">Fresh source records, not simulated opportunity lists.</p></div>
          <Link href="/opportunities" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 hover:text-cyan-200">Full explorer <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <OpportunityExplorer compact />
      </section>
    </div>
  )
}
