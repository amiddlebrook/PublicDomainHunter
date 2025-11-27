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
                    </div >
                  </div >
                )}
              </div >
            </div >
          </div >
        </div >

      </div >
    </div >
  )
}
