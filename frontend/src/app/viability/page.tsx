'use client'

import { useState } from 'react'
import { Sparkles, Target, TrendingUp, Lightbulb, ArrowRight, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ViabilitySearch } from '@/components/ViabilitySearch'

export default function ViabilityLabPage() {
    const [showSearch, setShowSearch] = useState(false)

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 md:p-12 text-white">
                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                            <Sparkles className="h-8 w-8" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold">Viability Lab</h1>
                    </div>
                    <p className="text-xl text-purple-100 mb-6">
                        AI-powered market analysis to identify the most promising public domain works for commercial exploitation.
                    </p>
                    <p className="text-purple-200">
                        Enter a genre, niche, or topic and let our AI find the hidden gems with the highest monetization potential and lowest market saturation.
                    </p>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute left-1/2 bottom-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
            </div>

            {/* What is Viability Analysis */}
            <Alert className="border-indigo-200 bg-indigo-50">
                <Info className="h-5 w-5 text-indigo-600" />
                <AlertDescription className="text-indigo-900 ml-2">
                    <strong>What is Viability Analysis?</strong> Our AI evaluates public domain works across multiple dimensions including market saturation, cross-platform potential, timing windows, and revenue opportunities. Each work receives a comprehensive viability score to help you make informed decisions about which assets to develop.
                </AlertDescription>
            </Alert>

            {/* How it Works */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-t-4 border-t-purple-500">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold text-purple-600">1</span>
                        </div>
                        <CardTitle className="text-lg">Enter Your Niche</CardTitle>
                        <CardDescription>
                            Describe a genre, topic, theme, or market niche you want to explore
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600">
                        Examples: "Victorian Horror", "Medieval Poetry", "Ancient Philosophy", "Classic Detective Fiction"
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-indigo-500">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold text-indigo-600">2</span>
                        </div>
                        <CardTitle className="text-lg">AI Analysis</CardTitle>
                        <CardDescription>
                            Our engine scans thousands of works and calculates viability scores
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600">
                        We analyze: monetization potential, market saturation, cross-platform opportunities, and timing windows
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                            <span className="text-2xl font-bold text-blue-600">3</span>
                        </div>
                        <CardTitle className="text-lg">Get Ranked Results</CardTitle>
                        <CardDescription>
                            See top opportunities with detailed reasoning and recommended strategies
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600">
                        Each result includes AI reasoning, monetization paths, and competitive analysis
                    </CardContent>
                </Card>
            </div>

            {/* Metrics Explained */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-900">
                            <Target className="h-5 w-5 text-emerald-600" />
                            Monetization Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-emerald-800">
                        <p className="mb-2">Measures commercial potential across multiple revenue streams:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Film/TV adaptation potential</li>
                            <li>Game development viability</li>
                            <li>Audiobook market fit</li>
                            <li>Merchandise opportunities</li>
                            <li>Cross-platform adaptability</li>
                        </ul>
                        <p className="mt-2 font-medium">Higher score = More monetization opportunities</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-900">
                            <TrendingUp className="h-5 w-5 text-blue-600" />
                            Market Saturation Index
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800">
                        <p className="mb-2">Measures how competitive the market is for this work:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Existing adaptations and derivatives</li>
                            <li>Current market competition</li>
                            <li>Audience familiarity</li>
                            <li>Genre saturation levels</li>
                        </ul>
                        <p className="mt-2 font-medium">Lower score = Less competition, more opportunity</p>
                    </CardContent>
                </Card>
            </div>

            {/* Use Cases */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        Perfect For
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p className="font-medium text-gray-900">Content Creators</p>
                            <p className="text-gray-600">Finding untapped works to adapt into videos, podcasts, or digital content</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium text-gray-900">Publishers</p>
                            <p className="text-gray-600">Discovering overlooked classics with modern market appeal</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium text-gray-900">Game Developers</p>
                            <p className="text-gray-600">Identifying narratives and characters perfect for game adaptation</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-medium text-gray-900">Entrepreneurs</p>
                            <p className="text-gray-600">Spotting IP opportunities for merchandise, courses, or products</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Viability Search Component */}
            <Card className="border-2 border-indigo-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-600" />
                            Start Your Analysis
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Enter a niche, genre, or topic to discover high-potential public domain works
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <ViabilitySearch />
                </CardContent>
            </Card>
        </div>
    )
}
