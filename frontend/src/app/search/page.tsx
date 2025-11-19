'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Search,
  Filter,
  X,
  BookOpen,
  TrendingUp,
  Calendar,
  Globe,
  Star,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

interface SearchResult {
  id: number
  title: string
  author: string
  media_type: string
  language: string
  public_domain_year: number
  created_at: string
  metadata: any
  snippet: string
  relevance_score: number
  has_content: boolean
  content_length: number
}

interface SearchFacets {
  media_types: Array<{ value: string; count: number }>
  languages: Array<{ value: string; count: number }>
  decades: Array<{ value: number; count: number }>
  trend_score_ranges: Array<{ range: string; min: number; max: number; count: number }>
}

interface SearchResponse {
  query: string
  total_results: number
  page: number
  page_size: number
  total_pages: number
  results: SearchResult[]
  facets: SearchFacets
  search_time: string
  error?: string
}

interface SearchFilters {
  media_type?: string
  language?: string
  year_min?: number
  year_max?: number
  trend_score_min?: number
  has_content?: boolean
}

export default function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [filters, setFilters] = useState<SearchFilters>({})

  useEffect(() => {
    if (query.length >= 2) {
      fetchSuggestions(query)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [query])

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const performSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: page.toString(),
        page_size: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
        )
      })

      const response = await fetch(`${API_BASE_URL}/api/search/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
        setCurrentPage(page)
      } else {
        setError('Search failed. Please try again.')
      }
    } catch (error) {
      setError('Network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [sortBy, sortOrder, filters])

  const handleSearch = () => {
    performSearch(query, 1)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    performSearch(suggestion, 1)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    performSearch(query, page)
  }

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType?.toLowerCase()) {
      case 'book':
        return <BookOpen className="h-4 w-4" />
      case 'article':
        return <FileText className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getMediaTypeColor = (mediaType: string) => {
    switch (mediaType?.toLowerCase()) {
      case 'book':
        return 'bg-blue-100 text-blue-800'
      case 'article':
        return 'bg-green-100 text-green-800'
      case 'document':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to search the catalog</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Catalog</h1>
          <p className="mt-2 text-gray-600">
            Search through public domain works, documents, and content
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search titles, authors, content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {Object.values(filters).filter(v => v !== undefined && v !== '').length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v !== undefined && v !== '').length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <Card className="absolute top-full left-0 right-0 mt-1 z-10">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filters</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Media Type Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Media Type
                  </label>
                  <Select
                    value={filters.media_type || 'any'}
                    onValueChange={(value) =>
                      handleFilterChange('media_type', value === 'any' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any type</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Language
                  </label>
                  <Select
                    value={filters.language || 'any'}
                    onValueChange={(value) =>
                      handleFilterChange('language', value === 'any' ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any language</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Range Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Publication Year: {filters.year_min || 'Any'} - {filters.year_max || 'Any'}
                  </label>
                  <div className="px-2">
                    <Slider
                      value={[filters.year_min || 1800, filters.year_max || 2024]}
                      onValueChange={([min, max]) => {
                        handleFilterChange('year_min', min)
                        handleFilterChange('year_max', max)
                      }}
                      max={2024}
                      min={1800}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Content Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has_content"
                    checked={filters.has_content || false}
                    onCheckedChange={(checked) => handleFilterChange('has_content', checked)}
                  />
                  <label htmlFor="has_content" className="text-sm font-medium text-gray-700">
                    Has full content
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Results */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <div className="space-y-4">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {results.total_results.toLocaleString()} results found
              {results.query && ` for "${results.query}"`}
              {results.search_time && (
                <span className="text-sm text-gray-500 ml-2">
                  (Search took {new Date(results.search_time).getTime() - Date.now()}ms)
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="author">Author</SelectItem>
                  <SelectItem value="trend_score">Trend Score</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            {results.results.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getMediaTypeIcon(result.media_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {result.title}
                          </h3>
                          {result.author && (
                            <p className="text-gray-600 mb-2">by {result.author}</p>
                          )}

                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getMediaTypeColor(result.media_type)}>
                              {result.media_type}
                            </Badge>
                            {result.language && (
                              <Badge variant="outline">
                                <Globe className="h-3 w-3 mr-1" />
                                {result.language.toUpperCase()}
                              </Badge>
                            )}
                            {result.public_domain_year && (
                              <Badge variant="outline">
                                <Calendar className="h-3 w-3 mr-1" />
                                {result.public_domain_year}
                              </Badge>
                            )}
                            {result.has_content && (
                              <Badge variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                Full Content
                              </Badge>
                            )}
                          </div>

                          <div
                            className="text-gray-700 mb-3"
                            dangerouslySetInnerHTML={{
                              __html: result.snippet.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            }}
                          />

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Relevance: {result.relevance_score.toFixed(1)}
                            </span>
                            {result.content_length > 0 && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {formatFileSize(result.content_length)}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Added {format(new Date(result.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {result.metadata?.trend_score && (
                            <div className="text-right mb-2">
                              <div className="flex items-center gap-1 text-sm">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="font-medium">{result.metadata.trend_score}/100</span>
                              </div>
                              <p className="text-xs text-gray-500">Trend Score</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {results.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {results.page} of {results.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(results.page - 1)}
                  disabled={results.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(results.page + 1)}
                  disabled={results.page >= results.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {results && results.total_results === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}
