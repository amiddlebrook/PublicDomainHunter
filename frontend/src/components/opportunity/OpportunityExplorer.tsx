'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Filter, Radar, RefreshCw, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import { API_BASE_URL } from '@/lib/utils'
import { Opportunity, OpportunitySearchResponse } from '@/lib/opportunity'
import { OpportunityCard } from './OpportunityCard'

const suggestions = ['airships', 'fairy tales', 'architecture', 'electricity', 'arctic exploration', 'mechanical inventions']

export function OpportunityExplorer({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'gutenberg' | 'archive'>('gutenberg')
  const [minScore, setMinScore] = useState(55)
  const [data, setData] = useState<OpportunitySearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])

  const search = async (nextQuery = query, nextSource = source) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ q: nextQuery, source: nextSource, limit: compact ? '8' : '20', min_score: '0' })
      const res = await fetch(`${API_BASE_URL}/api/opportunities?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Search failed')
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('pdh_v2_saved')
    if (saved) {
      try { setSavedIds((JSON.parse(saved) as Opportunity[]).map(o => `${o.source}:${o.source_id}`)) } catch { /* ignore */ }
    }
    search('', 'gutenberg')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = (opp: Opportunity) => {
    const key = `${opp.source}:${opp.source_id}`
    const current: Opportunity[] = (() => {
      try { return JSON.parse(localStorage.getItem('pdh_v2_saved') || '[]') } catch { return [] }
    })()
    const exists = current.some(o => `${o.source}:${o.source_id}` === key)
    const next = exists ? current.filter(o => `${o.source}:${o.source_id}` !== key) : [opp, ...current]
    localStorage.setItem('pdh_v2_saved', JSON.stringify(next))
    setSavedIds(next.map(o => `${o.source}:${o.source_id}`))
  }

  const visible = useMemo(() => (data?.opportunities || []).filter(o => o.score.overall >= minScore), [data, minScore])

  const submit = (e: FormEvent) => { e.preventDefault(); search() }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-white/[0.025] to-cyan-400/5 p-4 md:p-5">
        <form onSubmit={submit} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search themes, authors, technologies, stories…" className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10" />
          </div>
          <select value={source} onChange={e => setSource(e.target.value as 'gutenberg' | 'archive')} className="h-12 rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-slate-200 outline-none focus:border-violet-400/60">
            <option value="gutenberg">Verified PD · Gutenberg</option>
            <option value="archive">Broad candidates · Internet Archive</option>
          </select>
          <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400" type="submit">
            <Radar className="h-4 w-4" /> Hunt opportunities
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-600">Try:</span>
          {suggestions.slice(0, compact ? 4 : suggestions.length).map(s => (
            <button key={s} onClick={() => { setQuery(s); search(s, source) }} className="rounded-md border border-white/8 bg-white/[0.025] px-2 py-1 text-xs text-slate-400 hover:border-violet-400/30 hover:text-violet-200">{s}</button>
          ))}
        </div>
      </div>

      {!compact && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-300" /> Evidence-first scoring · unknown data stays unknown</div>
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-slate-500" />
            <label className="text-xs text-slate-400">Minimum score <span className="font-mono text-white">{minScore}</span></label>
            <input type="range" min="0" max="85" step="5" value={minScore} onChange={e => setMinScore(Number(e.target.value))} className="w-32 accent-violet-500" />
          </div>
        </div>
      )}

      {error && <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{query ? `Results for “${query}”` : 'Top research candidates'}</h2>
          <p className="mt-1 text-xs text-slate-500">{data ? `${visible.length} shown · ${data.total_source_results.toLocaleString()} source matches` : 'Loading live source data…'}</p>
        </div>
        <button onClick={() => search()} disabled={loading} className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:text-white disabled:opacity-50" title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="grid gap-4">
          {[1,2,3].map(n => <div key={n} className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/[0.025]" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-sm text-slate-500"><Filter className="mx-auto mb-3 h-6 w-6" />No candidates clear the current filters.</div>
      ) : (
        <div className="grid gap-4">
          {visible.map(opp => <OpportunityCard key={`${opp.source}:${opp.source_id}`} opportunity={opp} onSave={save} saved={savedIds.includes(`${opp.source}:${opp.source_id}`)} />)}
        </div>
      )}
    </div>
  )
}
