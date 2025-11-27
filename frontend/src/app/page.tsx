'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  BookOpen,
  TrendingUp,
  Users,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

// Dynamically import WorkDetailClient to handle work detail routes
const WorkDetailClient = dynamic(() => import('./works/[id]/WorkDetailClient'), { ssr: false })

interface DashboardStats {
  total_works: number
  new_works_today: number
  average_trend_score: number
  top_performing_works: any[]
}

interface Work {
  id: number
  title: string
  author: string
  public_domain_year: number
  media_type: string
  metadata?: {
    <div className = "space-y-4">
        <div className = "flex items-center justify-between">
          <h2 className = "text-2xl font-bold text-white">The Factory</h2 >
  <Badge variant="outline" className="text-indigo-400 border-indigo-400">Beta</Badge>
        </div >
  <div className="grid gap-6 md:grid-cols-3">
    <Link href="/factory/posters">
      <Card className="group hover:border-indigo-500 transition-all cursor-pointer bg-gradient-to-br from-dark-900 to-dark-950 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            Create Poster Series
          </CardTitle>
          <CardDescription>
            Turn vintage illustrations into high-res wall art.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full justify-between group-hover:text-indigo-400">
            Start Project <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>

    <Link href="/factory/ebooks">
      <Card className="group hover:border-pink-500 transition-all cursor-pointer bg-gradient-to-br from-dark-900 to-dark-950 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 group-hover:bg-pink-500 group-hover:text-white transition-colors">
              <BookOpen className="h-5 w-5" />
            </div>
            Publish E-Book
          </CardTitle>
          <CardDescription>
            Format classic texts for Kindle & print-on-demand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full justify-between group-hover:text-pink-400">
            Start Project <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>

    <Link href="/factory/3d-models">
      <Card className="group hover:border-emerald-500 transition-all cursor-pointer bg-gradient-to-br from-dark-900 to-dark-950 h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <TrendingUp className="h-5 w-5" />
            </div>
            3D Print Model
          </CardTitle>
          <CardDescription>
            Convert patent drawings into 3D printable files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="ghost" className="w-full justify-between group-hover:text-emerald-400">
            Start Project <ArrowUpRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </Link>
  </div>
      </div >

  {/* Recent Works */ }
  < Card >
        <CardHeader>
          <CardTitle>Recent Additions</CardTitle>
          <CardDescription>
            Latest public domain works added to the catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(recentWorks) && recentWorks.slice(0, 5).map((work) => (
              <div key={work.id} className="flex items-center justify-between py-2 border-b border-dark-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {work.title}
                  </p>
                  <p className="text-sm text-gray-400 truncate">
                    {work.author} • {work.public_domain_year}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/works/${work.id}`}>
                    View Asset
                  </Link>
                </Button>
              </div>
            ))}
            {recentWorks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No recent works found.
              </div>
            )}
          </div>
        </CardContent>
      </Card >
    </div >
  )
}
