'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Lightbulb, Loader2, Target, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { API_BASE_URL, cn } from '@/lib/utils'

interface ProductIdea {
    title: string
    product_type: string
    description: string
    target_audience: string
    difficulty: 'easy' | 'medium' | 'hard'
    revenue_potential: 'low' | 'medium' | 'high'
    reasoning: string
}

interface MonetizationScores {
    master_monetization_score: number
    market_saturation_index: number
    cross_platform_score: number
    temporal_window_score: number
    film_tv_potential: number
    game_potential: number
    audiobook_potential: number
    merchandise_potential: number
}

interface MonetizationPanelProps {
    workId: number
}

export function MonetizationPanel({ workId }: MonetizationPanelProps) {
    const [scores, setScores] = useState<MonetizationScores | null>(null)
    const [ideas, setIdeas] = useState<ProductIdea[]>([])
    const [loadingScores, setLoadingScores] = useState(true)
    const [generatingIdeas, setGeneratingIdeas] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchScores = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/monetization/score/${workId}`)
                if (response.ok) {
                    const data = await response.json()
                    setScores(data.scores)
                }
            } catch (err) {
                console.error('Failed to fetch monetization scores', err)
            } finally {
                setLoadingScores(false)
            }
        }

        fetchScores()
    }, [workId])

    const generateIdeas = async () => {
        setGeneratingIdeas(true)
        setError(null)
        try {
            const token = localStorage.getItem('token') // Assuming token is stored here, or handle via context if available
            const headers: HeadersInit = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${API_BASE_URL}/api/works/${workId}/product-ideas`, {
                headers
            })

            if (response.ok) {
                const data = await response.json()
                setIdeas(data.ideas)
            } else {
                const errData = await response.json()
                setError(errData.error || 'Failed to generate ideas')
            }
        } catch (err) {
            setError('Failed to connect to AI service')
            console.error(err)
        } finally {
            setGeneratingIdeas(false)
        }
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-500'
        if (score >= 60) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    if (loadingScores) {
        return (
            <Card>
                <CardContent className="pt-6 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        )
    }

    if (!scores) {
        return null // Or some empty state
    }

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 shadow-md">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-green-600" />
                                Monetization Potential
                            </CardTitle>
                            <CardDescription>AI-analyzed commercial viability scores</CardDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                                {scores.master_monetization_score.toFixed(0)}
                            </div>
                            <div className="text-xs text-muted-foreground">Master Score</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Market Saturation</span>
                                <span className="font-medium">{scores.market_saturation_index.toFixed(0)}%</span>
                            </div>
                            <Progress value={scores.market_saturation_index} className="h-2" indicatorClassName={cn(scores.market_saturation_index > 60 ? "bg-red-500" : "bg-green-500")} />
                            <p className="text-xs text-muted-foreground">Lower is better</p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Cross-Platform Potential</span>
                                <span className="font-medium">{scores.cross_platform_score.toFixed(0)}%</span>
                            </div>
                            <Progress value={scores.cross_platform_score} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Timing Window</span>
                                <span className="font-medium">{scores.temporal_window_score.toFixed(0)}%</span>
                            </div>
                            <Progress value={scores.temporal_window_score} className="h-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Film/TV Potential</span>
                                <span className="font-medium">{scores.film_tv_potential.toFixed(0)}%</span>
                            </div>
                            <Progress value={scores.film_tv_potential} className="h-2" />
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="pt-4 border-t">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                Product Ideas
                            </h3>
                            <Button
                                onClick={generateIdeas}
                                disabled={generatingIdeas}
                                variant={ideas.length > 0 ? "outline" : "default"}
                            >
                                {generatingIdeas ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate Ideas with AI'
                                )}
                            </Button>
                        </div>

                        {error && (
                            <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {ideas.length > 0 && (
                            <div className="grid gap-4 md:grid-cols-1">
                                {ideas.map((idea, index) => (
                                    <Card key={index} className="bg-slate-50 border-slate-200">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base text-primary">{idea.title}</CardTitle>
                                                <Badge variant="secondary">{idea.product_type}</Badge>
                                            </div>
                                            <CardDescription>{idea.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-sm space-y-2">
                                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                                                <div className="flex items-center gap-1">
                                                    <Target className="h-3 w-3" /> {idea.target_audience}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <BarChart3 className="h-3 w-3" /> Revenue: {idea.revenue_potential}
                                                </div>
                                            </div>
                                            <div className="bg-white p-2 rounded border text-slate-600 italic">
                                                &quot;{idea.reasoning}&quot;
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
