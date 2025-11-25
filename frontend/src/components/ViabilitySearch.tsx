'use client'

import { useState, useEffect } from 'react'
import { Search, Sparkles, ArrowRight, Loader2, TrendingUp, BarChart3, AlertCircle, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/lib/utils'
import Link from 'next/link'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface ViabilityResult {
    work: {
        id: number
        title: string
        author: string
        media_type: string
    }
    score: {
        master_monetization_score: number
        market_saturation_index: number
    }
    viability_reasoning: string
    recommended_path: string
}

interface ViabilitySearchProps {
    onSearch?: () => void
    initialQuery?: string
    embedded?: boolean
    showResults?: boolean
}

export function ViabilitySearch({
    onSearch,
    initialQuery = '',
    embedded = false,
    showResults = false
}: ViabilitySearchProps = {}) {
    const [query, setQuery] = useState(initialQuery)
    const [results, setResults] = useState<ViabilityResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    useEffect(() => {
        if (initialQuery && initialQuery !== query) {
            setQuery(initialQuery)
        }
    }, [initialQuery])

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)
        setResults([])

        if (onSearch) onSearch()

        try {
            const token = localStorage.getItem('token')
            const headers: HeadersInit = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            console.log('Searching viability for:', query)
            const response = await fetch(`${API_BASE_URL}/api/market/viability-search?q=${encodeURIComponent(query)}&limit=6`, {
                headers
            })

            console.log('Response status:', response.status)
            const data = await response.json()
            console.log('Response data:', data)

            if (response.ok && data.results) {
                setResults(data.results)
            } else {
                console.error('No results or error:', data)
            }
        } catch (error) {
            console.error('Viability search failed', error)
        } finally {
            setLoading(false)
        }
    }

    // Embedded mode - just the search bar for hero
    if (embedded && !showResults) {
        return (
            <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What's your vibe? (try: horror, sci-fi, philosophy...)"
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-purple-200 pl-12 h-14 text-lg focus-visible:ring-pink-400 focus-visible:ring-2 focus-visible:border-transparent"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="h-14 px-8 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-base shadow-lg shadow-pink-500/50 hover:shadow-xl hover:shadow-pink-500/60 transition-all duration-200 hover:scale-105"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <Zap className="h-5 w-5 mr-2" />
                            DISCOVER
                        </>
                    )}
                </Button>
            </form>
        )
    }

    // Full mode - original dark header + results
    return (
        <div className="space-y-8">
            {!embedded && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-xl border border-slate-700 shadow-lg">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                                <Sparkles className="h-8 w-8 text-indigo-400" />
                                Market Viability Engine
                            </h2>
                            <p className="text-slate-300 text-lg">
                                AI-powered analysis to identify high-potential public domain assets.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Enter a genre, topic, or niche (e.g., 'Victorian Horror')"
                                    className="bg-slate-950/50 border-slate-600 text-white placeholder:text-slate-500 pl-10 h-12 text-lg focus-visible:ring-indigo-500"
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Analyze'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center space-y-6 min-h-[300px]">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">Analyzing Market Data</h3>
                        <p className="text-gray-500 max-w-md">
                            Our AI is scanning thousands of records, calculating saturation indices, and projecting monetization potential...
                        </p>
                    </div>
                </div>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 bg-gray-50 rounded-2xl p-12">
                    <div className="bg-gradient-to-br from-violet-100 to-purple-100 p-6 rounded-full">
                        <AlertCircle className="h-12 w-12 text-violet-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Nothing yet - but your perfect match is out there 🚀</h3>
                    <p className="text-gray-600 max-w-md">Try broadening your search or exploring a different creative direction.</p>
                    <div className="flex gap-3 mt-4">
                        {['horror classics', 'sci-fi adventure', 'vintage art'].map((suggestion) => (
                            <Button key={suggestion} variant="outline" size="sm" onClick={() => {
                                setQuery(suggestion)
                                handleSearch()
                            }}>
                                Try "{suggestion}"
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {results.map((result, idx) => {
                    const chartData = [
                        { name: 'Monetization', value: result.score.master_monetization_score, fill: '#10b981' },
                        { name: 'Saturation', value: result.score.market_saturation_index, fill: '#3b82f6' },
                    ]

                    return (
                        <Card key={idx} className="overflow-hidden border-2 border-transparent hover:border-violet-300 hover:shadow-2xl transition-all duration-300 flex flex-col group">
                            <CardHeader className="pb-2 bg-gradient-to-br from-violet-50 to-purple-50">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2 border-violet-300 text-violet-700">{result.work.media_type}</Badge>
                                    <Badge className={result.score.master_monetization_score > 75 ? "bg-emerald-500 text-white border-emerald-600" : "bg-yellow-500 text-white border-yellow-600"}>
                                        {result.score.master_monetization_score.toFixed(0)}
                                    </Badge>
                                </div>
                                <CardTitle className="line-clamp-1 text-lg group-hover:text-violet-600 transition-colors">
                                    <Link href={`/works/${result.work.id}`}>
                                        {result.work.title}
                                    </Link>
                                </CardTitle>
                                <CardDescription>{result.work.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4 pt-4">
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" domain={[0, 100]} hide />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-4 rounded-lg border border-slate-200 flex-1">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2 text-sm">
                                        <TrendingUp className="h-4 w-4 text-violet-600" />
                                        AI Analysis
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                        {result.viability_reasoning}
                                    </p>
                                    <div className="pt-3 border-t border-slate-200">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Path</span>
                                        <p className="text-violet-700 font-medium text-sm mt-1">{result.recommended_path}</p>
                                    </div>
                                </div>

                                <Button className="w-full mt-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 group/btn" asChild>
                                    <Link href={`/works/${result.work.id}`}>
                                        SEE THE MAGIC
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
