'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    TrendingUp,
    DollarSign,
    Film,
    Gamepad2,
    Headphones,
    ShoppingBag,
    GraduationCap,
    Smartphone,
    BookOpen,
    AlertTriangle,
    RefreshCw,
    Filter,
    BarChart3,
    Users,
    Clock,
    BookmarkPlus,
    Check
} from 'lucide-react'
import Link from 'next/link'

interface Opportunity {
    id: number
    title: string
    author?: string
    media_type?: string
    description?: string
    original_publication_year?: number
    public_domain_year?: number
    master_monetization_score: number
    market_saturation_index: number
    cross_platform_score: number
    temporal_window_score: number
    demographic_match_score: number
    derivative_potential: number
    competitive_moat_score: number
    film_tv_potential: number
    game_potential: number
    audiobook_potential: number
    merchandise_potential: number
    gen_z_appeal: number
    millennial_appeal: number
    gen_x_appeal: number
    boomer_appeal: number
}

export default function OpportunitiesPage() {
    const { user } = useAuth()
    const [opportunities, setOpportunities] = useState<Opportunity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [savedWorks, setSavedWorks] = useState<Set<number>>(new Set())

    const handleSaveToPortfolio = async (workId: number) => {
        try {
            const token = localStorage.getItem('token')

            const headers: HeadersInit = {
                'Content-Type': 'application/json'
            }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${API_BASE_URL}/api/portfolio/add`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ work_id: workId }),
                credentials: 'include'
            })

            if (response.ok) {
                setSavedWorks(prev => new Set(prev).add(workId))
            } else {
                console.error('Failed to save to portfolio')
            }
        } catch (error) {
            console.error('Error saving to portfolio:', error)
        }
    }

    // Filters
    const [minScore, setMinScore] = useState(70)
    const [maxSaturation, setMaxSaturation] = useState(60)
    const [platform, setPlatform] = useState<string>('all')
    const [limit, setLimit] = useState(20)

    const fetchOpportunities = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const params = new URLSearchParams({
                min_score: minScore.toString(),
                max_saturation: maxSaturation.toString(),
                limit: limit.toString()
            })

            if (platform !== 'all') {
                params.append('platform', platform)
            }

            const response = await fetch(`${API_BASE_URL}/api/monetization/opportunities?${params}`)

            if (response.ok) {
                const data = await response.json()
                setOpportunities(data.opportunities || [])
            } else {
                setError('Failed to load opportunities')
            }
        } catch (err) {
            setError('Network error occurred')
        } finally {
            setLoading(false)
        }
    }, [minScore, maxSaturation, platform, limit])

    useEffect(() => {
        if (user) {
            fetchOpportunities()
        }
    }, [user, fetchOpportunities])

    const getGradeColor = (score: number): string => {
        if (score >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-300'
        if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-300'
        if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-300'
        return 'bg-red-100 text-red-800 border-red-300'
    }

    const getGrade = (score: number): string => {
        if (score >= 90) return 'A+'
        if (score >= 80) return 'A'
        if (score >= 70) return 'B'
        if (score >= 60) return 'C'
        return 'D'
    }

    const getSaturationLevel = (score: number): { label: string; color: string } => {
        if (score < 30) return { label: 'VERY LOW', color: 'text-emerald-600' }
        if (score < 50) return { label: 'LOW', color: 'text-blue-600' }
        if (score < 70) return { label: 'MODERATE', color: 'text-yellow-600' }
        if (score < 85) return { label: 'HIGH', color: 'text-orange-600' }
        return { label: 'EXTREME', color: 'text-red-600' }
    }

    const getTopPlatform = (opp: Opportunity): { name: string; icon: any; score: number } => {
        const platforms = [
            { name: 'Film/TV', icon: Film, score: opp.film_tv_potential },
            { name: 'Gaming', icon: Gamepad2, score: opp.game_potential },
            { name: 'Audiobook', icon: Headphones, score: opp.audiobook_potential },
            { name: 'Merchandise', icon: ShoppingBag, score: opp.merchandise_potential }
        ]

        return platforms.reduce((max, platform) =>
            platform.score > max.score ? platform : max
        )
    }

    const getTopDemographic = (opp: Opportunity): string => {
        const demographics = [
            { name: 'Gen Z', score: opp.gen_z_appeal },
            { name: 'Millennials', score: opp.millennial_appeal },
            { name: 'Gen X', score: opp.gen_x_appeal },
            { name: 'Boomers', score: opp.boomer_appeal }
        ]

        return demographics.reduce((max, demo) =>
            demo.score > max.score ? demo : max
        ).name
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Please log in to view monetization opportunities</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">💰 Monetization Opportunities</h1>
                <p className="mt-2 text-gray-600">
                    Discover high-value public domain works with strong monetization potential
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchOpportunities}
                            disabled={loading}
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Min Score */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Minimum Score: {minScore}
                            </label>
                            <Select value={minScore.toString()} onValueChange={(v) => setMinScore(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="90">90+ (A+ Only)</SelectItem>
                                    <SelectItem value="80">80+ (A or better)</SelectItem>
                                    <SelectItem value="70">70+ (B or better)</SelectItem>
                                    <SelectItem value="60">60+ (C or better)</SelectItem>
                                    <SelectItem value="50">50+ (All)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Max Saturation */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Max Saturation: {maxSaturation}
                            </label>
                            <Select value={maxSaturation.toString()} onValueChange={(v) => setMaxSaturation(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 (Very Low)</SelectItem>
                                    <SelectItem value="50">50 (Low)</SelectItem>
                                    <SelectItem value="60">60 (Moderate)</SelectItem>
                                    <SelectItem value="70">70 (High)</SelectItem>
                                    <SelectItem value="100">100 (Any)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Platform Filter */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Platform
                            </label>
                            <Select value={platform} onValueChange={setPlatform}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Platforms</SelectItem>
                                    <SelectItem value="film_tv">🎬 Film/TV</SelectItem>
                                    <SelectItem value="game">🎮 Gaming</SelectItem>
                                    <SelectItem value="audiobook">🎧 Audiobook</SelectItem>
                                    <SelectItem value="merchandise">🛍️ Merchandise</SelectItem>
                                    <SelectItem value="educational">🎓 Educational</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Results Limit */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Results to Show
                            </label>
                            <Select value={limit.toString()} onValueChange={(v) => setLimit(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">Top 10</SelectItem>
                                    <SelectItem value="20">Top 20</SelectItem>
                                    <SelectItem value="50">Top 50</SelectItem>
                                    <SelectItem value="100">Top 100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-4 text-gray-600">Finding opportunities...</p>
                </div>
            )}

            {/* Results */}
            {!loading && opportunities.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600">
                            No opportunities found matching your criteria. Try adjusting your filters.
                        </p>
                    </CardContent>
                </Card>
            )}

            {!loading && opportunities.length > 0 && (
                <div>
                    <div className="mb-4 text-sm text-gray-600">
                        Showing {opportunities.length} opportunities
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {opportunities.map((opp) => {
                            const topPlatform = getTopPlatform(opp)
                            const TopPlatformIcon = topPlatform.icon
                            const saturation = getSaturationLevel(opp.market_saturation_index)

                            return (
                                <Card key={opp.id} className="hover:shadow-lg transition-shadow border-2">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl mb-2">
                                                    <Link
                                                        href={`/works/${opp.id}`}
                                                        className="hover:text-blue-600 transition-colors"
                                                    >
                                                        {opp.title}
                                                    </Link>
                                                </CardTitle>
                                                {opp.author && (
                                                    <CardDescription className="text-base">
                                                        by {opp.author}
                                                    </CardDescription>
                                                )}
                                            </div>

                                            {/* Master Score Badge */}
                                            <div className="text-center">
                                                <Badge className={`${getGradeColor(opp.master_monetization_score)} text-2xl font-bold px-4 py-2 border-2`}>
                                                    {getGrade(opp.master_monetization_score)}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {opp.master_monetization_score.toFixed(1)}/100
                                                </p>
                                            </div>
                                        </div>

                                        {/* Year Info */}
                                        {opp.public_domain_year && (
                                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                                <Clock className="h-4 w-4" />
                                                <span>Public Domain since {opp.public_domain_year}</span>
                                            </div>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        {/* Key Metrics */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Market Saturation */}
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-gray-600">Competition</span>
                                                    <AlertTriangle className={`h-3 w-3 ${saturation.color}`} />
                                                </div>
                                                <div className={`text-sm font-bold ${saturation.color}`}>
                                                    {saturation.label}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {opp.market_saturation_index.toFixed(0)}/100
                                                </div>
                                            </div>

                                            {/* Timing Window */}
                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-gray-600">Timing</span>
                                                    <Clock className="h-3 w-3 text-blue-600" />
                                                </div>
                                                <div className="text-sm font-bold text-blue-600">
                                                    {opp.temporal_window_score >= 85 ? 'ACT NOW' :
                                                        opp.temporal_window_score >= 65 ? 'PLAN SOON' :
                                                            'MODERATE'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {opp.temporal_window_score.toFixed(0)}/100
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top Platform */}
                                        <div className="border-t pt-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Best Platform:</span>
                                                <div className="flex items-center gap-2">
                                                    <TopPlatformIcon className="h-4 w-4 text-gray-600" />
                                                    <span className="text-sm font-bold">{topPlatform.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {topPlatform.score.toFixed(0)}/100
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Top Demographic */}
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-600">Target Audience:</span>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-gray-600" />
                                                    <span className="text-sm font-bold">{getTopDemographic(opp)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Platform Potentials */}
                                        <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                                            <div className="text-center">
                                                <Film className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                                                <div className="text-xs font-medium">{opp.film_tv_potential.toFixed(0)}</div>
                                            </div>
                                            <div className="text-center">
                                                <Gamepad2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                                                <div className="text-xs font-medium">{opp.game_potential.toFixed(0)}</div>
                                            </div>
                                            <div className="text-center">
                                                <Headphones className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                                                <div className="text-xs font-medium">{opp.audiobook_potential.toFixed(0)}</div>
                                            </div>
                                            <div className="text-center">
                                                <ShoppingBag className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                                                <div className="text-xs font-medium">{opp.merchandise_potential.toFixed(0)}</div>
                                            </div>
                                        </div>

                                        {/* View Details Button */}
                                        <Link href={`/works/${opp.id}`}>
                                            <Button className="w-full" variant="outline">
                                                <BarChart3 className="h-4 w-4 mr-2" />
                                                View Full Analysis
                                            </Button>
                                        </Link>
                                        <Button
                                            className="w-full"
                                            variant="outline"
                                            onClick={() => handleSaveToPortfolio(opp.id)}
                                            disabled={savedWorks.has(opp.id)}
                                        >
                                            {savedWorks.has(opp.id) ? (
                                                <>
                                                    <Check className="h-4 w-4 mr-2 text-green-500" />
                                                    Saved
                                                </>
                                            ) : (
                                                <>
                                                    <BookmarkPlus className="h-4 w-4 mr-2" />
                                                    Save to Portfolio
                                                </>
                                            )}
                                        </Button>

                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )
            }
        </div>
    )
}
