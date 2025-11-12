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
  Hash
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Work {
  id: number
  title: string
  author: string
  original_publication_year?: number
  public_domain_year: number
  description?: string
  source_url?: string
  media_type: string
  language: string
  page_count?: number
  metadata?: {
    trend_score?: number
    [key: string]: any
  }
  status: string
  created_at: string
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
        const response = await fetch(`/api/works/${workId}`)
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

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType.toLowerCase()) {
      case 'book':
        return <BookOpen className="h-5 w-5" />
      case 'document':
        return <FileText className="h-5 w-5" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getTrendScoreColor = (score?: number) => {
    if (!score) return 'secondary'
    if (score >= 70) return 'success'
    if (score >= 40) return 'warning'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !work) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/works">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Works
          </Link>
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{error || 'Work not found'}</h3>
            <p className="text-gray-500">
              The work you&apos;re looking for could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" asChild>
        <Link href="/works">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Works
        </Link>
      </Button>

      {/* Work Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getMediaTypeIcon(work.media_type)}
              <Badge variant="outline">{work.media_type}</Badge>
              {work.metadata?.trend_score && (
                <Badge variant={getTrendScoreColor(work.metadata.trend_score)}>
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Trend Score: {work.metadata.trend_score.toFixed(0)}
                </Badge>
              )}
              <Badge variant="outline">{work.status}</Badge>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{work.title}</h1>
            <p className="text-xl text-gray-600">by {work.author || 'Unknown Author'}</p>
          </div>
          {work.source_url && (
            <Button asChild>
              <a href={work.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Source
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Work Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Publication Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Public Domain Year:</span>
              <span>{work.public_domain_year}</span>
            </div>
            {work.original_publication_year && (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Original Publication:</span>
                <span>{work.original_publication_year}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Globe className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Language:</span>
              <span className="uppercase">{work.language}</span>
            </div>
            {work.page_count && (
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Page Count:</span>
                <span>{work.page_count} pages</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-700">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="font-medium">Work ID:</span>
              <span>{work.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2 text-gray-700">
              <span className="font-medium min-w-24">Status:</span>
              <span className="capitalize">{work.status}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <span className="font-medium min-w-24">Created:</span>
              <span>{new Date(work.created_at).toLocaleDateString()}</span>
            </div>
            {work.updated_at && (
              <div className="flex items-start gap-2 text-gray-700">
                <span className="font-medium min-w-24">Updated:</span>
                <span>{new Date(work.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {work.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{work.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      {work.metadata && Object.keys(work.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(work.metadata).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-gray-700">
                  <span className="font-medium capitalize min-w-32">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="flex-1">{JSON.stringify(value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
