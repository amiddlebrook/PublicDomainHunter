'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Image as ImageIcon,
    Download,
    Sparkles,
    Palette,
    Type,
    Layers,
    RefreshCw,
    ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function PosterFactoryPage() {
    const [generating, setGenerating] = useState(false)
    const [generatedPoster, setGeneratedPoster] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        tagline: '',
        style: 'vintage',
        colorScheme: 'vibrant',
        size: 'poster'
    })

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            // Get token safely (client-side only)
            const getToken = () => {
                if (typeof window !== 'undefined') {
                    return localStorage.getItem('token')
                }
                return null
            }

            const response = await fetch('/api/factory/poster/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    author: formData.author,
                    tagline: formData.tagline,
                    style: formData.style,
                    color_scheme: formData.colorScheme,
                    size: formData.size
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate poster')
            }

            const result = await response.json()
            
            // Poll for completion status
            const pollStatus = async () => {
                const statusResponse = await fetch(`/api/factory/poster/status/${result.generation_id}`, {
                    headers: {
                        'Authorization': `Bearer ${getToken()}`
                    }
                })
                
                const status = await statusResponse.json()
                
                if (status.status === 'completed') {
                    setGeneratedPoster(status.preview_url)
                    setGenerating(false)
                } else if (status.status === 'processing') {
                    // Continue polling
                    setTimeout(pollStatus, 2000)
                } else {
                    throw new Error('Generation failed')
                }
            }
            
            // Start polling
            setTimeout(pollStatus, 2000)
            
        } catch (error) {
            console.error('Error generating poster:', error)
            setGenerating(false)
            // Fallback to placeholder for demo
            setGeneratedPoster(`https://via.placeholder.com/600x900/1e293b/ffffff?text=${encodeURIComponent(formData.title || 'Poster')}`)
        }
    }

    const handleDownload = () => {
        if (!generatedPoster) return
        const link = document.createElement('a')
        link.href = generatedPoster
        link.download = `${formData.title.replace(/\s+/g, '-').toLowerCase()}-poster.png`
        link.click()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Link href="/factory" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <ImageIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Brand Asset Studio</h1>
                    </div>
                    <p className="text-gray-400 ml-12">
                        Generate campaign-ready visuals for pitching and go-to-market launches
                    </p>
                </div>
                <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <Card className="bg-dark-900 border-dark-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5 text-purple-400" />
                            Brand Asset Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Customize visuals for investor decks, storefronts, and marketing campaigns
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white">Work Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Pride and Prejudice"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                            />
                        </div>

                        {/* Author */}
                        <div className="space-y-2">
                            <Label htmlFor="author" className="text-white">Author</Label>
                            <Input
                                id="author"
                                placeholder="e.g., Jane Austen"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                            />
                        </div>

                        {/* Tagline */}
                        <div className="space-y-2">
                            <Label htmlFor="tagline" className="text-white">Tagline (Optional)</Label>
                            <Textarea
                                id="tagline"
                                placeholder="A captivating romance classic..."
                                value={formData.tagline}
                                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                                rows={2}
                            />
                        </div>

                        {/* Style */}
                        <div className="space-y-2">
                            <Label htmlFor="style" className="text-white flex items-center gap-2">
                                <Type className="h-4 w-4" />
                                Visual Style
                            </Label>
                            <Select value={formData.style} onValueChange={(value) => setFormData({ ...formData, style: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vintage">Vintage / Classic</SelectItem>
                                    <SelectItem value="modern">Modern / Minimalist</SelectItem>
                                    <SelectItem value="dramatic">Dramatic / Cinematic</SelectItem>
                                    <SelectItem value="illustrated">Illustrated / Artistic</SelectItem>
                                    <SelectItem value="typography">Typography Focus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Color Scheme */}
                        <div className="space-y-2">
                            <Label htmlFor="colorScheme" className="text-white flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Color Scheme
                            </Label>
                            <Select value={formData.colorScheme} onValueChange={(value) => setFormData({ ...formData, colorScheme: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vibrant">Vibrant & Colorful</SelectItem>
                                    <SelectItem value="muted">Muted & Elegant</SelectItem>
                                    <SelectItem value="monochrome">Monochrome</SelectItem>
                                    <SelectItem value="pastel">Pastel & Soft</SelectItem>
                                    <SelectItem value="dark">Dark & Moody</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Size */}
                        <div className="space-y-2">
                            <Label htmlFor="size" className="text-white flex items-center gap-2">
                                <Layers className="h-4 w-4" />
                                Poster Size
                            </Label>
                            <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="poster">Standard Poster (24x36)</SelectItem>
                                    <SelectItem value="movie">Movie Poster (27x40)</SelectItem>
                                    <SelectItem value="social">Social Media (1080x1080)</SelectItem>
                                    <SelectItem value="banner">Wide Banner (1920x1080)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!formData.title || generating}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            size="lg"
                        >
                            {generating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate Poster
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="bg-dark-900 border-dark-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-purple-400" />
                            Preview
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Your generated poster will appear here
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {generatedPoster ? (
                            <div className="space-y-4">
                                <div className="relative rounded-lg overflow-hidden bg-dark-800 border border-dark-700">
                                    <img
                                        src={generatedPoster}
                                        alt="Generated Poster"
                                        className="w-full h-auto"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleDownload}
                                        className="flex-1"
                                        variant="outline"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                    <Button
                                        onClick={handleGenerate}
                                        className="flex-1"
                                        variant="outline"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Regenerate
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-4">
                                    <ImageIcon className="h-12 w-12 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No Poster Generated</h3>
                                <p className="text-gray-400 max-w-xs">
                                    Fill out the configuration form and click &quot;Generate Poster&quot; to create your design
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Info Section */}
            <Card className="bg-dark-900 border-dark-700">
                <CardHeader>
                    <CardTitle className="text-white">How It Works</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">1</span>
                                Configure Design
                            </div>
                            <p className="text-gray-400 pl-8">
                                Enter your work details and choose your preferred style, colors, and poster size
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">2</span>
                                AI Generation
                            </div>
                            <p className="text-gray-400 pl-8">
                                Our AI creates a custom poster design based on your specifications
                            </p>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-purple-400 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-xs">3</span>
                                Download & Use
                            </div>
                            <p className="text-gray-400 pl-8">
                                Download your high-quality poster and use it for marketing, social media, or print
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
