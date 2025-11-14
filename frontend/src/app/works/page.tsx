'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Star,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  Grid3X3,
  List
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

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
  }
  status: string
  created_at: string
  updated_at?: string
}

export default function WorksPage() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    media_type: '',
    year_from: '',
    year_to: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchWorks()
  }, [filters])

  const fetchWorks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/works?${params}`)
      if (response.ok) {
        const data = await response.json()
        setWorks(Array.isArray(data) ? data : [])
      } else {
        setWorks([])
      }
    } catch (error) {
      console.error('Error fetching works:', error)
      setWorks([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      media_type: '',
      year_from: '',
      year_to: '',
      sort_by: 'created_at',
      sort_order: 'desc'
    })
    setSearchQuery('')
  }

  const filteredWorks = works.filter(work => {
    if (searchQuery && !work.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !work.author.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType.toLowerCase()) {
      case 'book':
        return <BookOpen className="h-4 w-4" />
      case 'document':
        return <Calendar className="h-4 w-4" />
      default:
        return <BookOpen className="h-4 w-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Public Domain Works</h1>
          <p className="mt-2 text-gray-600">
            Browse and explore our catalog of public domain content.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search works..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Media Type
                </label>
                <Select
                  value={filters.media_type || 'all'}
                  onValueChange={(value) =>
                    handleFilterChange('media_type', value === 'all' ? '' : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="book">Books</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Year
                </label>
                <Input
                  type="number"
                  placeholder="1900"
                  value={filters.year_from}
                  onChange={(e) => handleFilterChange('year_from', e.target.value)}
                />
              </div>

              <div className="min-w-32">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Year
                </label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={filters.year_to}
                  onChange={(e) => handleFilterChange('year_to', e.target.value)}
                />
              </div>

              <Button type="button" variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredWorks.length} of {works.length} works
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <TrendingUp className="h-4 w-4" />
          Sorted by {filters.sort_by} ({filters.sort_order})
        </div>
      </div>

      {/* Works Grid/List */}
      {filteredWorks.length > 0 ? (
        <div className={viewMode === 'grid'
          ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
          : 'space-y-4'
        }>
          {filteredWorks.map((work) => (
            <Card key={work.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getMediaTypeIcon(work.media_type)}
                      <Badge variant="outline">{work.media_type}</Badge>
                      {work.metadata?.trend_score && (
                        <Badge variant={getTrendScoreColor(work.metadata.trend_score)}>
                          <TrendingUp className="mr-1 h-3 w-3" />
                          {work.metadata.trend_score.toFixed(0)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {work.source_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={work.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" asChild>
                        <Link href={`/works/${work.id}`}>
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {work.title}
                    </h3>
                    <p className="text-gray-600">
                      by {work.author || 'Unknown Author'}
                    </p>
                  </div>

                  {work.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {work.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Public Domain: {work.public_domain_year}
                    </span>
                    {work.original_publication_year && (
                      <span>
                        Originally Published: {work.original_publication_year}
                      </span>
                    )}
                    {work.page_count && (
                      <span>{work.page_count} pages</span>
                    )}
                    <span className="uppercase">{work.language}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No works found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search terms or filters to find more results.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
