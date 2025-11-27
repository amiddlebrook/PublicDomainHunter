'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Calendar,
  ExternalLink,
  ArrowLeft,
  TrendingUp,
  FileText,
  Globe,
  Hash,
  Download,
  Share2,
  Bookmark,
  Activity,
  BarChart3,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL, sanitizeText } from '@/lib/utils'
import { MonetizationPanel } from '@/components/MonetizationPanel'

interface Work {
  id: number | string
  title: string
  author?: string
  original_publication_year?: number
  public_domain_year?: number
  description?: string
  source_url?: string
  media_type?: string
  language?: string
  page_count?: number
  metadata?: {
    trend_score?: number
    [key: string]: any
  }
  status?: string
  created_at?: string
  updated_at?: string
}

interface WorkDetailClientProps {
  workId: string
}

export default function WorkDetailClient({ workId }: WorkDetailClientProps) {
  const [work, setWork] = useState<Work | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWork = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/api/works/${workId}`)
        if (response.ok) {
          const data = await response.json()
          setWork(data)
        } else {
          setError('Work not found')
        }
      } catch (error) {
        console.error('Error fetching work:', error)
        setError('Error loading work details')
      } finally {
        setLoading(false)
      }
    }

    fetchWork()
  }, [workId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <BookOpen className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{error || 'Asset not found'}</h3>
        <Button variant="outline" asChild>
          <Link href="/works">Return to Asset Inspector</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Asset Header */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-6 mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                <Link href="/works" className="hover:text-indigo-600 flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Asset Inspector
                </Link>
                <span>/</span>
                <span className="uppercase tracking-wider font-semibold text-xs">{work.media_type || 'WORK'}</span>
                <span>/</span>
                <span className="font-mono text-xs">{work.id}</span>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{work.title}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="font-medium">{work.author || 'Unknown Author'}</span>
                {work.original_publication_year && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{work.original_publication_year}</span>
                  </>
                )}
                {work.language && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span className="uppercase">{work.language}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Track
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {work.source_url && (
                <Button size="sm" asChild>
                  <a href={work.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Source
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Trend Score</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {work.metadata?.trend_score || '-'}
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  High
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Public Domain</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{work.public_domain_year || 'Yes'}</span>
                {work.public_domain_year && <span className="text-xs font-medium text-gray-500">Global</span>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Content Status</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white capitalize">{work.status || 'active'}</span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 mb-1">Data Quality</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">A+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analysis Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monetization Engine */}
          <MonetizationPanel workId={work.id} />

          {/* Description & Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Asset Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {sanitizeText(work.description) || 'No description available for this asset.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Technical Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {work.media_type && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Media Type</span>
                  <span className="text-sm font-medium text-white capitalize">{work.media_type}</span>
                </div>
              )}
              {work.language && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Language</span>
                  <span className="text-sm font-medium text-white uppercase">{work.language}</span>
                </div>
              )}
              {work.page_count && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Page Count</span>
                  <span className="text-sm font-medium text-white">{work.page_count}</span>
                </div>
              )}
              {work.created_at && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Added to System</span>
                  <span className="text-sm font-medium text-white">
                    {new Date(work.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="pt-4">
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Metadata
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Market Signals (Placeholder for future expansion) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                Market Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Search Volume</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">High</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Competition</span>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Med</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
