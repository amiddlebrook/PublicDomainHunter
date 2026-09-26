'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  FileSearch,
  Scale,
  TrendingUp,
  Briefcase,
  FileText,
  Cpu,
  BookOpen,
  Music,
  Image as ImageIcon,
  Box,
  Zap,
  Shield,
  Target
} from 'lucide-react'

const professionalTools = [
  {
    id: 'patent-analyzer',
    title: 'Patent Viability Analyzer',
    description: 'AI-powered analysis of patent commercialization potential, manufacturing complexity, and market demand',
    icon: Lightbulb,
    color: 'amber',
    status: 'available',
    href: '/patents',
    badge: 'Professional'
  },
  {
    id: 'fto-checker',
    title: 'Freedom to Operate Check',
    description: 'Analyze patent claims and identify potential blockers before commercializing an invention',
    icon: Shield,
    color: 'blue',
    status: 'coming-soon',
    href: '/studio/fto',
    badge: 'Legal'
  },
  {
    id: 'prior-art',
    title: 'Prior Art Search',
    description: 'Search for existing patents and publications that may relate to your product idea',
    icon: FileSearch,
    color: 'purple',
    status: 'coming-soon',
    href: '/studio/prior-art',
    badge: 'Research'
  },
  {
    id: 'trademark-check',
    title: 'Trademark Availability',
    description: 'Check if abandoned trademarks are safe to use and identify potential conflicts',
    icon: Scale,
    color: 'orange',
    status: 'coming-soon',
    href: '/studio/trademark-check',
    badge: 'Legal'
  },
  {
    id: 'market-analysis',
    title: 'Market Intelligence',
    description: 'Analyze market size, competition, and demand signals for public domain IP',
    icon: TrendingUp,
    color: 'emerald',
    status: 'available',
    href: '/opportunities',
    badge: 'Analytics'
  },
  {
    id: 'business-plan',
    title: 'Commercialization Planner',
    description: 'Generate business plans and go-to-market strategies for public domain IP',
    icon: Briefcase,
    color: 'indigo',
    status: 'coming-soon',
    href: '/studio/business-plan',
    badge: 'Strategy'
  },
]

const creativeTools = [
  {
    id: 'posters',
    title: 'Marketing Materials',
    description: 'Generate promotional posters and graphics for public domain works',
    icon: ImageIcon,
    color: 'pink',
    status: 'available',
    href: '/factory/posters'
  },
  {
    id: 'ebooks',
    title: 'eBook Publisher',
    description: 'Convert public domain texts into professionally formatted eBooks',
    icon: BookOpen,
    color: 'blue',
    status: 'available',
    href: '/factory/ebooks'
  },
  {
    id: 'audiobooks',
    title: 'Audiobook Generator',
    description: 'Transform texts into high-quality audiobooks with AI narration',
    icon: Music,
    color: 'green',
    status: 'coming-soon',
    href: '/factory/audiobooks'
  },
  {
    id: '3d-models',
    title: '3D Visualization',
    description: 'Create 3D models from patent drawings and technical illustrations',
    icon: Box,
    color: 'orange',
    status: 'coming-soon',
    href: '/factory/3d-models'
  },
]

const apiTools = [
  {
    id: 'patent-api',
    title: 'Patent Search API',
    description: 'Access 20M+ expired patents programmatically',
    endpoint: '/api/patents/search',
    credits: '1 credit/query',
  },
  {
    id: 'scoring-api',
    title: 'Viability Scoring API',
    description: 'Get AI-powered monetization scores for any patent',
    endpoint: '/api/patents/analyze',
    credits: '5 credits/analysis',
  },
  {
    id: 'search-api',
    title: 'Full-Text Search API',
    description: 'Search across all public domain works',
    endpoint: '/api/search',
    credits: '1 credit/query',
  },
]

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800 bg-dark-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/" className="text-gray-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-white">Studio</h1>
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30">
                  Professional Tools
                </Badge>
              </div>
              <p className="text-gray-400 ml-8">
                Professional tools for analyzing, validating, and commercializing public domain IP
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/api/patents/pricing">
                <Cpu className="h-4 w-4 mr-2" />
                API Access
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Professional Tools */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Target className="h-5 w-5 text-indigo-400" />
            <h2 className="text-xl font-semibold text-white">Professional Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionalTools.map((tool) => {
              const Icon = tool.icon
              const isAvailable = tool.status === 'available'

              return (
                <Card
                  key={tool.id}
                  className={`bg-dark-900 border-dark-700 transition-all ${
                    isAvailable ? 'hover:border-indigo-500/50 cursor-pointer' : 'opacity-60'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg bg-${tool.color}-500/10`}>
                        <Icon className={`h-5 w-5 text-${tool.color}-400`} />
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs bg-dark-800 border-dark-600 text-gray-400">
                          {tool.badge}
                        </Badge>
                        {!isAvailable && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-500">
                            Soon
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-white text-base">{tool.title}</CardTitle>
                    <CardDescription className="text-gray-500 text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant={isAvailable ? 'default' : 'outline'}
                      className={`w-full ${isAvailable ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                      disabled={!isAvailable}
                      asChild={isAvailable}
                    >
                      {isAvailable ? (
                        <Link href={tool.href}>
                          Launch Tool
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      ) : (
                        <span>Coming Soon</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Creative Tools */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Zap className="h-5 w-5 text-pink-400" />
            <h2 className="text-xl font-semibold text-white">Content Creation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {creativeTools.map((tool) => {
              const Icon = tool.icon
              const isAvailable = tool.status === 'available'

              return (
                <Card
                  key={tool.id}
                  className={`bg-dark-900 border-dark-700 transition-all ${
                    isAvailable ? 'hover:border-pink-500/50 cursor-pointer' : 'opacity-60'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-${tool.color}-500/10`}>
                        <Icon className={`h-4 w-4 text-${tool.color}-400`} />
                      </div>
                      {!isAvailable && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-500 ml-auto">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-white text-sm mb-1">{tool.title}</h3>
                    <p className="text-gray-500 text-xs mb-3">{tool.description}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      disabled={!isAvailable}
                      asChild={isAvailable}
                    >
                      {isAvailable ? (
                        <Link href={tool.href}>Open</Link>
                      ) : (
                        <span>Coming Soon</span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* API Access */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">API Access</h2>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Pay-per-use
            </Badge>
          </div>
          <Card className="bg-dark-900 border-dark-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {apiTools.map((api) => (
                  <div key={api.id} className="space-y-2">
                    <h3 className="font-medium text-white">{api.title}</h3>
                    <p className="text-sm text-gray-500">{api.description}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <code className="text-xs bg-dark-800 px-2 py-1 rounded text-emerald-400">
                        {api.endpoint}
                      </code>
                      <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                        {api.credits}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Start with 50 free credits/month. No subscription required.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/api/patents/pricing">
                    View Pricing
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Use Cases */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6">Common Use Cases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-dark-900 border-dark-700">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">🏭</div>
                <h3 className="font-medium text-white text-sm mb-1">Manufacturing</h3>
                <p className="text-gray-500 text-xs">
                  Find expired patents for products you can manufacture without licensing fees
                </p>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-dark-700">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">💡</div>
                <h3 className="font-medium text-white text-sm mb-1">R&D Teams</h3>
                <p className="text-gray-500 text-xs">
                  Discover prior art and build on existing inventions without infringement risk
                </p>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-dark-700">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">🚀</div>
                <h3 className="font-medium text-white text-sm mb-1">Startups</h3>
                <p className="text-gray-500 text-xs">
                  Validate product ideas against existing patents and find freedom to operate
                </p>
              </CardContent>
            </Card>
            <Card className="bg-dark-900 border-dark-700">
              <CardContent className="p-4">
                <div className="text-2xl mb-2">📚</div>
                <h3 className="font-medium text-white text-sm mb-1">Publishers</h3>
                <p className="text-gray-500 text-xs">
                  Discover public domain content for republishing, adaptation, and derivative works
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
