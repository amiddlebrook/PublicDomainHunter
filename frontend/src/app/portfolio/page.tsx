'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BookMarked, Trash2 } from 'lucide-react'
import { Opportunity } from '@/lib/opportunity'
import { OpportunityCard } from '@/components/opportunity/OpportunityCard'

export default function PortfolioPage() {
  const [items, setItems] = useState<Opportunity[]>([])

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem('pdh_v2_saved') || '[]')) } catch { setItems([]) }
  }, [])

  const toggle = (opp: Opportunity) => {
    const key = `${opp.source}:${opp.source_id}`
    const next = items.filter(o => `${o.source}:${o.source_id}` !== key)
    localStorage.setItem('pdh_v2_saved', JSON.stringify(next))
    setItems(next)
  }

  const clear = () => {
    localStorage.removeItem('pdh_v2_saved')
    setItems([])
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Shortlist</div>
          <h1 className="mt-2 text-3xl font-bold text-white">Research Portfolio</h1>
          <p className="mt-2 text-sm text-slate-500">Candidates you saved for deeper competition, customer, and unit-economics research.</p>
        </div>
        {items.length > 0 && <button onClick={clear} className="inline-flex items-center gap-2 rounded-lg border border-red-400/15 bg-red-400/5 px-3 py-2 text-xs text-red-300 hover:bg-red-400/10"><Trash2 className="h-3.5 w-3.5" /> Clear portfolio</button>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
          <BookMarked className="mx-auto h-8 w-8 text-slate-700" />
          <h2 className="mt-4 text-lg font-semibold text-white">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Use the explorer to save promising works. The portfolio is stored locally in this MVP, so no account is required.</p>
          <Link href="/opportunities" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400">Explore opportunities <ArrowRight className="h-4 w-4" /></Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(o => <OpportunityCard key={`${o.source}:${o.source_id}`} opportunity={o} onSave={toggle} saved />)}
        </div>
      )}
    </div>
  )
}
