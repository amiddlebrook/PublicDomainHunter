'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Image as ImageIcon,
    BookOpen,
    Music,
    Box,
    Play,
    Sparkles,
    TrendingUp,
    Users,
    ArrowRight
} from 'lucide-react'

const factories = [
    {
        id: 'posters',
        title: 'Brand Asset Studio',
        description: 'Generate investor-ready visuals, pitch graphics, and promo assets for public domain IP',
        icon: ImageIcon,
        color: 'purple',
        status: 'available',
        href: '/factory/posters'
    },
    {
        id: 'ebooks',
        title: 'Publication Studio',
        description: 'Package public domain works into professional eBooks with metadata, styling, and distribution-ready files',
        icon: BookOpen,
        color: 'blue',
        status: 'available',
        href: '/factory/ebooks'
    },
    {
        id: 'audiobooks',
        title: 'Audio Production Studio',
        description: 'Transform public domain texts into studio-ready audiobooks with narration and mastering',
        icon: Music,
        color: 'green',
        status: 'coming-soon',
        href: '/factory/audiobooks'
    },
    {
        id: '3d-models',
        title: 'Prototyping Studio',
        description: 'Create detailed 3D models and visualizations for manufacturing, AR, and product validation',
        icon: Box,
        color: 'orange',
        status: 'coming-soon',
        href: '/factory/3d-models'
    },
    {
        id: 'courses',
        title: 'Curriculum Studio',
        description: 'Build professional learning products from public domain educational content',
        icon: Play,
        color: 'pink',
        status: 'coming-soon',
        href: '/factory/courses'
    }
]

const stats = [
    { label: 'Active Factories', value: '2', icon: Sparkles, color: 'text-purple-400' },
    { label: 'Products Created', value: '847', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Active Users', value: '124', icon: Users, color: 'text-blue-400' }
]

export default function FactoryPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <h1 className="text-3xl font-bold text-white">Commercialization Studio</h1>
                    </div>
                    <p className="text-gray-400 ml-8">
                        Transform public domain IP into commercialization-ready assets with AI-powered tools
                    </p>
                </div>
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    2 Factories Live
                </Badge>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="bg-dark-900 border-dark-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-dark-800`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                                    <p className="text-sm text-gray-400">{stat.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Factory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {factories.map((factory) => {
                    const Icon = factory.icon
                    const isAvailable = factory.status === 'available'
                    
                    return (
                        <Card
                            key={factory.id}
                            className={`bg-dark-900 border-dark-700 transition-all duration-200 ${
                                isAvailable ? 'hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10' : 'opacity-75'
                            }`}
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className={`p-3 rounded-lg bg-${factory.color}-100`}>
                                        <Icon className={`h-6 w-6 text-${factory.color}-600`} />
                                    </div>
                                    <Badge
                                        variant={isAvailable ? 'default' : 'outline'}
                                        className={isAvailable ? `bg-${factory.color}-600` : 'border-gray-600 text-gray-400'}
                                    >
                                        {isAvailable ? 'Available' : 'Coming Soon'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-white">{factory.title}</CardTitle>
                                <CardDescription className="text-gray-400">
                                    {factory.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    asChild
                                    className={`w-full ${
                                        isAvailable
                                            ? `bg-gradient-to-r from-${factory.color}-600 to-${factory.color}-700 hover:from-${factory.color}-700 hover:to-${factory.color}-800`
                                            : 'bg-dark-800 text-gray-400 cursor-not-allowed'
                                    }`}
                                    disabled={!isAvailable}
                                >
                                    <Link href={isAvailable ? factory.href : '#'}>
                                        {isAvailable ? (
                                            <>
                                                Enter Factory
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        ) : (
                                            'Coming Soon'
                                        )}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Info Section */}
            <Card className="bg-dark-900 border-dark-700">
                <CardHeader>
                    <CardTitle className="text-white">How The Studio Works</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">1</span>
                                Select IP
                            </div>
                            <p className="text-gray-400 text-sm pl-8">
                                Choose public domain IP assets with clear commercialization paths
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">2</span>
                                Configure Deliverables
                            </div>
                            <p className="text-gray-400 text-sm pl-8">
                                Customize assets, outputs, and formats for your target market
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">3</span>
                                AI Production
                            </div>
                            <p className="text-gray-400 text-sm pl-8">
                                Our AI assembles professional-grade assets instantly
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">4</span>
                                Deploy & Launch
                            </div>
                            <p className="text-gray-400 text-sm pl-8">
                                Download deliverables and move directly to market
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
