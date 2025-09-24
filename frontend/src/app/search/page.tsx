'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Filter,
  BookOpen,
  Calendar,
  Star,
  ArrowUpRight,
  TrendingUp,
  Users,
  ExternalLink
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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

interface SearchResponse {
  query: string
  total_results: number
  works: Work[]
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    media_type: '',
    year_from: '',
    year_to: '',
    include_trends: true,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '50',
        include_trends: filters.include_trends.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== false)
        )
      })

      const response = await fetch(`/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Error performing search:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      media_type: '',
      year_from: '',
      year_to: '',
      include_trends: true,
      sort_by: 'created_at',
      sort_order: 'desc'
    })
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search Public Domain Works</h1>
        <p className="mt-2 text-gray-600">
          Discover and explore public domain content with advanced filtering and analytics.
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for books, authors, or topics..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Search
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Media Type
                </label>
                <Select
                  value={filters.media_type}
                  onValueChange={(value) => handleFilterChange('media_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include_trends"
                  checked={filters.include_trends}
                  onCheckedChange={(checked) => handleFilterChange('include_trends', checked as boolean)}
                />
                <label htmlFor="include_trends" className="text-sm font-medium text-gray-700">
                  Include trend analysis
                </label>
              </div>

              <Button type="button" variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Found {results.total_results} results for "{results.query}"
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              Trend scores included
            </div>
          </div>

          <div className="grid gap-4">
            {results.works.map((work) => (
              <Card key={work.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getMediaTypeIcon(work.media_type)}
                        <Badge variant="outline">{work.media_type}</Badge>
                        {work.metadata?.trend_score && (
                          <Badge variant={getTrendScoreColor(work.metadata.trend_score)}>
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {work.metadata.trend_score.toFixed(0)}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {work.title}
                      </h3>

                      <p className="text-gray-600 mb-2">
                        by {work.author || 'Unknown Author'}
                      </p>

                      {work.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
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

                    <div className="flex items-center gap-2 ml-4">
                      {work.source_url && (
                        <Button variant="outline" size="sm" asChild>
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
                </CardContent>
              </Card>
            ))}
          </div>

          {results.works.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
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
      )}

      {/* No Search Yet */}
      {!results && !initialQuery && (
        <Card>
          <CardContent className="pt-6 text-center">
            <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Start Your Search</h3>
            <p className="text-gray-500 mb-6">
              Enter keywords above to discover public domain works with trend analysis and market insights.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Shakespeare', 'Jane Austen', 'Mark Twain', 'Charles Dickens', 'Edgar Allan Poe'].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(suggestion)
                    performSearch(suggestion)
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
