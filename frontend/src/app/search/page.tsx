'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { ViabilitySearch } from '@/components/ViabilitySearch'
import Link from 'next/link'

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
  const [filters, setFilters] = useState<any>({})

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
        page_size: '20',
        ...filters
      })

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

  if (!user) return <div className="p-8 text-center text-gray-500">Please log in to access Market Intelligence.</div>

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Market Intelligence</h1>
          <p className="text-sm text-gray-500">Analyze public domain assets and identify opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="standard" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <TabsList>
            <TabsTrigger value="standard">Asset Discovery</TabsTrigger>
            <TabsTrigger value="viability">Viability Engine</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md bg-white shadow-sm">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-gray-200" />
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <TabsContent value="standard" className="flex-1 flex flex-col gap-4 mt-4">
          {/* Search Bar & Filters */}
          <div className="flex gap-2">
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
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Results Area */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-medium">Asset Name</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Author</th>
                      <th className="px-6 py-3 font-medium">Year</th>
                      <th className="px-6 py-3 font-medium text-right">Trend Score</th>
                      <th className="px-6 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {results?.results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          <Link href={`/works/${result.id}`} className="hover:text-indigo-600 hover:underline">
                            {result.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="uppercase text-xs font-semibold tracking-wide">
                            {result.media_type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{result.author || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-600">{result.public_domain_year}</td>
                        <td className="px-6 py-4 text-right">
                          {result.metadata?.trend_score ? (
                            <div className="flex items-center justify-end gap-1 text-emerald-600 font-medium">
                              <TrendingUp className="h-3 w-3" />
                              {result.metadata.trend_score}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/works/${result.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Analyze
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!results && !loading && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          Enter a search term to begin market analysis.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results?.results.map((result) => (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline">{result.media_type}</Badge>
                        {result.metadata?.trend_score && (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                            Score: {result.metadata.trend_score}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-lg mb-1 line-clamp-1">{result.title}</h3>
                      <p className="text-sm text-gray-500 mb-4">{result.author}</p>
                      <Button className="w-full" variant="outline" asChild>
                        <Link href={`/works/${result.id}`}>View Analysis</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="viability" className="mt-4">
          <ViabilitySearch />
        </TabsContent>
      </Tabs>
    </div>
  )
}
