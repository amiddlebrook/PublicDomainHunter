'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Star,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  ArrowRight,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TrendingWork {
  id: number
  title: string
  author: string
  media_type: string
  trend_score: number
  demand_score: number
  search_volume: number
  trend_change: number
  public_domain_year: number
}

interface PopularWork {
  id: number
  title: string
  author: string
  media_type: string
  views: number
  downloads: number
  rating: number
}

export default function TrendingPage() {
  const router = useRouter()
  const [trendingWorks, setTrendingWorks] = useState<TrendingWork[]>([])
  const [hotWorks, setHotWorks] = useState<TrendingWork[]>([])
  const [risingWorks, setRisingWorks] = useState<TrendingWork[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    loadTrendingData()
  }, [timeframe])

  const loadTrendingData = async () => {
    try {
      const token = localStorage.getItem('token')

      // Load trending works (highest trend scores)
      const trendingResponse = await fetch(`/api/v1/works?sort_by=created_at&sort_order=desc&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (trendingResponse.ok) {
        const works = await trendingResponse.json()

        // Simulate trend data (in production, this would come from metrics)
        const worksWithTrends = works.map((work: any, index: number) => ({
          ...work,
          trend_score: 0.85 - (index * 0.03),
          demand_score: 0.78 - (index * 0.025),
          search_volume: 10000 - (index * 500),
          trend_change: 15 - (index * 1.2)
        }))

        // Split into categories
        const trending = worksWithTrends.filter((w: TrendingWork) => w.trend_score > 0.7)
        const hot = worksWithTrends.filter((w: TrendingWork) => w.search_volume > 5000)
        const rising = worksWithTrends.filter((w: TrendingWork) => w.trend_change > 10)

        setTrendingWorks(trending)
        setHotWorks(hot)
        setRisingWorks(rising)
      }
    } catch (error) {
      console.error('Failed to load trending data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadTrendingData()
    setRefreshing(false)
  }

  const getTrendIcon = (change: number) => {
    if (change > 10) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < -10) return <TrendingDown className="h-4 w-4 text-red-600" />
    return null
  }

  const getTrendColor = (change: number) => {
    if (change > 10) return 'text-green-600'
    if (change < -10) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const WorkCard = ({ work }: { work: TrendingWork }) => (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/works/${work.id}`)}
    >
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg line-clamp-2">{work.title}</h3>
              <p className="text-sm text-gray-600">{work.author || 'Unknown Author'}</p>
            </div>
            <div className="flex items-center gap-1 ml-2">
              {getTrendIcon(work.trend_change)}
              <span className={`text-sm font-bold ${getTrendColor(work.trend_change)}`}>
                {work.trend_change > 0 ? '+' : ''}{work.trend_change.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{work.media_type}</Badge>
            {work.public_domain_year && (
              <Badge variant="outline" className="bg-blue-50">
                <Calendar className="h-3 w-3 mr-1" />
                {work.public_domain_year}
              </Badge>
            )}
            {work.trend_score > 0.8 && (
              <Badge className="bg-orange-100 text-orange-800">
                <Flame className="h-3 w-3 mr-1" />
                Hot
              </Badge>
            )}
          </div>

          {/* Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Trend Score</span>
              <span className="font-bold text-blue-600">
                {(work.trend_score * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={work.trend_score * 100} className="h-2" />

            <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{formatNumber(work.search_volume)} searches</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{(work.demand_score * 100).toFixed(0)}% demand</span>
              </div>
            </div>
          </div>

          {/* Action */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/works/${work.id}`)
            }}
          >
            View Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            Trending Works
          </h1>
          <p className="text-gray-600 mt-1">Discover what's hot in public domain content</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2">
        <Button
          variant={timeframe === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeframe('day')}
        >
          Today
        </Button>
        <Button
          variant={timeframe === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeframe('week')}
        >
          This Week
        </Button>
        <Button
          variant={timeframe === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeframe('month')}
        >
          This Month
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trending Works</p>
                <p className="text-3xl font-bold text-blue-600">{trendingWorks.length}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hot Right Now</p>
                <p className="text-3xl font-bold text-orange-600">{hotWorks.length}</p>
              </div>
              <Flame className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rising Stars</p>
                <p className="text-3xl font-bold text-green-600">{risingWorks.length}</p>
              </div>
              <Star className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <TrendingUp className="h-4 w-4 mr-2" />
            All Trending
          </TabsTrigger>
          <TabsTrigger value="hot">
            <Flame className="h-4 w-4 mr-2" />
            Hot
          </TabsTrigger>
          <TabsTrigger value="rising">
            <Star className="h-4 w-4 mr-2" />
            Rising
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingWorks.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
          {trendingWorks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No trending works found for this timeframe
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hot" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotWorks.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
          {hotWorks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No hot works found for this timeframe
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rising" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {risingWorks.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
          {risingWorks.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No rising works found for this timeframe
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
