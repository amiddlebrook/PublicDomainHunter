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
    trend_score?: number
  }
}

export default function Dashboard() {
  const pathname = usePathname()
  const [recentWorks, setRecentWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)

  // Manual client-side routing for work detail pages (SPA fallback workaround)
  if (pathname && pathname.startsWith('/works/') && pathname !== '/works') {
    const workId = pathname.split('/works/')[1]
    return <WorkDetailClient workId={workId} />
  }

  useEffect(() => {
    fetchRecentWorks()
  }, [])

  const fetchRecentWorks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/works?limit=6&sort_by=created_at&sort_order=desc`)
      if (response.ok) {
        const data = await response.json()
        setRecentWorks(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching recent works:', error)
      setRecentWorks([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">
            Welcome to your Opportunity Engine.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Find Opportunities
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Works</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15M+</div>
            <Link href="/sources" className="text-xs text-indigo-400 hover:underline">
              View Data Sources
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:bg-dark-800 transition-colors cursor-pointer" asChild>
          <Link href="/search?sort=created_at&order=desc">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Arrivals</CardTitle>
              <Calendar className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">View All</div>
              <p className="text-xs text-muted-foreground">
                Fresh public domain entries
              </p>
            </CardContent>
          </Link>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Opportunities</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <Link href="/portfolio" className="text-xs text-indigo-400 hover:underline">
              Go to Portfolio
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Start searching to populate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* The Factory - Quick Start */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">The Factory</h2>
          <Badge variant="outline" className="text-indigo-400 border-indigo-400">Beta</Badge>
        </div>
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
      </div>

      {/* Recent Works */}
      <Card>
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
      </Card>
    </div>
  )
}
