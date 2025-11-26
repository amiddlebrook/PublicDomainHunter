'use client'

import { useState } from 'react'
import { Sparkles, Rocket, Zap, Film, Gamepad2, BookOpen, Palette, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ViabilitySearch } from '@/components/ViabilitySearch'

const quickSearches = [
    { icon: Film, label: 'Film & TV', query: 'cinematic horror' },
    { icon: Gamepad2, label: 'Gaming', query: 'adventure fantasy' },
    { icon: BookOpen, label: 'Publishing', query: 'classic literature' },
    { icon: Palette, label: 'Art & Design', query: 'vintage illustrations' },
]

export default function ViabilityLabPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [hasSearched, setHasSearched] = useState(false)

    const handleQuickSearch = (query: string) => {
        setSearchQuery(query)
        setHasSearched(true)
    }

    return (
        <div className="min-h-screen -m-6 md:-m-8">
            {/* Hero Section - Full Width Gradient */}
            <div className={`relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 transition-all duration-700 ${hasSearched ? 'pb-16' : 'min-h-[85vh] flex items-center'}`}>
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-violet-500/30 rounded-full blur-3xl animate-pulse delay-700"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20">
                    {/* Hero Content */}
                    <div className="text-center space-y-8">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                            <span className="text-white/90 text-sm font-medium">AI-POWERED OPPORTUNITY DISCOVERY</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
                            Find Your Next
                            <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 animate-gradient">
                                Big Thing
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-purple-100 max-w-2xl mx-auto font-medium">
                            AI picks the winners. You focus on building your creative empire.
                        </p>

                        {/* Search Bar - Always Visible */}
                        <div className="max-w-2xl mx-auto">
                            <ViabilitySearch
                                onSearch={(query) => {
                                    setSearchQuery(query)
                                    setHasSearched(true)
                                }}
                                initialQuery={searchQuery}
                                embedded={true}
                                performSearch={false}
                            />
                        </div>

                        {/* Quick Action Pills */}
                        {!hasSearched && (
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                                <span className="text-sm text-purple-200 font-medium">QUICK START:</span>
                                {quickSearches.map((item) => (
                                    <Button
                                        key={item.label}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickSearch(item.query)}
                                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:scale-105 transition-all duration-200 group"
                                    >
                                        <item.icon className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                                        {item.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Stats Bar */}
                    {!hasSearched && (
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {[
                                { value: '10K+', label: 'Works Analyzed' },
                                { value: '95%', label: 'Accuracy Rate' },
                                { value: '<1min', label: 'Analysis Time' },
                                { value: '24/7', label: 'Always On' },
                            ].map((stat, idx) => (
                                <div key={idx} className="text-center space-y-1 backdrop-blur-sm bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="text-3xl font-black text-white">{stat.value}</div>
                                    <div className="text-sm text-purple-200">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
                        <path d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
                            fill="currentColor"
                            className="text-gray-50" />
                    </svg>
                </div>
            </div>

            {/* Results Section - Only shows after search */}
            {hasSearched && (
                <div className="bg-gray-50 px-6 py-12">
                    <div className="max-w-6xl mx-auto">
                        <ViabilitySearch
                            key={searchQuery} // Force remount on new search
                            initialQuery={searchQuery}
                            showResults={true}
                            embedded={true} // Hide the search bar in results view
                        />
                    </div>
                </div>
            )}

            {/* Info Section - Only shows before search */}
            {!hasSearched && (
                <div className="bg-gray-50 px-6 py-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                                How It Works
                            </h2>
                            <p className="text-lg text-gray-600">
                                Three steps to discovering your next opportunity
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Rocket,
                                    title: 'Enter Your Vibe',
                                    description: 'Tell us what excites you - a genre, theme, or creative direction',
                                    color: 'from-violet-500 to-purple-500',
                                },
                                {
                                    icon: Zap,
                                    title: 'AI Magic',
                                    description: 'Our engine scans thousands of works, crunching monetization metrics and market data',
                                    color: 'from-purple-500 to-pink-500',
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Win Big',
                                    description: 'Get ranked opportunities with AI insights and recommended paths to success',
                                    color: 'from-pink-500 to-rose-500',
                                },
                            ].map((step, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                                        style={{ backgroundImage: `linear-gradient(to bottom right, ${step.color.split(' ')[1]}, ${step.color.split(' ')[3]})` }}></div>
                                    <div className="bg-white p-8 rounded-2xl border-2 border-gray-100 group-hover:border-transparent group-hover:shadow-2xl transition-all duration-300 h-full">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                            <step.icon className="h-8 w-8 text-white" />
                                        </div>
                                        <div className="absolute top-4 right-4 text-6xl font-black text-gray-100 group-hover:text-gray-200 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="mt-16 text-center">
                            <div className="inline-block bg-gradient-to-r from-violet-600 to-pink-600 p-1 rounded-2xl">
                                <div className="bg-gray-50 px-8 py-6 rounded-xl">
                                    <p className="text-2xl font-black text-gray-900 mb-4">
                                        Ready to change the world? 🚀
                                    </p>
                                    <Button
                                        size="lg"
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold px-8 py-6 text-lg group"
                                    >
                                        START DISCOVERING
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
