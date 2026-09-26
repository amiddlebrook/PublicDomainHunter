'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AIProviderSelector from '@/components/AIProviderSelector'
import {
  Brain,
  TrendingUp,
  BookOpen,
  Target,
  BarChart3,
  Lightbulb,
  Users,
  Clock,
  Star,
  RefreshCw,
  Zap,
  Search,
  Settings,
  Sparkles,
  BookmarkPlus,
  Check
} from 'lucide-react'
import { format } from 'date-fns'

interface Recommendation {
  work_id: number
  title: string
  author: string
  media_type: string
  language: string
  public_domain_year: number
  metadata: any
  created_at: string
  score: number
  reason: string
}

interface Topic {
  id: number
  top_words: string[]
  size: number
}

interface ContentInsights {
  work_id: number
  title: string
  author: string
  basic_insights: {
    media_type: string
    language: string
    public_domain_year: number
    has_full_content: boolean
    content_length: number
    trend_score: number
  }
  content_analysis: {
    word_count: number
    character_count: number
    sentence_count: number
    avg_word_length: number
    complexity_score: number
    topics: string[]
    sentiment: string
  }
  recommendations: Recommendation[]
  similar_works: Array<{
    work_id: number
    title: string
    author: string
    similarity_score: number
  }>
}

interface TrendPrediction {
  trend_predictions: {
    [key: string]: {
      current_avg: number
      predicted_trend: string
      confidence: number
      sample_size: number
    }
  }
  total_works_analyzed: number
  recent_works: number
  prediction_horizon_days: number
  analysis_timestamp: string
}

export default function AIInsightsPage() {
  const { user } = useAuth()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [contentInsights, setContentInsights] = useState<ContentInsights | null>(null)
  const [trendPredictions, setTrendPredictions] = useState<TrendPrediction | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(null)
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [savedWorks, setSavedWorks] = useState<Set<number>>(new Set())

  const handleSaveToPortfolio = async (workId: number) => {
    try {
      const token = localStorage.getItem('token')

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/portfolio/add`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ work_id: workId }),
        credentials: 'include'
      })

      if (response.ok) {
        setSavedWorks(prev => new Set(prev).add(workId))
      } else {
        console.error('Failed to save to portfolio')
      }
    } catch (error) {
      console.error('Error saving to portfolio:', error)
    }
  }

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/recommendations?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    }
  }

  useEffect(() => {
    loadRecommendations()
    loadTrendPredictions()
    loadAIStatus()
  }, [])

  const loadContentInsights = async (workId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/insights/${workId}`)
      if (response.ok) {
        const data = await response.json()
        setContentInsights(data)
      }
    } catch (error) {
      console.error('Failed to load content insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTrendPredictions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/trends`)
      if (response.ok) {
        const data = await response.json()
        setTrendPredictions(data)
      }
    } catch (error) {
      console.error('Failed to load trend predictions:', error)
    }
  }

  const loadAIStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/status`)
      if (response.ok) {
        const data = await response.json()
        setAiStatus(data)
      }
    } catch (error) {
      console.error('Failed to load AI status:', error)
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecommendationReasonIcon = (reason: string) => {
    switch (reason) {
      case 'content_similarity':
        return <Target className="h-4 w-4" />
      case 'user_preferences':
        return <Users className="h-4 w-4" />
      case 'collaborative_popularity':
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getRecommendationReasonColor = (reason: string) => {
    switch (reason) {
      case 'content_similarity':
        return 'bg-blue-100 text-blue-800'
      case 'user_preferences':
        return 'bg-purple-100 text-purple-800'
      case 'collaborative_popularity':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to access AI insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Insights
          </h1>
          <p className="mt-2 text-gray-400">
            Machine learning-powered content analysis and recommendations
          </p>
        </div>
        <Button onClick={loadAIStatus} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* AI Status Overview */}
      {aiStatus && (
        <Card className="bg-dark-900 border-dark-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              AI System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {aiStatus.model_status === 'trained' ? '✓' : '○'}
                </div>
                <p className="text-sm text-gray-600">Model Status</p>
                <p className="text-xs text-gray-500 capitalize">{aiStatus.model_status.replace('_', ' ')}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {aiStatus.total_works.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">Total Works</p>
                <p className="text-xs text-gray-500">{aiStatus.trainable_works} trainable</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {aiStatus.training_coverage.toFixed(0)}%
                </div>
                <p className="text-sm text-gray-600">Coverage</p>
                <p className="text-xs text-gray-500">Training data</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {aiStatus.capabilities?.length || 0}
                </div>
                <p className="text-sm text-gray-600">Capabilities</p>
                <p className="text-xs text-gray-500">AI features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Content Insights
          </TabsTrigger>
          <TabsTrigger value="llm" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            LLM Analysis
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card className="bg-dark-900 border-dark-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                AI-Powered Recommendations
              </CardTitle>
              <CardDescription>
                Personalized content recommendations based on your preferences and reading history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No recommendations yet</h3>
                  <p className="text-gray-400 mb-4">
                    Start exploring content to get personalized recommendations
                  </p>
                  <Button onClick={loadRecommendations}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Recommendations
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <Card key={rec.work_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <h3 className="font-semibold text-white">{rec.title}</h3>
                              {rec.author && (
                                <span className="text-gray-600">by {rec.author}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                              <Badge className={getRecommendationReasonColor(rec.reason)}>
                                {getRecommendationReasonIcon(rec.reason)}
                                <span className="ml-1 capitalize">{rec.reason.replace('_', ' ')}</span>
                              </Badge>
                              <Badge variant="outline">
                                <Star className="h-3 w-3 mr-1" />
                                {rec.score.toFixed(2)}
                              </Badge>
                              <Badge variant="outline">{rec.media_type}</Badge>
                              {rec.language && (
                                <Badge variant="outline">{rec.language.toUpperCase()}</Badge>
                              )}
                              {rec.public_domain_year && (
                                <Badge variant="outline">{rec.public_domain_year}</Badge>
                              )}
                            </div>

                            {rec.metadata?.trend_score && (
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-600">
                                  Trend Score: {rec.metadata.trend_score}/100
                                </span>
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkId(rec.work_id)
                              loadContentInsights(rec.work_id)
                            }}
                          >
                            View Insights
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleSaveToPortfolio(rec.work_id)}
                            disabled={savedWorks.has(rec.work_id)}
                          >
                            {savedWorks.has(rec.work_id) ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <BookmarkPlus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Content Analysis
              </CardTitle>
              <CardDescription>
                AI-powered analysis of individual works with detailed insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Analyzing content...</p>
                </div>
              ) : contentInsights ? (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Basic Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Title:</span>
                          <span className="font-medium">{contentInsights.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Author:</span>
                          <span className="font-medium">{contentInsights.author || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Media Type:</span>
                          <Badge variant="outline">{contentInsights.basic_insights.media_type}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Language:</span>
                          <Badge variant="outline">{contentInsights.basic_insights.language}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Publication Year:</span>
                          <span className="font-medium">{contentInsights.basic_insights.public_domain_year}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trend Score:</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={contentInsights.basic_insights.trend_score}
                              className="w-20"
                            />
                            <span className="font-medium">{contentInsights.basic_insights.trend_score}/100</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Content Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Word Count:</span>
                          <span className="font-medium">{contentInsights.content_analysis.word_count?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sentiment:</span>
                          <Badge className={getSentimentColor(contentInsights.content_analysis.sentiment)}>
                            {contentInsights.content_analysis.sentiment}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Complexity:</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={contentInsights.content_analysis.complexity_score}
                              className="w-20"
                            />
                            <span className="font-medium">{contentInsights.content_analysis.complexity_score?.toFixed(1)}%</span>
                          </div>
                        </div>
                        {contentInsights.content_analysis.topics && contentInsights.content_analysis.topics.length > 0 && (
                          <div>
                            <span className="text-gray-600">Topics:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {contentInsights.content_analysis.topics.map((topic, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Similar Works */}
                  {contentInsights.similar_works && contentInsights.similar_works.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Similar Works</CardTitle>
                        <CardDescription>
                          Works with similar content and themes
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {contentInsights.similar_works.map((work) => (
                            <div key={work.work_id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{work.title}</h4>
                                <p className="text-sm text-gray-600">by {work.author || 'Unknown'}</p>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <Target className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium">
                                    {(work.similarity_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">similarity</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Select Content to Analyze</h3>
                  <p className="text-gray-400 mb-4">
                    Choose a work from recommendations or search to get AI insights
                  </p>
                  <Button onClick={() => loadRecommendations()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Load Recommendations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Analysis Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Trend Predictions
              </CardTitle>
              <CardDescription>
                AI-powered analysis of content trends and popularity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendPredictions ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Analysis Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Works:</span>
                            <span className="font-medium">{trendPredictions.total_works_analyzed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recent Works:</span>
                            <span className="font-medium">{trendPredictions.recent_works.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prediction Horizon:</span>
                            <span className="font-medium">{trendPredictions.prediction_horizon_days} days</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Trend Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(trendPredictions.trend_predictions).map(([mediaType, prediction]) => (
                            <div key={mediaType} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium capitalize">{mediaType}</span>
                                <Badge variant={prediction.predicted_trend === 'rising' ? 'default' : 'secondary'}>
                                  {prediction.predicted_trend}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={prediction.current_avg} className="flex-1" />
                                <span className="text-xs text-gray-500 w-12">
                                  {prediction.current_avg.toFixed(1)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                {prediction.sample_size} samples, {(prediction.confidence * 100).toFixed(0)}% confidence
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Prediction Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="font-medium text-blue-900">Rising Trends</p>
                            <p className="text-blue-700 text-xs mt-1">
                              Content types showing increasing popularity
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="font-medium text-green-900">Stable Trends</p>
                            <p className="text-green-700 text-xs mt-1">
                              Consistent performance across time periods
                            </p>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-white">Data Quality</p>
                            <p className="text-gray-700 text-xs mt-1">
                              Based on {trendPredictions.recent_works} recent works
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Loading Trend Analysis</h3>
                  <p className="text-gray-400 mb-4">
                    Analyzing content trends and patterns...
                  </p>
                  <Button onClick={loadTrendPredictions}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* LLM Analysis Tab */}
        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                LLM-Powered Analysis
              </CardTitle>
              <CardDescription>
                Advanced content analysis using multiple AI language models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Sparkles className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">LLM Analysis Ready</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Use powerful language models from OpenAI, Claude, Gemini, and others to analyze
                  content, generate insights, and provide intelligent recommendations.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  <Badge variant="outline">Content Analysis</Badge>
                  <Badge variant="outline">Sentiment Analysis</Badge>
                  <Badge variant="outline">Topic Extraction</Badge>
                  <Badge variant="outline">Quality Assessment</Badge>
                  <Badge variant="outline">Multi-Model Comparison</Badge>
                </div>
                <Alert className="max-w-xl mx-auto">
                  <AlertDescription className="text-left">
                    To use LLM analysis features:
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Configure your AI providers in the &quot;Configure&quot; tab</li>
                      <li>Enable at least one provider</li>
                      <li>Select a work to analyze from the recommendations or insights tab</li>
                      <li>Use the API endpoints to get LLM-powered analysis</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Analysis Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Trend Predictions
              </CardTitle>
              <CardDescription>
                AI-powered analysis of content trends and popularity patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trendPredictions ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Analysis Overview</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Works:</span>
                            <span className="font-medium">{trendPredictions.total_works_analyzed.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recent Works:</span>
                            <span className="font-medium">{trendPredictions.recent_works.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Prediction Horizon:</span>
                            <span className="font-medium">{trendPredictions.prediction_horizon_days} days</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Trend Analysis</h3>
                  <p className="text-gray-600 mb-4">
                    Analyzing content trends and patterns...
                  </p>
                  <Button onClick={loadTrendPredictions}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Analysis
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-4">
          <AIProviderSelector />
        </TabsContent>
      </Tabs>
    </div>
  )
}
