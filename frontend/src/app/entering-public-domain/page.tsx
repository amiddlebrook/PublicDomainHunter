'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Lightbulb,
  BookOpen,
  Music,
  Film,
  Palette,
  FileText,
  TrendingUp,
  Clock,
  Star,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Gift
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

interface PublicDomainEntry {
  id: number
  title: string
  author?: string
  creator?: string
  type: 'patent' | 'book' | 'film' | 'music' | 'art' | 'trademark'
  year_created?: number
  entry_year: number
  entry_date?: string
  reason: string
  notable: boolean
  description?: string
  source_url?: string
  thumbnail_url?: string
  significance?: string
}

// Sample data for 2026 public domain entries
const PUBLIC_DOMAIN_2026: PublicDomainEntry[] = [
  // Patents expiring (filed 2006)
  {
    id: 1,
    title: "Multi-touch gesture recognition system",
    creator: "Apple Inc.",
    type: "patent",
    year_created: 2006,
    entry_year: 2026,
    entry_date: "2026-01-01",
    reason: "20-year patent term expiration",
    notable: true,
    description: "Foundational patent for smartphone touch interfaces",
    significance: "Enables anyone to implement multi-touch gestures",
  },
  {
    id: 2,
    title: "Lithium-ion battery thermal management",
    creator: "Various manufacturers",
    type: "patent",
    year_created: 2006,
    entry_year: 2026,
    reason: "20-year patent term expiration",
    notable: true,
    description: "Battery cooling systems for electric vehicles",
    significance: "Critical for EV and energy storage industries",
  },
  // Books entering PD (published 1930 - US)
  {
    id: 3,
    title: "The Maltese Falcon",
    author: "Dashiell Hammett",
    type: "book",
    year_created: 1930,
    entry_year: 2026,
    entry_date: "2026-01-01",
    reason: "95-year copyright term expiration",
    notable: true,
    description: "Classic detective novel featuring Sam Spade",
    significance: "Free to adapt, republish, create derivatives",
  },
  {
    id: 4,
    title: "As I Lay Dying",
    author: "William Faulkner",
    type: "book",
    year_created: 1930,
    entry_year: 2026,
    entry_date: "2026-01-01",
    reason: "95-year copyright term expiration",
    notable: true,
    description: "Modernist masterpiece about a Mississippi family",
  },
  // Films
  {
    id: 5,
    title: "All Quiet on the Western Front",
    creator: "Universal Pictures",
    type: "film",
    year_created: 1930,
    entry_year: 2026,
    entry_date: "2026-01-01",
    reason: "95-year copyright term expiration",
    notable: true,
    description: "Academy Award-winning anti-war film",
  },
  {
    id: 6,
    title: "The Blue Angel",
    creator: "UFA",
    type: "film",
    year_created: 1930,
    entry_year: 2026,
    reason: "95-year copyright term expiration",
    notable: true,
    description: "Marlene Dietrich's breakthrough film",
  },
  // Music
  {
    id: 7,
    title: "Georgia on My Mind",
    creator: "Hoagy Carmichael",
    type: "music",
    year_created: 1930,
    entry_year: 2026,
    reason: "95-year copyright term expiration",
    notable: true,
    description: "Classic American standard, Georgia's state song",
  },
  {
    id: 8,
    title: "Body and Soul",
    creator: "Johnny Green",
    type: "music",
    year_created: 1930,
    entry_year: 2026,
    reason: "95-year copyright term expiration",
    notable: true,
    description: "Jazz standard covered by countless artists",
  },
]

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030]

const TYPE_ICONS = {
  patent: Lightbulb,
  book: BookOpen,
  film: Film,
  music: Music,
  art: Palette,
  trademark: FileText,
}

const TYPE_COLORS = {
  patent: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  book: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  film: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  music: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  art: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  trademark: "bg-orange-500/10 text-orange-400 border-orange-500/30",
}

export default function EnteringPublicDomainPage() {
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [entries, setEntries] = useState<PublicDomainEntry[]>(PUBLIC_DOMAIN_2026)
  const [loading, setLoading] = useState(false)

  const filteredEntries = entries.filter(entry => {
    if (selectedType !== 'all' && entry.type !== selectedType) return false
    return entry.entry_year === selectedYear
  })

  const notableEntries = filteredEntries.filter(e => e.notable)
  const otherEntries = filteredEntries.filter(e => !e.notable)

  const stats = {
    patents: entries.filter(e => e.type === 'patent' && e.entry_year === selectedYear).length,
    books: entries.filter(e => e.type === 'book' && e.entry_year === selectedYear).length,
    films: entries.filter(e => e.type === 'film' && e.entry_year === selectedYear).length,
    music: entries.filter(e => e.type === 'music' && e.entry_year === selectedYear).length,
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-emerald-900/20 to-dark-950 border-b border-dark-800">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Gift className="h-8 w-8 text-emerald-400" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Updated January 2026
              </Badge>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Entering Public Domain
            </h1>
            <p className="text-lg text-gray-400 mb-6">
              Discover intellectual property becoming free to use. Every January 1st, countless
              patents expire and copyrights lapse, creating new opportunities for creators,
              entrepreneurs, and businesses.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>~400,000 patents/year</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span>Works from 1930 (US)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Film className="h-4 w-4 text-purple-500" />
                <span>Films, music, art</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Year Selector & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32 bg-dark-800 border-dark-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-800 border-dark-700">
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={selectedType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('all')}
              className={selectedType === 'all' ? 'bg-emerald-600' : ''}
            >
              All
            </Button>
            <Button
              variant={selectedType === 'patent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('patent')}
              className={selectedType === 'patent' ? 'bg-amber-600' : ''}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Patents
            </Button>
            <Button
              variant={selectedType === 'book' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('book')}
              className={selectedType === 'book' ? 'bg-blue-600' : ''}
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Books
            </Button>
            <Button
              variant={selectedType === 'film' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('film')}
              className={selectedType === 'film' ? 'bg-purple-600' : ''}
            >
              <Film className="h-4 w-4 mr-1" />
              Films
            </Button>
            <Button
              variant={selectedType === 'music' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType('music')}
              className={selectedType === 'music' ? 'bg-pink-600' : ''}
            >
              <Music className="h-4 w-4 mr-1" />
              Music
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-dark-900 border-dark-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.patents}+</p>
                <p className="text-xs text-gray-500">Patents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-900 border-dark-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.books}+</p>
                <p className="text-xs text-gray-500">Books</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-900 border-dark-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Film className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.films}+</p>
                <p className="text-xs text-gray-500">Films</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-dark-900 border-dark-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Music className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.music}+</p>
                <p className="text-xs text-gray-500">Music</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notable Entries */}
        {notableEntries.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-white">Notable Entries for {selectedYear}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {notableEntries.map(entry => {
                const Icon = TYPE_ICONS[entry.type]
                const colorClass = TYPE_COLORS[entry.type]
                return (
                  <Card key={entry.id} className="bg-dark-900 border-dark-700 hover:border-emerald-500/30 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={clsx("p-3 rounded-lg", colorClass.split(' ')[0])}>
                          <Icon className={clsx("h-6 w-6", colorClass.split(' ')[1])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Badge variant="outline" className={clsx("mb-2 text-xs", colorClass)}>
                                {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                              </Badge>
                              <h3 className="font-semibold text-white">{entry.title}</h3>
                              <p className="text-sm text-gray-400">
                                {entry.author || entry.creator}
                                {entry.year_created && ` (${entry.year_created})`}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shrink-0">
                              Jan 1, {entry.entry_year}
                            </Badge>
                          </div>
                          {entry.description && (
                            <p className="text-sm text-gray-500 mt-2">{entry.description}</p>
                          )}
                          {entry.significance && (
                            <div className="mt-3 p-2 bg-dark-800 rounded-lg">
                              <p className="text-xs text-emerald-400">
                                <Sparkles className="h-3 w-3 inline mr-1" />
                                {entry.significance}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" variant="outline" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Analyze Potential
                            </Button>
                            {entry.type === 'patent' && (
                              <Button size="sm" variant="outline" className="text-xs" asChild>
                                <Link href="/patents">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  View Patent
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* All Entries */}
        {otherEntries.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">All Entries</h2>
            <div className="space-y-2">
              {otherEntries.map(entry => {
                const Icon = TYPE_ICONS[entry.type]
                const colorClass = TYPE_COLORS[entry.type]
                return (
                  <Card key={entry.id} className="bg-dark-900 border-dark-700 hover:bg-dark-800/50 transition-all">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={clsx("p-2 rounded-lg shrink-0", colorClass.split(' ')[0])}>
                        <Icon className={clsx("h-4 w-4", colorClass.split(' ')[1])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate">{entry.title}</h3>
                        <p className="text-xs text-gray-500">{entry.author || entry.creator}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-gray-400">{entry.year_created}</p>
                        <p className="text-xs text-emerald-400">{entry.reason}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {filteredEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Calendar className="h-16 w-16 text-gray-700 mb-4" />
            <h3 className="text-lg font-medium text-gray-400">No entries for {selectedYear}</h3>
            <p className="text-sm text-gray-500 mt-2">
              Try selecting a different year or content type.
            </p>
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8 bg-dark-900 border-dark-700">
          <CardHeader>
            <CardTitle className="text-sm text-gray-300">How Public Domain Works</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-amber-400 mb-2">Patents (20 years)</h4>
              <p className="text-gray-500">
                US utility patents expire 20 years from filing date. Design patents
                last 15 years from grant. After expiration, anyone can use the invention.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-400 mb-2">Copyrights (95 years)</h4>
              <p className="text-gray-500">
                Works published before 1928 are public domain. Works from 1928-1977
                enter public domain 95 years after publication (if renewed).
              </p>
            </div>
            <div>
              <h4 className="font-medium text-orange-400 mb-2">Trademarks (variable)</h4>
              <p className="text-gray-500">
                Trademarks can last forever if maintained, but abandoned marks
                become available. Check USPTO for status before using.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
