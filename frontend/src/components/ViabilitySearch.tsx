'use client'

import { useState } from 'react'
import { Search, Sparkles, ArrowRight, Loader2, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { API_BASE_URL } from '@/lib/utils'
import Link from 'next/link'

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
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <h2 className="text-2xl font-bold text-indigo-900 flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-indigo-600" />
                        Market Viability Engine
                    </h2>
                    <p className="text-indigo-700">
                        Use AI to distill thousands of results down to the few with real commercial potential.
                    </p>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., 'Victorian mystery novels' or 'Sci-fi short stories'"
                            className="bg-white border-indigo-200 focus-visible:ring-indigo-500"
                        />
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>
            </div>

            {loading && (
                <div className="text-center py-12 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-muted-foreground">
                        Analyzing market data, calculating scores, and distilling opportunities...
                        <br />
                        <span className="text-xs text-gray-400">(This uses advanced AI and may take 10-20 seconds)</span>
                    </p>
                </div>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No highly viable opportunities found for this query. Try a broader search.
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-1">
                {results.map((result, idx) => (
                    <Card key={idx} className="overflow-hidden border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{result.work.media_type}</Badge>
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                            Score: {result.score.master_monetization_score.toFixed(0)}
                                        </Badge>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        <Link href={`/works/${result.work.id}`} className="hover:underline flex items-center gap-2">
                                            {result.work.title}
                                            <ArrowRight className="h-4 w-4 text-gray-400" />
                                        </Link>
                                    </h3>
                                    <p className="text-gray-600">by {result.work.author}</p>

                                    <div className="mt-4 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                                        <h4 className="font-semibold text-indigo-900 flex items-center gap-2 mb-1">
                                            <TrendingUp className="h-4 w-4" />
                                            Viability Analysis
                                        </h4>
                                        <p className="text-indigo-800 text-sm mb-2">{result.viability_reasoning}</p>
                                        <div className="text-sm font-medium text-indigo-900">
                                            Recommended Path: <span className="text-indigo-600">{result.recommended_path}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
