'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Sparkles, TrendingUp, Users, DollarSign, AlertCircle, Loader2 } from 'lucide-react'
import { API_BASE_URL } from '@/lib/utils'

interface AIInsightsPanelProps {
    workId: string | number
}

interface MonetizationReport {
    score: number
    products: Array<{
        type: string
        potential: number
        rationale: string
    }>
    demographics: string[]
    demand: 'low' | 'medium' | 'high'
    keySellingPoints: string[]
}

interface SaturationReport {
    index: number
    competitors: number
    trendDirection: 'rising' | 'stable' | 'declining'
    recommendation: string
}

export function AIInsightsPanel({ workId }: AIInsightsPanelProps) {
    const [loading, setLoading] = useState(false)
    const [analysis, setAnalysis] = useState<{
        monetization: MonetizationReport
        saturation: SaturationReport
    } | null>(null)
    const [error, setError] = useState<string | null>(null)

    const runAnalysis = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE_URL}/api/works/${workId}/analyze`)

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            const data = await response.json()
            setAnalysis(data)
        } catch (err) {
            setError('Failed to generate AI insights. Please try again.')
            console.error('AI analysis error:', err)
        } finally {
            setLoading(false)
        }
    }

    const getDemandColor = (demand: string) => {
        switch (demand) {
            case 'high': return 'text-emerald-500'
            case 'medium': return 'text-yellow-500'
            case 'low': return 'text-gray-500'
            default: return 'text-gray-500'
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-emerald-500'
        if (score >= 50) return 'text-yellow-500'
        return 'text-gray-500'
    }

    return (
        <Card className="bg-gradient-to-br from-indigo-950/30 to-pink-950/30 border-indigo-900/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400" />
                        <CardTitle>AI Market Insights</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-indigo-400 border-indigo-400">
                        Powered by DeepSeek R1 + Claude
                    </Badge>
                </div>
                <CardDescription>
                    AI-powered monetization analysis and market research
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {!analysis && !loading && (
                    <div className="text-center py-8">
                        <Sparkles className="h-12 w-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
                        <p className="text-gray-400 mb-4">
                            Generate deep AI analysis for this work including monetization potential, market saturation, and product recommendations.
                        </p>
                        <Button
                            onClick={runAnalysis}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate AI Insights
                        </Button>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <Loader2 className="h-12 w-12 text-indigo-400 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-400">Running AI analysis...</p>
                        <p className="text-sm text-gray-500 mt-2">This may take 5-10 seconds</p>
                    </div>
                )}

                {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {analysis && (
                    <div className="space-y-6">
                        {/* Monetization Score */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-dark-900/50 rounded-lg border border-emerald-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    <p className="text-sm text-gray-400">Monetization Score</p>
                                </div>
                                <p className={`text-3xl font-bold ${getScoreColor(analysis.monetization.score)}`}>
                                    {analysis.monetization.score}/100
                                </p>
                            </div>

                            <div className="p-4 bg-dark-900/50 rounded-lg border border-pink-900/30">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="h-4 w-4 text-pink-500" />
                                    <p className="text-sm text-gray-400">Market Saturation</p>
                                </div>
                                <p className={`text-3xl font-bold ${getScoreColor(100 - analysis.saturation.index)}`}>
                                    {analysis.saturation.index}/100
                                </p>
                            </div>
                        </div>

                        {/* Market Demand */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <p className="text-sm font-medium text-white">Market Demand</p>
                            </div>
                            <Badge className={`${getDemandColor(analysis.monetization.demand)} uppercase`}>
                                {analysis.monetization.demand}
                            </Badge>
                        </div>

                        {/* Top Products */}
                        <div>
                            <p className="text-sm font-medium text-white mb-3">Recommended Products</p>
                            <div className="space-y-3">
                                {analysis.monetization.products.slice(0, 3).map((product, idx) => (
                                    <div key={idx} className="p-3 bg-dark-900/50 rounded-lg">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-white">{product.type}</p>
                                            <span className={`text-sm ${getScoreColor(product.potential)}`}>
                                                {product.potential}%
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-400">{product.rationale}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Target Demographics */}
                        <div>
                            <p className="text-sm font-medium text-white mb-2">Target Demographics</p>
                            <div className="flex flex-wrap gap-2">
                                {analysis.monetization.demographics.map((demo, idx) => (
                                    <Badge key={idx} variant="outline" className="text-gray-300">
                                        {demo}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Market Recommendation */}
                        <div className="p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-lg">
                            <p className="text-sm font-medium text-indigo-400 mb-2">AI Recommendation</p>
                            <p className="text-sm text-gray-300">{analysis.saturation.recommendation}</p>
                        </div>

                        <Button
                            variant="outline"
                            onClick={runAnalysis}
                            className="w-full"
                            disabled={loading}
                        >
                            Refresh Analysis
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
