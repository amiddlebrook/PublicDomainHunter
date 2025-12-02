'use client'

import { useState, useEffect } from 'react'
import {
    Briefcase,
    Plus,
    Star,
    Folder,
    TrendingUp,
    DollarSign,
    LayoutGrid,
    List,
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    Trash2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/utils'

interface PortfolioWork {
    id: number
    work_id: number
    title: string
    author: string
    media_type: string
    notes?: string
    priority?: string
    created_at: string
    monetization_score?: number
}

export default function PortfolioPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [savedWorks, setSavedWorks] = useState<PortfolioWork[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchPortfolio()
    }, [])

    const fetchPortfolio = async () => {
        try {
            const token = localStorage.getItem('token')

            const headers: HeadersInit = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${API_BASE_URL}/api/portfolio/list`, {
                headers,
                credentials: 'include' // Support session cookies for OAuth users
            })

            if (response.ok) {
                const data = await response.json()
                setSavedWorks(data.portfolio || [])
            } else if (response.status === 401) {
                // User not authenticated
                setSavedWorks([])
            }
        } catch (error) {
            console.error('Failed to fetch portfolio:', error)
        } finally {
            setLoading(false)
        }
    }

    const removeFromPortfolio = async (portfolioId: number) => {
        try {
            const token = localStorage.getItem('token')

            const headers: HeadersInit = {}
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const response = await fetch(`${API_BASE_URL}/api/portfolio/${portfolioId}`, {
                method: 'DELETE',
                headers,
                credentials: 'include' // Support session cookies for OAuth users
            })

            if (response.ok) {
                setSavedWorks(savedWorks.filter(w => w.id !== portfolioId))
            }
        } catch (error) {
            console.error('Failed to remove from portfolio:', error)
        }
    }

    const filteredWorks = savedWorks.filter(work =>
        (work.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (work.author?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )

    const highPotentialWorks = filteredWorks.filter(w => (w.monetization_score || 0) >= 70)
    const avgMonetization = filteredWorks.length > 0
        ? Math.round(filteredWorks.reduce((sum, w) => sum + (w.monetization_score || 0), 0) / filteredWorks.length)
        : 0
    const topWork = filteredWorks.reduce((max, w) => (w.monetization_score || 0) > (max.monetization_score || 0) ? w : max, filteredWorks[0])

    const isEmpty = savedWorks.length === 0

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Briefcase className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
                    </div>
                    <p className="text-gray-400">
                        Track and organize public domain works you&apos;re considering for development
                    </p>
                </div>
                <div className="flex gap-3">
                    {!isEmpty && (
                        <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                            {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
                            {viewMode === 'grid' ? 'List View' : 'Grid View'}
                        </Button>
                    )}
                    <Button asChild>
                        <Link href="/search">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Works
                        </Link>
                    </Button>
                </div>
            </div>

            {isEmpty ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="w-full max-w-md space-y-6 text-center">
                        <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                            <Briefcase className="h-12 w-12 text-indigo-600" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-white">Build Your Portfolio</h2>
                            <p className="text-gray-400">
                                Save works you&apos;re interested in developing, organize them into collections, and track monetization opportunities.
                            </p>
                        </div>

                        <Card className="bg-dark-800 border-dark-700">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-white mb-3">Getting Started</h3>
                                <ol className="text-sm text-gray-300 space-y-2 text-left">
                                    <li className="flex gap-2">
                                        <span className="font-bold">1.</span>
                                        <span>Search for works in <strong>Market Intelligence</strong> or use the <strong>Viability Lab</strong></span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">2.</span>
                                        <span>Click &quot;Save to Portfolio&quot; on works that interest you</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">3.</span>
                                        <span>View all your saved works here in one place</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">4.</span>
                                        <span>Track monetization scores and market signals</span>
                                    </li>
                                </ol>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button size="lg" asChild>
                                <Link href="/viability">
                                    <Star className="h-5 w-5 mr-2" />
                                    Find Opportunities
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/search">
                                    <Search className="h-5 w-5 mr-2" />
                                    Browse Catalog
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                /* Portfolio Content */
                <>
                    {/* Stats Overview */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card className="bg-dark-900 border-dark-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">Total Tracked</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{savedWorks.length}</div>
                                <p className="text-xs text-gray-500">Works in portfolio</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-dark-900 border-dark-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">Avg Monetization</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-500">{avgMonetization}</div>
                                <p className="text-xs text-gray-500">Average score</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-dark-900 border-dark-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">High Potential</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-400">{highPotentialWorks.length}</div>
                                <p className="text-xs text-gray-500">Score ≥ 70</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-dark-900 border-dark-700">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-400">Top Work</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-500">{topWork?.monetization_score || '--'}</div>
                                <p className="text-xs text-gray-500 truncate">{topWork?.title || 'None yet'}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search your portfolio..."
                                className="pl-10 bg-dark-900 border-dark-700 text-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Works Grid/List */}
                    <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                        {filteredWorks.map((work) => (
                            <Card key={work.id} className="bg-dark-900 border-dark-700 hover:border-indigo-500/50 transition-all">
                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="border-indigo-500/50 text-indigo-400">
                                            {work.media_type}
                                        </Badge>
                                        {work.monetization_score && (
                                            <Badge className={work.monetization_score >= 70 ? "bg-emerald-500" : "bg-yellow-500"}>
                                                {work.monetization_score}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-white line-clamp-1">
                                        <Link href={`/works/${work.work_id}`} className="hover:text-indigo-400">
                                            {work.title}
                                        </Link>
                                    </CardTitle>
                                    <CardDescription className="text-gray-400">{work.author}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" asChild className="flex-1">
                                            <Link href={`/works/${work.work_id}`}>
                                                <ExternalLink className="h-3 w-3 mr-2" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => removeFromPortfolio(work.id)}
                                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
