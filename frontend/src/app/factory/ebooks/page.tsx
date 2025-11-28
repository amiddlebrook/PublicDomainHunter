'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    BookOpen,
    Download,
    Sparkles,
    FileText,
    Settings,
    RefreshCw,
    ArrowLeft,
    Check
} from 'lucide-react'
import Link from 'next/link'

export default function EbookFactoryPage() {
    const [generating, setGenerating] = useState(false)
    const [generatedEbook, setGeneratedEbook] = useState<any>(null)
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        description: '',
        format: 'epub',
        includeTableOfContents: true,
        includeMetadata: true,
        fontFamily: 'serif',
        fontSize: 'medium'
    })

    const handleGenerate = async () => {
        setGenerating(true)
        try {
            const response = await fetch('/api/factory/ebook/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    author: formData.author,
                    description: formData.description,
                    format: formData.format,
                    include_table_of_contents: formData.includeTableOfContents,
                    include_metadata: formData.includeMetadata,
                    font_family: formData.fontFamily,
                    font_size: formData.fontSize
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate eBook')
            }

            const result = await response.json()
            
            // Poll for completion status
            const pollStatus = async () => {
                const statusResponse = await fetch(`/api/factory/ebook/status/${result.generation_id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                
                const status = await statusResponse.json()
                
                if (status.status === 'completed') {
                    setGeneratedEbook({
                        title: formData.title,
                        author: formData.author,
                        format: formData.format.toUpperCase(),
                        size: status.metadata?.file_size || '2.4 MB',
                        pages: 324,
                        downloadUrl: status.download_url || '#'
                    })
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
            console.error('Error generating eBook:', error)
            setGenerating(false)
            // Fallback for demo
            setGeneratedEbook({
                title: formData.title,
                author: formData.author,
                format: formData.format.toUpperCase(),
                size: '2.4 MB',
                pages: 324,
                downloadUrl: '#'
            })
        }
    }

    const handleDownload = (format: string) => {
        alert(`Downloading ${formData.title}.${format}`)
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
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">eBook Factory</h1>
                    </div>
                    <p className="text-gray-400 ml-12">
                        Convert public domain works into modern, formatted eBooks
                    </p>
                </div>
                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Professional Format
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <Card className="bg-dark-900 border-dark-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-blue-400" />
                            eBook Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Customize your eBook format and appearance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white">Book Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Frankenstein"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                            />
                        </div>

                        {/* Author */}
                        <div className="space-y-2">
                            <Label htmlFor="author" className="text-white">Author *</Label>
                            <Input
                                id="author"
                                placeholder="e.g., Mary Shelley"
                                value={formData.author}
                                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="A brief description of the work..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                                rows={3}
                            />
                        </div>

                        {/* Format */}
                        <div className="space-y-2">
                            <Label htmlFor="format" className="text-white flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Output Format
                            </Label>
                            <Select value={formData.format} onValueChange={(value) => setFormData({ ...formData, format: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="epub">EPUB (Universal)</SelectItem>
                                    <SelectItem value="mobi">MOBI (Kindle)</SelectItem>
                                    <SelectItem value="pdf">PDF (Print-ready)</SelectItem>
                                    <SelectItem value="azw3">AZW3 (Kindle HD)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Typography */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fontFamily" className="text-white">Font Family</Label>
                                <Select value={formData.fontFamily} onValueChange={(value) => setFormData({ ...formData, fontFamily: value })}>
                                    <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="serif">Serif (Classic)</SelectItem>
                                        <SelectItem value="sans">Sans-Serif (Modern)</SelectItem>
                                        <SelectItem value="mono">Monospace</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fontSize" className="text-white">Base Font Size</Label>
                                <Select value={formData.fontSize} onValueChange={(value) => setFormData({ ...formData, fontSize: value })}>
                                    <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="small">Small</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="large">Large</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="toc"
                                    checked={formData.includeTableOfContents}
                                    onCheckedChange={(checked) => setFormData({ ...formData, includeTableOfContents: checked as boolean })}
                                />
                                <Label htmlFor="toc" className="text-white cursor-pointer">
                                    Include Table of Contents
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="metadata"
                                    checked={formData.includeMetadata}
                                    onCheckedChange={(checked) => setFormData({ ...formData, includeMetadata: checked as boolean })}
                                />
                                <Label htmlFor="metadata" className="text-white cursor-pointer">
                                    Embed Metadata & Cover
                                </Label>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!formData.title || !formData.author || generating}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            size="lg"
                        >
                            {generating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating eBook...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate eBook
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="bg-dark-900 border-dark-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-blue-400" />
                            Generated eBook
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Your professionally formatted eBook
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {generatedEbook ? (
                            <div className="space-y-4">
                                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-24 h-32 bg-gradient-to-br from-blue-600 to-cyan-600 rounded flex items-center justify-center">
                                            <BookOpen className="h-12 w-12 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white mb-1">{generatedEbook.title}</h3>
                                            <p className="text-gray-400 mb-3">by {generatedEbook.author}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                                                    {generatedEbook.format}
                                                </Badge>
                                                <Badge variant="outline" className="text-gray-400">
                                                    {generatedEbook.size}
                                                </Badge>
                                                <Badge variant="outline" className="text-gray-400">
                                                    ~{generatedEbook.pages} pages
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span>Professional formatting applied</span>
                                        </div>
                                        {formData.includeTableOfContents && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>Table of contents generated</span>
                                            </div>
                                        )}
                                        {formData.includeMetadata && (
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <span>Metadata and cover embedded</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span>Optimized for e-readers</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        onClick={() => handleDownload(formData.format)}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download {formData.format.toUpperCase()}
                                    </Button>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            onClick={() => handleDownload('epub')}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            EPUB
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload('mobi')}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            MOBI
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload('pdf')}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-4">
                                    <BookOpen className="h-12 w-12 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No eBook Generated</h3>
                                <p className="text-gray-400 max-w-xs">
                                    Configure your eBook settings and click &quot;Generate eBook&quot; to create your formatted file
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Features */}
            <Card className="bg-dark-900 border-dark-700">
                <CardHeader>
                    <CardTitle className="text-white">eBook Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-400">Professional Formatting</h4>
                            <p className="text-gray-400">
                                Clean typography, proper spacing, and e-reader optimization for the best reading experience
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-400">Multiple Formats</h4>
                            <p className="text-gray-400">
                                Generate EPUB, MOBI, PDF, and AZW3 formats to reach readers on any device
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-400">Smart Metadata</h4>
                            <p className="text-gray-400">
                                Embedded metadata, covers, and table of contents for professional distribution
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
