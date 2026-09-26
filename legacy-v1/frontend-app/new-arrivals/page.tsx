'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Calendar,
    LayoutGrid,
    Table as TableIcon,
    Star,
    Activity,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

interface Work {
    id: number
    title: string
    author: string
    media_type: string
    public_domain_year: number
    created_at: string
    monetization_score?: number
    saturation_index?: number
    quick_score?: number
}

export default function NewArrivalsPage() {
    const { user } = useAuth()
    const [works, setWorks] = useState<Work[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

    useEffect(() => {
        fetchNewArrivals()
    }, [])

    const fetchNewArrivals = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_BASE_URL}/api/works?sort_by=created_at&sort_order=desc&limit=50`)
            if (response.ok) {
                const data = await response.json()
                setWorks(Array.isArray(data) ? data : [])
            }
        } catch (error) {
            console.error('Failed to fetch new arrivals', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveToPortfolio = async (workId: number) => {
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/api/portfolio/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ work_id: workId })
            })
            if (response.ok) {
                alert('Added to portfolio!')
            }
        } catch (error) {
            console.error('Failed to add to portfolio', error)
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col gap-4">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button variant="ghost" size="icon" asChild className="mr-2">
                            <Link href="/">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <Calendar className="h-6 w-6 text-emerald-500" />
                        <h1 className="text-2xl font-bold text-white tracking-tight">New Arrivals</h1>
                    </div>
                    <p className="text-sm text-gray-400 ml-12">Latest additions to the public domain catalog.</p>
                </div>

                <div className="flex items-center border border-dark-700 rounded-md bg-dark-900 shadow-sm">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 ${viewMode === 'table' ? 'bg-dark-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <TableIcon className="h-4 w-4" />
                    </button>
                    <div className="w-px h-4 bg-gray-200" />
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${viewMode === 'grid' ? 'bg-dark-800 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : works.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500">
                        <p className="text-lg font-medium">No new arrivals found.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-400">
                                Showing <span className="font-medium text-white">{works.length}</span> most recent works
                            </p>
                        </div>

                        {viewMode === 'table' ? (
                            <div className="border border-dark-700 rounded-md overflow-hidden bg-dark-900/50">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-dark-800 text-gray-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Title / Author</th>
                                            <th className="px-4 py-3">Type</th>
                                            <th className="px-4 py-3">PD Year</th>
                                            <th className="px-4 py-3 text-right">Added</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-700">
                                        {works.map((work) => (
                                            <tr key={work.id} className="hover:bg-dark-800/50 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white truncate max-w-[300px]" title={work.title}>
                                                        {work.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate max-w-[300px]">
                                                        {work.author}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="secondary" className="text-xs bg-dark-700 text-gray-300 border-0">
                                                        {work.media_type}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-gray-300">
                                                    {work.public_domain_year}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-400">
                                                    {new Date(work.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleSaveToPortfolio(work.id)} title="Save to Portfolio">
                                                            <Star className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" asChild title="View Details">
                                                            <Link href={`/works/${work.id}`}>
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {works.map((work) => (
                                    <Card key={work.id} className="bg-dark-900 border-dark-700 hover:border-indigo-500/50 transition-all group">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="bg-dark-800 text-gray-400 border-dark-600">
                                                    {work.media_type}
                                                </Badge>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500 hover:text-yellow-400" onClick={() => handleSaveToPortfolio(work.id)}>
                                                        <Star className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-white truncate" title={work.title}>{work.title}</h3>
                                                <p className="text-sm text-gray-400 truncate">{work.author}</p>
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                Added: {new Date(work.created_at).toLocaleDateString()}
                                            </div>

                                            <Button className="w-full bg-dark-800 hover:bg-dark-700 text-gray-300" size="sm" asChild>
                                                <Link href={`/works/${work.id}`}>
                                                    View Analysis
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
