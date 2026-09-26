'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { BookMarked, ChevronLeft, ChevronRight, FlaskConical, LayoutDashboard, Radar, Scale, ScrollText, X } from 'lucide-react'

const navigation = [
  { name: 'Radar', href: '/', icon: LayoutDashboard },
  { name: 'Explore', href: '/opportunities', icon: Radar },
  { name: 'Portfolio', href: '/portfolio', icon: BookMarked },
  { name: 'Methodology', href: '/methodology', icon: FlaskConical },
  { name: 'Patent Radar', href: '/patents', icon: ScrollText, badge: 'next' },
]

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
  collapsed?: boolean
  setCollapsed?: (collapsed: boolean) => void
}

export function Sidebar({ open, setOpen, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <div className={clsx('fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden', open ? 'opacity-100' : 'pointer-events-none opacity-0')} onClick={() => setOpen(false)} />
      <aside className={clsx(
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#07070a] transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full', collapsed ? 'lg:w-20' : 'lg:w-72'
      )}>
        <div className={clsx('flex h-16 items-center border-b border-white/10 px-5', collapsed ? 'justify-center' : 'justify-between')}>
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-950/40">
              <Scale className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <div className="text-sm font-bold tracking-tight text-white">Public Domain Hunter</div>
                <div className="text-[10px] uppercase tracking-[0.19em] text-slate-600">Opportunity radar</div>
              </div>
            )}
          </Link>
          <button className="text-slate-500 hover:text-white lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} title={collapsed ? item.name : undefined}
                className={clsx('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition', active ? 'bg-violet-500/12 text-violet-200' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200', collapsed && 'justify-center')}>
                <item.icon className={clsx('h-4.5 w-4.5 shrink-0', active ? 'text-violet-300' : '')} />
                {!collapsed && <><span className="flex-1">{item.name}</span>{item.badge && <span className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-2 py-0.5 text-[10px] text-cyan-300">{item.badge}</span>}</>}
              </Link>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 text-xs leading-5 text-slate-500">
            <div className="mb-1 font-medium text-slate-300">v2 rebuild</div>
            Scores prioritize what to research next. They are not legal opinions or revenue forecasts.
          </div>
        )}

        <div className="hidden border-t border-white/10 p-3 lg:block">
          <button onClick={() => setCollapsed?.(!collapsed)} className="flex w-full items-center justify-center gap-2 rounded-lg p-2 text-xs text-slate-600 hover:bg-white/5 hover:text-slate-300">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  )
}
