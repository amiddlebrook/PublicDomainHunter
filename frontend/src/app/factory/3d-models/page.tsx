'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
    Box,
    Download,
    Sparkles,
    Settings,
    RefreshCw,
    ArrowLeft,
    Eye,
    Layers,
    Move3d,
    Zap,
    Cpu
} from 'lucide-react'
import Link from 'next/link'

export default function Models3DFactoryPage() {
    const [generating, setGenerating] = useState(false)
    const [generatedModel, setGeneratedModel] = useState<string | null>(null)
    const [modelPreview, setModelPreview] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        modelType: 'character',
        artStyle: 'realistic',
        detailLevel: 'medium',
        polygonCount: [50000],
        textureResolution: '2k',
        animationReady: false,
        riggingIncluded: false
    })

    const handleGenerate = async () => {
        setGenerating(true)
        // Simulate 3D model generation
        setTimeout(() => {
            setGeneratedModel('model_generated.glb')
            setModelPreview('https://via.placeholder.com/600x400/1e293b/ffffff?text=3D+Model+Preview')
            setGenerating(false)
        }, 3000)
    }

    const handleDownload = (format: string) => {
        alert(`Downloading 3D model in ${format.toUpperCase()} format`)
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
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Box className="h-6 w-6 text-orange-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">3D Models Factory</h1>
                    </div>
                    <p className="text-gray-400 ml-12">
                        Create stunning 3D models and visualizations from public domain works
                    </p>
                </div>
                <Badge variant="outline" className="border-orange-500/50 text-orange-400">
                    <Zap className="h-3 w-3 mr-1" />
                    High-Impact Visuals
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <Card className="bg-dark-900 border-dark-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5 text-orange-400" />
                            3D Model Configuration
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Configure your 3D model specifications and visual style
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white">Model Title *</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Victorian Book Cover"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-white">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe the 3D model you want to create..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="bg-dark-800 border-dark-700 text-white"
                                rows={3}
                            />
                        </div>

                        {/* Model Type */}
                        <div className="space-y-2">
                            <Label htmlFor="modelType" className="text-white flex items-center gap-2">
                                <Box className="h-4 w-4" />
                                Model Type
                            </Label>
                            <Select value={formData.modelType} onValueChange={(value) => setFormData({ ...formData, modelType: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="character">Character Model</SelectItem>
                                    <SelectItem value="environment">Environment/Scene</SelectItem>
                                    <SelectItem value="object">Object/Prop</SelectItem>
                                    <SelectItem value="architecture">Architecture</SelectItem>
                                    <SelectItem value="vehicle">Vehicle/Machine</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Art Style */}
                        <div className="space-y-2">
                            <Label htmlFor="artStyle" className="text-white">Art Style</Label>
                            <Select value={formData.artStyle} onValueChange={(value) => setFormData({ ...formData, artStyle: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="realistic">Photorealistic</SelectItem>
                                    <SelectItem value="stylized">Stylized/Cartoon</SelectItem>
                                    <SelectItem value="vintage">Vintage/Retro</SelectItem>
                                    <SelectItem value="fantasy">Fantasy/Artistic</SelectItem>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Detail Level */}
                        <div className="space-y-2">
                            <Label htmlFor="detailLevel" className="text-white">Detail Level</Label>
                            <Select value={formData.detailLevel} onValueChange={(value) => setFormData({ ...formData, detailLevel: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low (Fast)</SelectItem>
                                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                                    <SelectItem value="high">High (Detailed)</SelectItem>
                                    <SelectItem value="ultra">Ultra (Maximum)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Polygon Count Slider */}
                        <div className="space-y-2">
                            <Label className="text-white flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Layers className="h-4 w-4" />
                                    Polygon Count
                                </span>
                                <span className="text-orange-400 font-mono">{formData.polygonCount[0].toLocaleString()}</span>
                            </Label>
                            <Slider
                                value={formData.polygonCount}
                                onValueChange={(value) => setFormData({ ...formData, polygonCount: value })}
                                max={200000}
                                min={1000}
                                step={1000}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>1K</span>
                                <span>200K</span>
                            </div>
                        </div>

                        {/* Texture Resolution */}
                        <div className="space-y-2">
                            <Label htmlFor="textureResolution" className="text-white">Texture Resolution</Label>
                            <Select value={formData.textureResolution} onValueChange={(value) => setFormData({ ...formData, textureResolution: value })}>
                                <SelectTrigger className="bg-dark-800 border-dark-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1k">1K (1024x1024)</SelectItem>
                                    <SelectItem value="2k">2K (2048x2048)</SelectItem>
                                    <SelectItem value="4k">4K (4096x4096)</SelectItem>
                                    <SelectItem value="8k">8K (8192x8192)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Advanced Options */}
                        <div className="space-y-3 pt-2 border-t border-dark-700">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="animation" className="text-white cursor-pointer">Animation Ready</Label>
                                <input
                                    type="checkbox"
                                    id="animation"
                                    checked={formData.animationReady}
                                    onChange={(e) => setFormData({ ...formData, animationReady: e.target.checked })}
                                    className="rounded border-dark-700 bg-dark-800 text-orange-500"
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="rigging" className="text-white cursor-pointer">Include Rigging</Label>
                                <input
                                    type="checkbox"
                                    id="rigging"
                                    checked={formData.riggingIncluded}
                                    onChange={(e) => setFormData({ ...formData, riggingIncluded: e.target.checked })}
                                    className="rounded border-dark-700 bg-dark-800 text-orange-500"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={!formData.title || generating}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                            size="lg"
                        >
                            {generating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Generating 3D Model...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate 3D Model
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="bg-dark-900 border-dark-700">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5 text-orange-400" />
                            3D Model Preview
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Interactive 3D model preview and download options
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {modelPreview ? (
                            <div className="space-y-4">
                                <div className="relative rounded-lg overflow-hidden bg-dark-800 border border-dark-700">
                                    <img
                                        src={modelPreview}
                                        alt="3D Model Preview"
                                        className="w-full h-auto"
                                    />
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <Button size="sm" variant="secondary" className="bg-dark-900/80">
                                            <Move3d className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="secondary" className="bg-dark-900/80">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Model Specs */}
                                <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                                    <h4 className="text-white font-medium mb-3">Model Specifications</h4>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Polygons:</span>
                                            <span className="text-orange-400 font-mono">{formData.polygonCount[0].toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Textures:</span>
                                            <span className="text-orange-400">{formData.textureResolution.toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Style:</span>
                                            <span className="text-orange-400 capitalize">{formData.artStyle}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Type:</span>
                                            <span className="text-orange-400 capitalize">{formData.modelType}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download Options */}
                                <div className="space-y-2">
                                    <Button
                                        onClick={() => handleDownload('glb')}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download GLB (Web Ready)
                                    </Button>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            onClick={() => handleDownload('obj')}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            OBJ
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload('fbx')}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            FBX
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload('blend')}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            BLEND
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mb-4">
                                    <Box className="h-12 w-12 text-gray-600" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">No 3D Model Generated</h3>
                                <p className="text-gray-400 max-w-xs">
                                    Configure your model specifications and click "Generate 3D Model" to create your design
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Features Section */}
            <Card className="bg-dark-900 border-dark-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-orange-400" />
                        Advanced 3D Features
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                            <h4 className="font-medium text-orange-400">AI-Powered Modeling</h4>
                            <p className="text-gray-400">
                                Advanced AI algorithms create detailed 3D models optimized for your specifications
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-orange-400">Professional Quality</h4>
                            <p className="text-gray-400">
                                High-polygon models with 4K/8K textures suitable for commercial projects
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-orange-400">Multi-Format Export</h4>
                            <p className="text-gray-400">
                                Export to GLB, OBJ, FBX, and Blender formats for maximum compatibility
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
