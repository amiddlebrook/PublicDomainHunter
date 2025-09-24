'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Bell,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface AnalyticsData {
  overview: {
    total_works: number
    total_users: number
    active_alerts: number
    avg_trend_score: number
    last_updated: string
  }
  time_series: {
    works_over_time: Array<{
      date: string
      count: number
      cumulative: number
    }>
    trend_scores_over_time: Array<{
      date: string
      avg_score: number
      trend: string
    }>
  }
  breakdowns: {
    media_types: Array<{
      type: string
      count: number
      percentage: number
      color: string
    }>
    publication_years: Array<{
      year: number
      count: number
      decade: string
    }>
    languages: Array<{
      code: string
      name: string
      count: number
    }>
  }
  top_performers: {
    trending_works: Array<{
      id: number
      title: string
      author: string
      trend_score: number
      media_type: string
      created_at: string
    }>
    authors: Array<{
      author: string
      work_count: number
      percentage: number
    }>
    categories: Array<{
      category: string
      count: number
    }>
  }
  market_insights: {
    opportunities: Array<{
      work_id: number
      title: string
      author: string
      trend_score: number
      competition_score: number
      monetization_potential: number
      opportunity_level: string
    }>
    competition: {
      total_market_size: string
      competition_level: string
      market_trends: string
      top_competitors: Array<{
        name: string
        market_share: number
      }>
      recommendations: string[]
    }
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#f97316']

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/analytics/dashboard')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
        setLastRefresh(new Date())
      } else {
        setError('Failed to load analytics data')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchAnalytics()
  }

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/analytics/export/dashboard?format=${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-export-${format}-${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ Error loading analytics</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No analytics data available</p>
        <Button onClick={handleRefresh} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          Load Analytics
        </Button>
      </div>
    )
  }

  const { overview, time_series, breakdowns, top_performers, market_insights } = analyticsData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive insights into public domain content and market trends.
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {format(lastRefresh, 'MMM d, yyyy HH:mm')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Works</p>
                <p className="text-2xl font-bold text-gray-900">{overview.total_works.toLocaleString()}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Public Domain Content</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{overview.active_alerts.toLocaleString()}</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600">Monitoring Active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Trend Score</p>
                <p className="text-2xl font-bold text-gray-900">{overview.avg_trend_score}/100</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">Market Interest</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Users</p>
                <p className="text-2xl font-bold text-gray-900">{overview.total_users.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-purple-600">Growing Community</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="market">Market Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Works Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Works Over Time</CardTitle>
                <CardDescription>Public domain works added to the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={time_series.works_over_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                      formatter={(value: number) => [value, 'Works Added']}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Scores Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Trend Scores Over Time</CardTitle>
                <CardDescription>Average trend scores for new content</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={time_series.trend_scores_over_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      labelFormatter={(value) => format(parseISO(value as string), 'MMM dd, yyyy')}
                      formatter={(value: number) => [value, 'Avg Trend Score']}
                    />
                    <Line
                      type="monotone"
                      dataKey="avg_score"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdowns" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Media Types */}
            <Card>
              <CardHeader>
                <CardTitle>Content by Media Type</CardTitle>
                <CardDescription>Distribution of content types in the catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={breakdowns.media_types}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {breakdowns.media_types.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Publication Years */}
            <Card>
              <CardHeader>
                <CardTitle>Publication Years</CardTitle>
                <CardDescription>Distribution by publication decade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={breakdowns.publication_years}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="decade" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Top Trending Works */}
            <Card>
              <CardHeader>
                <CardTitle>Top Trending Works</CardTitle>
                <CardDescription>Highest trend score content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {top_performers.trending_works.slice(0, 5).map((work, index) => (
                    <div key={work.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{work.title}</div>
                        <div className="text-sm text-gray-600">{work.author}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={work.trend_score > 80 ? 'default' : 'secondary'}>
                          {work.trend_score}/100
                        </Badge>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Authors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Authors</CardTitle>
                <CardDescription>Most prolific authors in the catalog</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={top_performers.authors.slice(0, 10)} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="author" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="work_count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Market Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Market Opportunities</CardTitle>
                <CardDescription>High-potential works with low competition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {market_insights.opportunities.slice(0, 5).map((opportunity, index) => (
                    <div key={opportunity.work_id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{opportunity.title}</div>
                        <Badge variant={opportunity.opportunity_level === 'high' ? 'default' : 'secondary'}>
                          {opportunity.opportunity_level}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{opportunity.author}</div>
                      <div className="flex items-center justify-between mt-2 text-sm">
                        <span>Trend: {opportunity.trend_score}/100</span>
                        <span>Competition: {opportunity.competition_score}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Competition Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Analysis</CardTitle>
                <CardDescription>Market landscape overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Market Size</div>
                      <div className="font-semibold text-lg">{market_insights.competition.total_market_size}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Competition Level</div>
                      <div className="font-semibold text-lg">{market_insights.competition.competition_level}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Top Competitors</h4>
                    <div className="space-y-2">
                      {market_insights.competition.top_competitors.map((competitor, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{competitor.name}</span>
                          <span className="text-sm font-medium">{competitor.market_share}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {market_insights.competition.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
