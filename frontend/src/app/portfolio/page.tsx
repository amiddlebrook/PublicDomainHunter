'use client'

import { useState } from 'react'
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
    MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function PortfolioPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [savedWorks, setSavedWorks] = useState<any[]>([])

    // Empty state
    const isEmpty = savedWorks.length === 0

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
                    <p className="text-gray-300">
                        Track and organize public domain works you&apos;re considering for development
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
                        {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <LayoutGrid className="h-4 w-4 mr-2" />}
                        {viewMode === 'grid' ? 'List View' : 'Grid View'}
                    </Button>
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
                            <p className="text-gray-300">
                                Save works you&apos;re interested in developing, organize them into collections, and track monetization opportunities.
                            </p>
                        </div>

                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold text-indigo-900 mb-3">Getting Started</h3>
                                <ol className="text-sm text-indigo-800 space-y-2 text-left">
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
                                        <span>Organize saved works into collections and track progress</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-bold">4.</span>
                                        <span>Add notes, set priorities, and monitor monetization scores</span>
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
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Total Tracked</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{savedWorks.length}</div>
                                <p className="text-xs text-gray-300">Works in portfolio</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Avg Monetization</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">--</div>
                                <p className="text-xs text-gray-300">Average score</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Collections</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-xs text-gray-300">Organized folders</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-300">Top Opportunity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-indigo-600">--</div>
                                <p className="text-xs text-gray-300">Highest potential</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-200" />
                            <Input placeholder="Search your portfolio..." className="pl-10" />
                        </div>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>

                    {/* Tabs */}
                    <Tabs defaultValue="all" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="all">All Works</TabsTrigger>
                            <TabsTrigger value="high-potential">High Potential</TabsTrigger>
                            <TabsTrigger value="collections">Collections</TabsTrigger>
                            <TabsTrigger value="notes">With Notes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            <div className={viewMode === 'grid' ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                                {savedWorks.map((work) => (
                                    <Card key={work.id} className="hover:shadow-lg transition-shadow">
                                        <CardContent className="pt-6">
                                            {/* Work card content would go here */}
                                            <p className="text-gray-300">Work: {work.title}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    )
}
