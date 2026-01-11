'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSetup } from '@/contexts/SetupContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { API_BASE_URL } from '@/lib/utils'
import {
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react'

interface ProviderConfig {
  id: string
  name: string
  description: string
  docsUrl: string
  placeholder: string
  icon: string
}

const providers: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 Turbo for powerful analysis and content generation',
    docsUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-...',
    icon: '/icons/openai.svg'
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Claude 3.5 Sonnet for nuanced analysis and insights',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-...',
    icon: '/icons/anthropic.svg'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro for fast, cost-effective analysis',
    docsUrl: 'https://makersuite.google.com/app/apikey',
    placeholder: 'AIza...',
    icon: '/icons/google.svg'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to 100+ models including DeepSeek, Qwen, and more',
    docsUrl: 'https://openrouter.ai/keys',
    placeholder: 'sk-or-...',
    icon: '/icons/openrouter.svg'
  }
]

export default function SetupPage() {
  const router = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { refreshSetupStatus, setupCompleted } = useSetup()

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'valid' | 'invalid'>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/setup')
    }
  }, [authLoading, isAuthenticated, router])

  // Redirect to dashboard if already set up
  useEffect(() => {
    if (setupCompleted) {
      router.push('/')
    }
  }, [setupCompleted, router])

  const testApiKey = async (providerId: string) => {
    const key = apiKeys[providerId]
    if (!key?.trim()) return

    setTestStatus(prev => ({ ...prev, [providerId]: 'testing' }))

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/user/api-keys/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ provider: providerId, apiKey: key })
      })

      const data = await response.json()
      setTestStatus(prev => ({ ...prev, [providerId]: data.valid ? 'valid' : 'invalid' }))
    } catch (err) {
      setTestStatus(prev => ({ ...prev, [providerId]: 'invalid' }))
    }
  }

  const handleSave = async () => {
    // Check if at least one key is provided
    const hasKey = Object.values(apiKeys).some(k => k?.trim())
    if (!hasKey) {
      setError('Please add at least one API key to continue')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include',
        body: JSON.stringify({ apiKeys })
      })

      if (response.ok) {
        await refreshSetupStatus()
        router.push('/')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save API keys')
      }
    } catch (err) {
      setError('Failed to save API keys. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const hasAnyKey = Object.values(apiKeys).some(k => k?.trim())

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/20 mb-4">
            <Key className="h-8 w-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Complete Your Setup</h1>
          <p className="text-lg text-gray-400 max-w-md mx-auto">
            Add your AI API keys to unlock the full power of Public Domain Hunter. Your keys are stored securely and never shared.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
            <Sparkles className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">AI-Powered Analysis</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
            <Shield className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Secure Storage</p>
          </div>
          <div className="p-4 rounded-lg bg-dark-800/50 border border-dark-700">
            <Zap className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Pay-As-You-Go</p>
          </div>
        </div>

        {/* API Key Cards */}
        <Card className="bg-dark-800/80 border-dark-700">
          <CardHeader>
            <CardTitle className="text-white">API Keys</CardTitle>
            <CardDescription>
              Add at least one API key to get started. You can add more later in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {providers.map((provider) => (
              <div key={provider.id} className="p-4 rounded-lg bg-dark-900/50 border border-dark-600 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">{provider.name}</h3>
                    <p className="text-sm text-gray-400">{provider.description}</p>
                  </div>
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                  >
                    Get Key <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type="password"
                      placeholder={provider.placeholder}
                      value={apiKeys[provider.id] || ''}
                      onChange={(e) => {
                        setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))
                        setTestStatus(prev => ({ ...prev, [provider.id]: 'idle' }))
                      }}
                      className="bg-dark-800 border-dark-600 text-white pr-10"
                    />
                    {testStatus[provider.id] === 'valid' && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                    {testStatus[provider.id] === 'invalid' && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                    )}
                    {testStatus[provider.id] === 'testing' && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 animate-spin" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testApiKey(provider.id)}
                    disabled={!apiKeys[provider.id]?.trim() || testStatus[provider.id] === 'testing'}
                    className="border-dark-600 hover:bg-dark-700"
                  >
                    Test
                  </Button>
                </div>
              </div>
            ))}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={!hasAnyKey || saving}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Your API keys are encrypted and stored securely. You are billed directly by the AI providers based on your usage.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
