'use client'

import { usePathname } from 'next/navigation'
import { Menu, Radar } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'

const titles: Record<string, string> = {
  '/': 'Opportunity Radar',
  '/opportunities': 'Opportunity Explorer',
  '/portfolio': 'Research Portfolio',
  '/methodology': 'Scoring Methodology',
  '/patents': 'Patent Radar',
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background lg:flex">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-dark-950/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <button type="button" className="mr-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-white">{titles[pathname] || 'Public Domain Hunter'}</div>
              <div className="hidden text-xs text-slate-600 sm:block">Evidence first. Unknown means unknown.</div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-1.5 text-xs text-emerald-300">
              <Radar className="h-3.5 w-3.5" /> Live source research
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
