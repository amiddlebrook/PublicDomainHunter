'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Book,
  Calendar,
  Download,
  Globe,
  FileText,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Share2,
  Bookmark,
  BarChart3,
  Brain,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface Work {
  id: number
  title: string
  author: string
  original_publication_year: number
  public_domain_year: number
  description: string
  source_url: string
  download_url: string
  media_type: string
  language: string
  page_count: number
  file_size: number
  metadata: any
  status: string
  created_at: string
  updated_at: string
}

interface WorkMetric {
  id: number
  work_id: number
  metric_date: string
  search_volume: number
  trend_score: number
  competition_score: number
  demand_score: number
  monetization_potential: number
  amazon_sales_rank: number
  google_trends_interest: number
  metadata: any
  created_at: string
}

interface AIInsight {
  summary: string
  sentiment: string
  topics: string[]
  quality_score: number
  recommendations: string[]
}

export default function WorkDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workId = params.id as string

  const [work, setWork] = useState<Work | null>(null)
  const [metrics, setMetrics] = useState<WorkMetric[]>([])
  const [aiInsights, setAIInsights] = useState<AIInsight | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshingMetrics, setRefreshingMetrics] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkDetails()
    loadMetrics()
    loadAIInsights()
  }, [workId])

  const loadWorkDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/works/${workId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWork(data)
      } else if (response.status === 404) {
        setError('Work not found')
      } else {
        throw new Error('Failed to load work details')
      }
    } catch (err) {
      console.error('Failed to load work:', err)
      setError('Failed to load work details')
    } finally {
      setLoading(false)
    }
  }

  const loadMetrics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/works/${workId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (err) {
      console.error('Failed to load metrics:', err)
    }
  }

  const loadAIInsights = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/ai/llm/insights/${workId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAIInsights(data)
      }
    } catch (err) {
      console.error('Failed to load AI insights:', err)
    }
  }

  const refreshMetrics = async () => {
    setRefreshingMetrics(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/works/${workId}/metrics/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        await loadMetrics()
      }
    } catch (err) {
      console.error('Failed to refresh metrics:', err)
    } finally {
      setRefreshingMetrics(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    if (!num) return '0'
    return new Intl.NumberFormat().format(num)
  }

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'book':
        return <Book className="h-5 w-5" />
      case 'document':
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600'
    if (score >= 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Work not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/works')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Works
        </Button>
      </div>
    )
  }

  const latestMetric = metrics.length > 0 ? metrics[0] : null

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/works')}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Works
          </Button>
          <div className="flex items-center gap-3">
            {getMediaTypeIcon(work.media_type)}
            <h1 className="text-3xl font-bold">{work.title}</h1>
          </div>
          <p className="text-xl text-gray-600">by {work.author || 'Unknown Author'}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{work.media_type}</Badge>
            <Badge variant="outline">{work.language}</Badge>
            {work.status === 'active' && (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          {work.download_url && (
            <Button size="sm" asChild>
              <a href={work.download_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published</p>
                <p className="text-2xl font-bold">{work.original_publication_year || 'Unknown'}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Public Domain</p>
                <p className="text-2xl font-bold">{work.public_domain_year || 'Unknown'}</p>
              </div>
              <Globe className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pages</p>
                <p className="text-2xl font-bold">{work.page_count || 'N/A'}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">File Size</p>
                <p className="text-2xl font-bold">{formatFileSize(work.file_size)}</p>
              </div>
              <Download className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics & Analytics</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {work.description || 'No description available.'}
              </p>
            </CardContent>
          </Card>

          {latestMetric && (
            <Card>
              <CardHeader>
                <CardTitle>Current Performance Scores</CardTitle>
                <CardDescription>Latest metrics snapshot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Trend Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(latestMetric.trend_score)}`}>
                      {(latestMetric.trend_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={latestMetric.trend_score * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Demand Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(latestMetric.demand_score)}`}>
                      {(latestMetric.demand_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={latestMetric.demand_score * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Competition Score</span>
                    <span className={`text-sm font-bold ${getScoreColor(1 - latestMetric.competition_score)}`}>
                      {(latestMetric.competition_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={latestMetric.competition_score * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monetization Potential</span>
                    <span className={`text-sm font-bold ${getScoreColor(latestMetric.monetization_potential)}`}>
                      {(latestMetric.monetization_potential * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={latestMetric.monetization_potential * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          )}

          {work.source_url && (
            <Card>
              <CardHeader>
                <CardTitle>Source Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a href={work.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Original Source
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Historical Metrics</h2>
            <Button
              onClick={refreshMetrics}
              disabled={refreshingMetrics}
              variant="outline"
              size="sm"
            >
              {refreshingMetrics ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Metrics
            </Button>
          </div>

          {metrics.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Trend Score Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[...metrics].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="metric_date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any) => [(value * 100).toFixed(1) + '%', 'Trend Score']}
                      />
                      <Area
                        type="monotone"
                        dataKey="trend_score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Volume & Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={[...metrics].reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="metric_date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="search_volume"
                        stroke="#10b981"
                        name="Search Volume"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="google_trends_interest"
                        stroke="#f59e0b"
                        name="Google Trends"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {latestMetric && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Search Volume</p>
                        <p className="text-3xl font-bold text-blue-600">
                          {formatNumber(latestMetric.search_volume)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Google Trends Interest</p>
                        <p className="text-3xl font-bold text-orange-600">
                          {latestMetric.google_trends_interest?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Amazon Sales Rank</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {latestMetric.amazon_sales_rank ? `#${formatNumber(latestMetric.amazon_sales_rank)}` : 'N/A'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No metrics available yet. Click "Refresh Metrics" to generate initial analytics.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-4">
          {aiInsights ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI-Generated Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{aiInsights.summary}</p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className="text-lg px-4 py-2">
                      {aiInsights.sentiment || 'Neutral'}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quality Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-blue-600">
                        {aiInsights.quality_score?.toFixed(1) || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-600">/ 10.0</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {aiInsights.topics && aiInsights.topics.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detected Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {aiInsights.topics.map((topic, index) => (
                        <Badge key={index} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiInsights.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertDescription>
                AI insights are being generated. Check back in a few moments.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Metadata Tab */}
        <TabsContent value="metadata" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-600">Work ID</dt>
                  <dd className="text-sm text-gray-900">{work.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Media Type</dt>
                  <dd className="text-sm text-gray-900">{work.media_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Language</dt>
                  <dd className="text-sm text-gray-900">{work.language}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Status</dt>
                  <dd className="text-sm text-gray-900">{work.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(work.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {work.updated_at ? new Date(work.updated_at).toLocaleDateString() : 'Never'}
                  </dd>
                </div>
              </dl>

              {work.metadata && Object.keys(work.metadata).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Additional Metadata</h4>
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(work.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
