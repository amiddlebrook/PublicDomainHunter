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
  Info,
  Star
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
    minYear: new Date().getFullYear(),
    maxYear: 2095,
    mediaTypes: [] as string[],
    minScore: 0,
    maxSaturation: 100
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
      if (filters.maxSaturation < 100) params.append('max_saturation', filters.maxSaturation.toString())

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
                {/* Media Type Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-300">Media Type</Label>
                  <div className="space-y-2">
                    {['Book', 'Image', 'Audio', 'Video'].map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={type}
                          checked={filters.mediaTypes.includes(type.toLowerCase())}
                          onCheckedChange={() => toggleMediaType(type.toLowerCase())}
                          className="border-gray-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <label
                          htmlFor={type}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-400"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-dark-700" />

                {/* Public Domain Year Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">PD Year Range</Label>
                    <span className="text-xs text-gray-500">
                      {filters.minYear} - {filters.maxYear}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[new Date().getFullYear(), 2095]}
                    min={1800}
                    max={2095}
                    step={1}
                    value={[filters.minYear, filters.maxYear]}
                    onValueChange={(value) => {
                      setFilters((prev: any) => ({ ...prev, minYear: value[0], maxYear: value[1] }))
                    }}
                    className="py-4"
                  />
                  <p className="text-xs text-gray-500">
                    Target works entering public domain in specific future years.
                  </p>
                </div>

                <div className="h-px bg-dark-700" />

                {/* Monetization Score Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Min. Monetization Score</Label>
                    <span className="text-xs text-indigo-400 font-bold">{filters.minScore}</span>
                  </div>
                  <Slider
                    defaultValue={[0]}
                    min={0}
                    max={100}
                    step={5}
                    value={[filters.minScore]}
                    onValueChange={(value) => handleFilterChange('minScore', value[0])}
                    className="py-4"
                  />
                </div>

                {/* Saturation Index Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-300">Max. Saturation Index</Label>
                    <span className="text-xs text-pink-400 font-bold">{filters.maxSaturation || 100}</span>
                  </div>
                  <Slider
                    defaultValue={[100]}
                    min={0}
                    max={100}
                    step={5}
                    value={[filters.maxSaturation || 100]}
                    onValueChange={(value) => handleFilterChange('maxSaturation', value[0])}
                    className="py-4"
                  />
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4"
                  onClick={handleSearch}
                >
                  Apply Filters
                </Button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="flex gap-2 mb-6 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search for works (e.g., 'Frankenstein', 'Space', 'Botanical')..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 bg-dark-800 border-dark-700 text-white placeholder:text-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <Button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
                  Search
                </Button>
              </div>

              {/* Results Area */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  </div>
                ) : !results ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                    <Search className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Ready to explore?</p>
                    <p className="text-sm">Enter a search term or apply filters to find opportunities.</p>
                  </div>
                ) : results.results.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                    <p className="text-lg font-medium">No results found.</p>
                    <p className="text-sm">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-400">
                        Found <span className="font-medium text-white">{results.total_results}</span> results
                        {results.search_time && <span className="text-xs ml-2 opacity-50">({results.search_time})</span>}
                      </p>
                    </div>

                    {viewMode === 'table' ? (
                      <div className="border border-dark-700 rounded-md overflow-hidden bg-dark-900/50">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-dark-800 text-gray-400 font-medium">
                            <tr>
                              <th className="px-4 py-3">Title / Author</th>
                              <th className="px-4 py-3">Type</th>
                              <th className="px-4 py-3">PD Year</th>
                              <th className="px-4 py-3 text-right">Quick Score</th>
                              <th className="px-4 py-3 text-right">Monetization</th>
                              <th className="px-4 py-3 text-right">Saturation</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-dark-700">
                            {results.results.map((work) => (
                              <tr key={work.id} className="hover:bg-dark-800/50 transition-colors group">
                                <td className="px-4 py-3">
                                  <div className="font-medium text-white truncate max-w-[200px]" title={work.title}>
                                    {work.title}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {work.author}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="secondary" className="text-xs bg-dark-700 text-gray-300 border-0">
                                    {work.media_type}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-gray-300">
                                  {work.public_domain_year}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={clsx(
                                      "font-bold",
                                      (work as any).quick_score >= 80 ? "text-emerald-400" :
                                        (work as any).quick_score >= 50 ? "text-yellow-400" : "text-gray-500"
                                    )}>
                                      {(work as any).quick_score || '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={clsx(
                                      "font-bold",
                                      (work.monetization_score || 0) >= 80 ? "text-emerald-400" :
                                        (work.monetization_score || 0) >= 50 ? "text-yellow-400" : "text-gray-500"
                                    )}>
                                      {work.monetization_score || '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className={clsx(
                                      "font-bold",
                                      (work.saturation_index || 0) <= 30 ? "text-emerald-400" :
                                        (work.saturation_index || 0) <= 70 ? "text-yellow-400" : "text-pink-400"
                                    )}>
                                      {work.saturation_index || '-'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleSaveToPortfolio(work.id)} title="Save to Portfolio">
                                      <Star className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleTrack(work.id)} title="Track">
                                      <Activity className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" asChild title="View Details">
                                      <Link href={`/works/${work.id}`}>
                                        <ChevronRight className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {results.results.map((work) => (
                          <Card key={work.id} className="bg-dark-900 border-dark-700 hover:border-indigo-500/50 transition-all group">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <Badge variant="outline" className="bg-dark-800 text-gray-400 border-dark-600">
                                  {work.media_type}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-yellow-400" onClick={() => handleSaveToPortfolio(work.id)}>
                                    <Star className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-semibold text-white truncate" title={work.title}>{work.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{work.author}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-dark-800 rounded p-2 text-center">
                                  <div className="text-gray-500 mb-1">PD Year</div>
                                  <div className="font-medium text-white">{work.public_domain_year}</div>
                                </div>
                                <div className="bg-dark-800 rounded p-2 text-center">
                                  <div className="text-gray-500 mb-1">Quick Score</div>
                                  <div className={clsx("font-bold", (work as any).quick_score >= 70 ? "text-emerald-400" : "text-yellow-400")}>
                                    {(work as any).quick_score}
                                  </div>
                                </div>
                              </div>

                              <Button className="w-full bg-dark-800 hover:bg-dark-700 text-gray-300" size="sm" asChild>
                                <Link href={`/works/${work.id}`}>
                                  View Analysis
                                </Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
