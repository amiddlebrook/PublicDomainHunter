'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Filter,
  FileText,
  Clock,
  Building2,
  Users,
  Lightbulb,
  TrendingUp,
  Download,
  ExternalLink,
  ChevronRight,
  Calendar,
  Tag,
  Layers,
  Zap,
  X,
  Info
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

// CPC Sections for filtering
const CPC_SECTIONS = [
  { code: 'A', name: 'Human Necessities', description: 'Agriculture, Food, Health, Amusement' },
  { code: 'B', name: 'Operations & Transporting', description: 'Vehicles, Printing, Manufacturing' },
  { code: 'C', name: 'Chemistry & Metallurgy', description: 'Chemical processes, materials' },
  { code: 'D', name: 'Textiles & Paper', description: 'Fabrics, fibers, paper products' },
  { code: 'E', name: 'Fixed Constructions', description: 'Buildings, Mining, Tunnels' },
  { code: 'F', name: 'Mechanical Engineering', description: 'Engines, Pumps, Weapons' },
  { code: 'G', name: 'Physics', description: 'Computing, Instruments, Control' },
  { code: 'H', name: 'Electricity', description: 'Generation, Transmission, Electronics' },
]

interface PatentResult {
  patent_number: string
  title: string
  abstract?: string
  patent_type: string
  status: string
  filing_date?: string
  grant_date?: string
  expiration_date?: string
  inventors: Array<{ name: string; city?: string; country?: string }>
  assignee?: string
  cpc_codes: string[]
  claims_count: number
  cited_by_count: number
  source: string
  source_url?: string
}

interface PatentSearchResponse {
  results: PatentResult[]
  total: number
  query: string
  sources_queried: string[]
  errors: any[]
  api_credits_used: number
}

export default function PatentsPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatentSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('search')
  const [showFilters, setShowFilters] = useState(true)
  const [selectedPatent, setSelectedPatent] = useState<PatentResult | null>(null)
  const [filters, setFilters] = useState({
    expiredOnly: true,
    cpcSection: '',
    yearStart: '',
    yearEnd: '',
  })

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        expired_only: filters.expiredOnly.toString(),
        limit: '50',
      })

      if (filters.cpcSection) params.append('cpc_section', filters.cpcSection)
      if (filters.yearStart) params.append('year_start', filters.yearStart)
      if (filters.yearEnd) params.append('year_end', filters.yearEnd)

      const response = await fetch(`${API_BASE_URL}/api/patents/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Patent search failed', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const loadExpiring = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/patents/expiring?months=12&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setResults({
          results: data.results,
          total: data.total,
          query: 'Expiring in 12 months',
          sources_queried: ['uspto'],
          errors: [],
          api_credits_used: data.api_credits_used,
        })
      }
    } catch (error) {
      console.error('Failed to load expiring patents', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadByClassification = useCallback(async (cpcCode: string) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/patents/by-classification/${cpcCode}?expired_only=true&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setResults({
          results: data.results,
          total: data.total,
          query: `CPC: ${cpcCode}`,
          sources_queried: ['uspto'],
          errors: [],
          api_credits_used: data.api_credits_used,
        })
      }
    } catch (error) {
      console.error('Failed to load patents by classification', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = () => performSearch(query)

  const handleExport = (format: 'json' | 'csv') => {
    if (!results) return

    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `patents-${timestamp}.${format}`

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
      const headers = ['Patent Number', 'Title', 'Type', 'Grant Date', 'Expiration', 'Assignee', 'Claims', 'Citations']
      const rows = results.results.map((p) => [
        p.patent_number,
        `"${p.title.replace(/"/g, '""')}"`,
        p.patent_type,
        p.grant_date || '',
        p.expiration_date || '',
        p.assignee || '',
        p.claims_count,
        p.cited_by_count,
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

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lightbulb className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Patent Discovery</h1>
                <p className="text-sm text-gray-400">Search 20M+ expired US patents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Public Domain
              </Badge>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={!results}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-dark-800 border border-dark-700">
            <TabsTrigger value="search" className="data-[state=active]:bg-dark-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </TabsTrigger>
            <TabsTrigger value="expiring" className="data-[state=active]:bg-dark-700" onClick={loadExpiring}>
              <Clock className="h-4 w-4 mr-2" />
              Expiring Soon
            </TabsTrigger>
            <TabsTrigger value="browse" className="data-[state=active]:bg-dark-700">
              <Layers className="h-4 w-4 mr-2" />
              Browse by Tech
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {activeTab === 'search' && showFilters && (
            <aside className="w-64 shrink-0">
              <Card className="bg-dark-900 border-dark-700 sticky top-24">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-300">Filters</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-6 w-6 p-0">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="expired"
                      checked={filters.expiredOnly}
                      onCheckedChange={(checked) => setFilters(prev => ({ ...prev, expiredOnly: !!checked }))}
                      className="border-gray-600"
                    />
                    <Label htmlFor="expired" className="text-sm text-gray-400">
                      Expired only (public domain)
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-500">Technology Sector</Label>
                    <Select value={filters.cpcSection} onValueChange={(v) => setFilters(prev => ({ ...prev, cpcSection: v }))}>
                      <SelectTrigger className="bg-dark-800 border-dark-600">
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-800 border-dark-600">
                        <SelectItem value="">All sectors</SelectItem>
                        {CPC_SECTIONS.map(section => (
                          <SelectItem key={section.code} value={section.code}>
                            {section.code} - {section.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Year From</Label>
                      <Input
                        type="number"
                        placeholder="1976"
                        value={filters.yearStart}
                        onChange={(e) => setFilters(prev => ({ ...prev, yearStart: e.target.value }))}
                        className="bg-dark-800 border-dark-600 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Year To</Label>
                      <Input
                        type="number"
                        placeholder="2005"
                        value={filters.yearEnd}
                        onChange={(e) => setFilters(prev => ({ ...prev, yearEnd: e.target.value }))}
                        className="bg-dark-800 border-dark-600 text-sm"
                      />
                    </div>
                  </div>

                  <Button className="w-full bg-amber-600 hover:bg-amber-700" size="sm" onClick={handleSearch}>
                    Apply Filters
                  </Button>
                </CardContent>
              </Card>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Search Tab */}
            {activeTab === 'search' && (
              <>
                <div className="flex gap-2 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search patents (e.g., 'coffee brewing', 'solar panel', 'battery')..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 bg-dark-800 border-dark-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <Button onClick={handleSearch} className="bg-amber-600 hover:bg-amber-700">
                    Search Patents
                  </Button>
                  {!showFilters && (
                    <Button variant="outline" onClick={() => setShowFilters(true)}>
                      <Filter className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Quick searches */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs text-gray-500 py-1">Quick searches:</span>
                  {['coffee maker', 'solar cell', 'bicycle', 'LED lighting', 'water filter'].map(term => (
                    <Button
                      key={term}
                      variant="outline"
                      size="sm"
                      className="text-xs bg-dark-800 border-dark-700 hover:bg-dark-700"
                      onClick={() => { setQuery(term); performSearch(term) }}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {/* Browse Tab */}
            {activeTab === 'browse' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                {CPC_SECTIONS.map(section => (
                  <Card
                    key={section.code}
                    className="bg-dark-900 border-dark-700 hover:border-amber-500/50 cursor-pointer transition-all"
                    onClick={() => { loadByClassification(section.code); setActiveTab('search') }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 font-bold">
                          {section.code}
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-sm">{section.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
              </div>
            ) : !results ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Lightbulb className="h-16 w-16 text-gray-700 mb-4" />
                <h3 className="text-lg font-medium text-gray-400">Ready to discover patents?</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md">
                  Search millions of expired US patents now in the public domain.
                  Free to use, manufacture, and commercialize.
                </p>
              </div>
            ) : results.results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-lg font-medium text-gray-400">No patents found</p>
                <p className="text-sm text-gray-500">Try different search terms or adjust filters.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">
                    Found <span className="font-medium text-white">{results.total}</span> patents
                    {results.api_credits_used > 0 && (
                      <span className="text-xs text-gray-600 ml-2">({results.api_credits_used} credit used)</span>
                    )}
                  </p>
                </div>

                <div className="space-y-3">
                  {results.results.map((patent) => (
                    <Card
                      key={patent.patent_number}
                      className={clsx(
                        "bg-dark-900 border-dark-700 hover:border-amber-500/30 transition-all cursor-pointer",
                        selectedPatent?.patent_number === patent.patent_number && "border-amber-500"
                      )}
                      onClick={() => setSelectedPatent(selectedPatent?.patent_number === patent.patent_number ? null : patent)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
                                US{patent.patent_number}
                              </Badge>
                              <Badge variant="outline" className="bg-dark-800 text-gray-400 border-dark-600 text-xs">
                                {patent.patent_type}
                              </Badge>
                              {patent.status === 'public_domain' && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                                  Public Domain
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-medium text-white text-sm line-clamp-2">{patent.title}</h3>
                            {patent.assignee && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                <Building2 className="h-3 w-3" />
                                {patent.assignee}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-gray-500">
                              {patent.grant_date && (
                                <div className="flex items-center gap-1 justify-end">
                                  <Calendar className="h-3 w-3" />
                                  {patent.grant_date}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className="text-gray-400">
                                <FileText className="h-3 w-3 inline mr-1" />
                                {patent.claims_count} claims
                              </span>
                              <span className="text-gray-400">
                                <TrendingUp className="h-3 w-3 inline mr-1" />
                                {patent.cited_by_count} citations
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded view */}
                        {selectedPatent?.patent_number === patent.patent_number && (
                          <div className="mt-4 pt-4 border-t border-dark-700 space-y-3">
                            {patent.abstract && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-400 mb-1">Abstract</h4>
                                <p className="text-sm text-gray-300 line-clamp-4">{patent.abstract}</p>
                              </div>
                            )}

                            {patent.inventors.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-400 mb-1">Inventors</h4>
                                <div className="flex flex-wrap gap-2">
                                  {patent.inventors.map((inv, i) => (
                                    <Badge key={i} variant="outline" className="bg-dark-800 text-gray-300 border-dark-600 text-xs">
                                      <Users className="h-3 w-3 mr-1" />
                                      {inv.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {patent.cpc_codes.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium text-gray-400 mb-1">Classifications</h4>
                                <div className="flex flex-wrap gap-1">
                                  {patent.cpc_codes.slice(0, 5).map((code, i) => (
                                    <Badge key={i} variant="outline" className="bg-dark-800 text-gray-400 border-dark-600 text-xs">
                                      {code}
                                    </Badge>
                                  ))}
                                  {patent.cpc_codes.length > 5 && (
                                    <Badge variant="outline" className="bg-dark-800 text-gray-500 border-dark-600 text-xs">
                                      +{patent.cpc_codes.length - 5} more
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              {patent.source_url && (
                                <Button size="sm" variant="outline" className="text-xs" asChild>
                                  <a href={patent.source_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View on Google Patents
                                  </a>
                                </Button>
                              )}
                              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                Analyze Viability
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Info Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-700 py-3 px-4">
        <div className="container mx-auto flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>Data from USPTO PatentsView API. Patents 20+ years old are in the public domain.</span>
          </div>
          <a href="/api/patents/pricing" className="text-amber-500 hover:text-amber-400">
            View API Pricing
          </a>
        </div>
      </div>
    </div>
  )
}
