'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentWorks, setRecentWorks] = useState<Work[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Fix for SPA fallback serving dashboard on work detail routes
  useEffect(() => {
    if (pathname && pathname.startsWith('/works/') && pathname !== '/works') {
      // We're on a work detail route but dashboard is rendering (SPA fallback issue)
      // Force a router replace to make Next.js use the correct route handler
      router.replace(pathname)
      return // Don't load dashboard data
    }
  }, [pathname, router])

  useEffect(() => {
    // Only fetch dashboard data if we're actually on the dashboard
    if (!pathname || pathname === '/' || pathname === '') {
      fetchDashboardData()
      fetchRecentWorks()
    }
  }, [pathname])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard`)
      if (response.ok) {
        const data = await response.json()
        // Ensure top_performing_works is always an array
        if (data && !Array.isArray(data.top_performing_works)) {
          data.top_performing_works = []
        }
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchRecentWorks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/works?limit=6&sort_by=created_at&sort_order=desc`)
      if (response.ok) {
        const data = await response.json()
        // Ensure data is an array
        setRecentWorks(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching recent works:', error)
      setRecentWorks([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back! Here&apos;s what&apos;s happening with your public domain content.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/search">
              <Search className="mr-2 h-4 w-4" />
              Search Works
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/works">
              <BookOpen className="mr-2 h-4 w-4" />
              Browse All
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for public domain works..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit" className="px-8">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Works</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_works || 0}</div>
            <p className="text-xs text-muted-foreground">
              Public domain works in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.new_works_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Works added today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Trend Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.average_trend_score ? stats.average_trend_score.toFixed(1) : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average market interest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Monitoring opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Works and Top Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Works */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Works</CardTitle>
            <CardDescription>
              Latest additions to the catalog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(recentWorks) && recentWorks.slice(0, 5).map((work) => (
                <div key={work.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {work.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {work.author} • {work.public_domain_year}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {work.metadata?.trend_score && (
                      <Badge variant={work.metadata.trend_score > 70 ? 'success' : work.metadata.trend_score > 40 ? 'warning' : 'secondary'}>
                        {work.metadata.trend_score.toFixed(0)}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/works/${work.id}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/works">View All Works</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Works */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>
              Highest trend scores this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(stats?.top_performing_works) && stats.top_performing_works.slice(0, 5).map((work, index) => (
                <div key={work.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {work.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {work.author}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {work.metadata?.trend_score?.toFixed(0) || 'N/A'}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/works/${work.id}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/analytics">View Analytics</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/search">
                <Search className="h-5 w-5" />
                Search Works
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/trends">
                <TrendingUp className="h-5 w-5" />
                Trend Analysis
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/alerts">
                <Bell className="h-5 w-5" />
                Manage Alerts
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
