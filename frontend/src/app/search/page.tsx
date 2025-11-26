'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Search,
  Filter,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  TrendingUp,
  MoreHorizontal,
  Download,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Activity,
  Sparkles,
  Info
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import clsx from 'clsx'

interface SearchResult {
  id: number
  title: string
  author: string
  media_type: string
  language: string
  public_domain_year: number
  created_at?: string
  metadata: any
  snippet?: string
  description?: string
  relevance_score?: number
  has_content: boolean
  content_length?: number
  monetization_score?: number
  saturation_index?: number
}

interface SearchResponse {
  query: string
  total_results: number
  page: number
  page_size: number
  total_pages: number
  results: SearchResult[]
  facets: any
  search_time: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState<any>({
    minYear: 1800,
    maxYear: 2030,
    mediaTypes: [] as string[],
    minScore: 0
  })

  const performSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        page_size: '20'
      })

      // Add filters
      if (filters.mediaTypes.length > 0) {
        filters.mediaTypes.forEach((type: string) => params.append('media_type', type))
      }
      if (filters.minYear) params.append('min_year', filters.minYear.toString())
      if (filters.maxYear) params.append('max_year', filters.maxYear.toString())
      if (filters.minScore > 0) params.append('min_score', filters.minScore.toString())

      const response = await fetch(`${API_BASE_URL}/api/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Search failed', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleSearch = () => performSearch(query, 1)

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
  }

  const toggleMediaType = (type: string) => {
    setFilters((prev: any) => {
      const current = prev.mediaTypes
      const updated = current.includes(type)
        ? current.filter((t: string) => t !== type)
        : [...current, type]
      return { ...prev, mediaTypes: updated }
    })
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (!results) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `market-intelligence-${timestamp}.${format}`

    if (format === 'json') {
      const json = JSON.stringify(results, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // CSV export
      const headers = ['Title', 'Author', 'Type', 'Year', 'Monetization Score', 'Saturation Index']
      const rows = results.results.map((r: SearchResult) => [
        r.title,
        r.author || 'Unknown',
        r.media_type,
        r.public_domain_year,
        r.monetization_score || 0,
        r.saturation_index || 0
      ])
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleTrack = async (workId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/tracking/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ work_id: workId })
      })
      if (response.ok) {
        alert('Added to tracking list!')
      }
    } catch (error) {
      console.error('Failed to track work', error)
    }
  }

  const handleShare = (workId: number) => {
    const url = `${window.location.origin}/works/${workId}`
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!')
    })
  }

  const handleSaveToPortfolio = async (workId: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/portfolio/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({ work_id: workId })
      })
      if (response.ok) {
        alert('Added to portfolio!')
      }
    } catch (error) {
      console.error('Failed to add to portfolio', error)
    }
  }

  if (!user) return <div className="p-8 text-center text-gray-500">Please log in to access Market Intelligence.</div>

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Market Intelligence</h1>
          </div>
          <p className="text-sm text-gray-400">Search our catalog of public domain works with advanced filters and monetization metrics.</p>
          <p className="text-xs text-gray-500 mt-1">Filter by media type, year range, and monetization potential to find the best opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={!results || results.results.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={!results || results.results.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between border-b border-dark-700 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Catalog Search</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/viability">
                <Sparkles className="h-4 w-4 mr-2" />
                Try Viability Lab
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={clsx("text-gray-400", showFilters && "bg-dark-800 text-white")}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <div className="w-px h-4 bg-gray-200 mx-2" />
            <div className="flex items-center border border-dark-700 rounded-md bg-dark-900 shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-dark-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-dark-800 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 mt-4">
          <div className="flex flex-1 gap-6 min-h-0 relative">
            {/* Filter Sidebar */}
            <aside
              className={clsx(
                "w-full md:w-64 shrink-0 overflow-y-auto pr-2 border-r border-dark-700 bg-dark-950/95 backdrop-blur-sm md:bg-transparent p-4 md:p-0 z-20 transition-all duration-200",
                showFilters ? "block" : "hidden",
                "absolute inset-0 md:static"
              )}
            >
              <div className="flex justify-between items-center md:hidden mb-4">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Media Type</h3>
                  <div className="space-y-2">
                    {['book', 'image', 'audio', 'video'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={filters.mediaTypes.includes(type)}
                          onCheckedChange={() => toggleMediaType(type)}
                        />
                        <label
                          htmlFor={`type-${type}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Public Domain Year</h3>
                  <div className="px-2">
                    <Slider
                      defaultValue={[1800, 2030]}
                      max={2030}
                      min={1800}
                      step={1}
                      className="my-4"
                      onValueChange={(val) => {
                        handleFilterChange('minYear', val[0])
                        handleFilterChange('maxYear', val[1])
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{filters.minYear}</span>
                      <span>{filters.maxYear}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Monetization Potential</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="high-potential"
                        checked={filters.minScore === 80}
                        onCheckedChange={(checked) => handleFilterChange('minScore', checked ? 80 : 0)}
                      />
                      <label htmlFor="high-potential" className="text-sm">High (&gt;80)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="med-potential"
                        checked={filters.minScore === 50}
                        onCheckedChange={(checked) => handleFilterChange('minScore', checked ? 50 : 0)}
                      />
                      <label htmlFor="med-potential" className="text-sm">Medium (&gt;50)</label>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="flex gap-2 mb-4 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by title, author, or keyword..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {/* Results Area */}
              <div className="flex-1 bg-dark-900 rounded-lg border border-dark-700 shadow-sm overflow-hidden flex flex-col">
                {viewMode === 'table' ? (
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left relative">
                      <thead className="text-xs text-gray-400 uppercase bg-dark-950 border-b border-dark-700 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 font-medium">Asset Name</th>
                          <th className="px-6 py-3 font-medium">Type</th>
                          <th className="px-6 py-3 font-medium">Author</th>
                          <th className="px-6 py-3 font-medium">Year</th>
                          <th className="px-6 py-3 font-medium">Monetization</th>
                          <th className="px-6 py-3 font-medium">Saturation</th>
                          <th className="px-6 py-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700">
                        {results?.results.map((result) => {
                          const monetizationScore = result.monetization_score || 0
                          const saturationIndex = result.saturation_index || 0

                          return (
                            <tr key={result.id} className="hover:bg-dark-800 transition-colors">
                              <td className="px-6 py-4 font-medium text-white">
                                <Link href={`/works/${result.id}`} className="hover:text-indigo-600 hover:underline">
                                  {result.title}
                                </Link>
                              </td>
                              <td className="px-6 py-4">
                                <Badge variant="secondary" className="uppercase text-xs font-semibold tracking-wide">
                                  {result.media_type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-gray-400">{result.author || 'Unknown'}</td>
                              <td className="px-6 py-4 text-gray-400">{result.public_domain_year}</td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-medium text-emerald-700">{monetizationScore}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${monetizationScore}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 w-24">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-medium text-blue-700">{saturationIndex}</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${saturationIndex}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleTrack(result.id)}>
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleShare(result.id)}>
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleSaveToPortfolio(result.id)}>
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/works/${result.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Analyze
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {!results && !loading && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                              Enter a search term to begin market analysis.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results?.results.map((result) => {
                        const monetizationScore = result.monetization_score || 0
                        const saturationIndex = result.saturation_index || 0

                        return (
                          <Card key={result.id} className="hover:shadow-md transition-shadow flex flex-col">
                            <CardContent className="p-6 flex-1 flex flex-col">
                              <div className="flex justify-between items-start mb-4">
                                <Badge variant="outline">{result.media_type}</Badge>
                                <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm">
                                  <DollarSign className="h-3 w-3" />
                                  {monetizationScore}
                                </div>
                              </div>
                              <h3 className="font-bold text-lg mb-1 line-clamp-1" title={result.title}>{result.title}</h3>
                              <p className="text-sm text-gray-400 mb-4">{result.author}</p>

                              <div className="mt-auto space-y-3">
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Monetization</span>
                                    <span>{monetizationScore}/100</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${monetizationScore}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Saturation</span>
                                    <span>{saturationIndex}/100</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-dark-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${saturationIndex}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <Button className="flex-1" variant="outline" onClick={() => handleSaveToPortfolio(result.id)}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Portfolio
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => handleTrack(result.id)}>
                                    <TrendingUp className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="icon" onClick={() => handleShare(result.id)}>
                                    <Activity className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Button className="w-full mt-2" asChild>
                                  <Link href={`/works/${result.id}`}>View Analysis</Link>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div >
          </div >
        </div>

      </div>
    </div >
  )
}
