'use client'

import { useState } from 'react'
import { Search, Sparkles, ArrowRight, Loader2, TrendingUp, BarChart3, AlertCircle } from 'lucide-react'
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

export function ViabilitySearch() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ViabilityResult[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)
        setResults([])

        try {
            const token = localStorage.getItem('token')
            const headers: HeadersInit = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${API_BASE_URL}/api/market/viability-search?q=${encodeURIComponent(query)}&limit=5`, {
                headers
            })

            if (response.ok) {
                const data = await response.json()
                setResults(data.results)
            }
        } catch (error) {
            console.error('Viability search failed', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-xl border border-slate-700 shadow-lg shrink-0">
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

            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 min-h-[300px]">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-indigo-400 animate-pulse" />
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
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                    <div className="bg-gray-100 p-4 rounded-full">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No viable opportunities found</h3>
                    <p className="text-gray-500">Try adjusting your search terms or exploring a different niche.</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pb-8">
                {results.map((result, idx) => {
                    const chartData = [
                        { name: 'Monetization', value: result.score.master_monetization_score, fill: '#10b981' }, // emerald-500
                        { name: 'Saturation', value: result.score.market_saturation_index, fill: '#3b82f6' }, // blue-500
                    ]

                    return (
                        <Card key={idx} className="overflow-hidden border-t-4 border-t-indigo-500 hover:shadow-lg transition-all duration-300 flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className="mb-2">{result.work.media_type}</Badge>
                                    <Badge className={result.score.master_monetization_score > 75 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}>
                                        Score: {result.score.master_monetization_score.toFixed(0)}
                                    </Badge>
                                </div>
                                <CardTitle className="line-clamp-1 text-lg">
                                    <Link href={`/works/${result.work.id}`} className="hover:text-indigo-600 transition-colors">
                                        {result.work.title}
                                    </Link>
                                </CardTitle>
                                <CardDescription>{result.work.author}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                <div className="h-48 w-full mt-2">
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

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex-1">
                                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-2 text-sm">
                                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                                        AI Analysis
                                    </h4>
                                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                        {result.viability_reasoning}
                                    </p>
                                    <div className="pt-3 border-t border-slate-200">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recommended Path</span>
                                        <p className="text-indigo-700 font-medium text-sm mt-1">{result.recommended_path}</p>
                                    </div>
                                </div>

                                <Button className="w-full mt-auto group" asChild>
                                    <Link href={`/works/${result.work.id}`}>
                                        View Full Report
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
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
