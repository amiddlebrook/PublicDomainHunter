'use client'

import { useState } from 'react'
import { ArrowUpRight, Bookmark, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Database, Gauge, Lightbulb, Scale, Sparkles } from 'lucide-react'
import { Opportunity, formatNumber, rightsLabel } from '@/lib/opportunity'

function scoreTone(score: number) {
  if (score >= 80) return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
  if (score >= 65) return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300'
  if (score >= 50) return 'border-amber-400/30 bg-amber-400/10 text-amber-300'
  return 'border-slate-400/20 bg-slate-400/10 text-slate-300'
}

function rightsTone(status: Opportunity['rights_status']) {
  if (status === 'public_domain_us') return 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10'
  if (status === 'open_license') return 'text-cyan-300 border-cyan-400/25 bg-cyan-400/10'
  return 'text-amber-300 border-amber-400/25 bg-amber-400/10'
}

export function OpportunityCard({ opportunity, onSave, saved }: { opportunity: Opportunity; onSave?: (o: Opportunity) => void; saved?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const s = opportunity.score

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/10 transition hover:border-violet-400/30 hover:bg-white/[0.05]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full border px-2.5 py-1 font-semibold ${scoreTone(s.overall)}`}>Score {s.overall}</span>
            <span className={`rounded-full border px-2.5 py-1 ${rightsTone(opportunity.rights_status)}`}>
              <Scale className="mr-1 inline h-3 w-3" />{rightsLabel[opportunity.rights_status]}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
              <Database className="mr-1 inline h-3 w-3" />{opportunity.source === 'gutenberg' ? 'Project Gutenberg' : 'Internet Archive'}
            </span>
          </div>
          <h2 className="text-xl font-semibold leading-tight text-white">{opportunity.title}</h2>
          <p className="mt-1 text-sm text-slate-400">{opportunity.creator || 'Creator not listed'}</p>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{s.thesis}</p>
        </div>

        <div className="grid min-w-[250px] grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-lg font-semibold text-white">{formatNumber(opportunity.downloads)}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">Downloads</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-lg font-semibold text-white">{s.confidence}%</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">Confidence</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-lg font-semibold text-white">{s.coverage}%</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-500">Coverage</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          ['Demand', s.demand],
          ['Rights', s.rights_clarity],
          ['Derivative fit', s.derivative_fit],
          ['Competition', s.competition],
        ].map(([label, score]) => (
          <div key={String(label)} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><span className="font-mono text-slate-200">{score === null ? '—' : score}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${score === null ? 0 : score}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {s.product_angles.slice(0, 4).map(angle => (
          <span key={angle} className="rounded-lg bg-violet-400/10 px-2.5 py-1.5 text-xs text-violet-200">
            <Lightbulb className="mr-1 inline h-3 w-3" />{angle}
          </span>
        ))}
      </div>

      {expanded && (
        <div className="mt-5 grid gap-5 border-t border-white/10 pt-5 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Gauge className="h-4 w-4 text-cyan-300" />Evidence</h3>
            <div className="space-y-2">
              {s.evidence.map(e => (
                <div key={e.key} className="rounded-xl border border-white/10 bg-black/15 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-200">{e.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{e.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-white">{e.score === null ? 'N/A' : e.score}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-600">{e.source}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><CircleAlert className="h-4 w-4 text-amber-300" />Still needs research</h3>
              <div className="flex flex-wrap gap-2">
                {s.missing_signals.map(item => <span key={item} className="rounded-md border border-amber-400/15 bg-amber-400/5 px-2 py-1 text-xs text-amber-200/80">{item}</span>)}
              </div>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Subject signals</h3>
              <p className="text-xs leading-6 text-slate-400">{(opportunity.subjects || []).slice(0, 12).join(' • ') || 'No subjects supplied by source.'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-slate-400">
              {s.cautions.join(' ')}
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
        <button onClick={() => setExpanded(!expanded)} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? 'Hide evidence' : 'Show evidence'}
        </button>
        <div className="flex items-center gap-2">
          {onSave && (
            <button onClick={() => onSave(opportunity)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">
              <Bookmark className={`h-4 w-4 ${saved ? 'fill-current text-violet-300' : ''}`} />{saved ? 'Saved' : 'Save'}
            </button>
          )}
          <a href={opportunity.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-sm font-medium text-white hover:bg-violet-400">
            Inspect source <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  )
}
