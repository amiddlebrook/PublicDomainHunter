'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Brain,
  Check,
  X,
  Settings,
  Zap,
  AlertCircle,
  RefreshCw,
  Save,
  TestTube
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { API_BASE_URL } from '../lib/utils'

interface Provider {
  provider: string
  model: string
  available: boolean
  description: string
}

interface AIPreferences {
  user_id: number
  enabled_providers: string[]
  default_provider: string | null
  mix_providers: boolean
  provider_settings: Record<string, any>
  temperature: number
  max_tokens: number
  created_at: string
  updated_at: string | null
}

interface AIProviderSelectorProps {
  onPreferencesChange?: (preferences: AIPreferences) => void
  compact?: boolean
}

export default function AIProviderSelector({ onPreferencesChange, compact = false }: AIProviderSelectorProps) {
  const { toast } = useToast()
  const [providers, setProviders] = useState<Provider[]>([])
  const [preferences, setPreferences] = useState<AIPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const loadProviders = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/config/providers`)
      if (response.ok) {
        const data = await response.json()
        setProviders(data)
      }
    } catch (error) {
      console.error('Failed to load providers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load AI providers',
        variant: 'destructive'
      })
    }
  }, [toast])

  const loadPreferences = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/config/preferences`)
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
        if (onPreferencesChange) {
          onPreferencesChange(data)
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to load AI preferences',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [onPreferencesChange, toast])

  useEffect(() => {
    loadProviders()
    loadPreferences()
  }, [loadProviders, loadPreferences])

  const savePreferences = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/config/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled_providers: preferences.enabled_providers,
          default_provider: preferences.default_provider,
          mix_providers: preferences.mix_providers,
          provider_settings: preferences.provider_settings,
          temperature: preferences.temperature,
          max_tokens: preferences.max_tokens
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
        setHasChanges(false)
        if (onPreferencesChange) {
          onPreferencesChange(data)
        }
        toast({
          title: 'Success',
          description: 'AI preferences saved successfully'
        })
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast({
        title: 'Error',
        description: 'Failed to save AI preferences',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testProvider = async (providerName: string) => {
    setTesting(providerName)
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/config/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: providerName,
          prompt: 'Hello, please respond with a brief greeting.'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Test Successful',
          description: `${providerName} is working correctly`
        })
      } else {
        toast({
          title: 'Test Failed',
          description: data.error || 'Provider test failed',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to test provider:', error)
      toast({
        title: 'Error',
        description: 'Failed to test provider',
        variant: 'destructive'
      })
    } finally {
      setTesting(null)
    }
  }

  const toggleProvider = (providerName: string) => {
    if (!preferences) return

    const isEnabled = preferences.enabled_providers.includes(providerName)
    const newEnabledProviders = isEnabled
      ? preferences.enabled_providers.filter(p => p !== providerName)
      : [...preferences.enabled_providers, providerName]

    setPreferences({
      ...preferences,
      enabled_providers: newEnabledProviders
    })
    setHasChanges(true)
  }

  const setDefaultProvider = (providerName: string) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      default_provider: providerName
    })
    setHasChanges(true)
  }

  const toggleMixProviders = (checked: boolean) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      mix_providers: checked
    })
    setHasChanges(true)
  }

  const updateTemperature = (value: number[]) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      temperature: value[0]
    })
    setHasChanges(true)
  }

  const updateMaxTokens = (value: number[]) => {
    if (!preferences) return

    setPreferences({
      ...preferences,
      max_tokens: value[0]
    })
    setHasChanges(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-300">Loading AI providers...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!preferences) return null

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>AI Providers</Label>
          <Badge variant="outline">
            {preferences.enabled_providers.length} enabled
          </Badge>
        </div>
        <Select
          value={preferences.default_provider || undefined}
          onValueChange={setDefaultProvider}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select default provider" />
          </SelectTrigger>
          <SelectContent>
            {providers
              .filter(p => p.available && preferences.enabled_providers.includes(p.provider))
              .map(provider => (
                <SelectItem key={provider.provider} value={provider.provider}>
                  {provider.provider.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {hasChanges && (
          <Button onClick={savePreferences} disabled={saving} size="sm" className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Available Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Provider Configuration
          </CardTitle>
          <CardDescription>
            Configure which AI providers to use for content analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map(provider => (
            <div
              key={provider.provider}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={preferences.enabled_providers.includes(provider.provider)}
                      onCheckedChange={() => toggleProvider(provider.provider)}
                      disabled={!provider.available}
                    />
                    <Label className="font-semibold">
                      {provider.provider.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                  </div>
                  {provider.available ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <X className="h-3 w-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                  {preferences.default_provider === provider.provider && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Zap className="h-3 w-3 mr-1" />
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-300 mb-1">Model: {provider.model}</p>
                <p className="text-xs text-gray-300">{provider.description}</p>
              </div>
              <div className="flex gap-2">
                {preferences.enabled_providers.includes(provider.provider) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultProvider(provider.provider)}
                    disabled={preferences.default_provider === provider.provider}
                  >
                    Set Default
                  </Button>
                )}
                {provider.available && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider.provider)}
                    disabled={testing === provider.provider}
                  >
                    {testing === provider.provider ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-300" />
            Generation Settings
          </CardTitle>
          <CardDescription>
            Configure how AI models generate responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mix Providers Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="text-base font-medium">Mix Multiple Providers</Label>
              <p className="text-sm text-gray-300 mt-1">
                Get responses from all enabled providers and compare results
              </p>
            </div>
            <Switch
              checked={preferences.mix_providers}
              onCheckedChange={toggleMixProviders}
            />
          </div>

          {/* Temperature Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature: {preferences.temperature.toFixed(1)}</Label>
              <span className="text-xs text-gray-300">
                {preferences.temperature < 0.3 ? 'Focused' : preferences.temperature > 1.0 ? 'Creative' : 'Balanced'}
              </span>
            </div>
            <Slider
              value={[preferences.temperature]}
              onValueChange={updateTemperature}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-gray-300">
              Lower values make output more focused and deterministic, higher values make it more creative
            </p>
          </div>

          {/* Max Tokens Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Tokens: {preferences.max_tokens.toLocaleString()}</Label>
              <span className="text-xs text-gray-300">
                ~{Math.round(preferences.max_tokens * 0.75)} words
              </span>
            </div>
            <Slider
              value={[preferences.max_tokens]}
              onValueChange={updateMaxTokens}
              min={100}
              max={32000}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-gray-300">
              Maximum length of generated responses
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Warning if no providers enabled */}
      {preferences.enabled_providers.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No AI providers are enabled. Please enable at least one provider to use AI features.
          </AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex gap-3">
          <Button onClick={savePreferences} disabled={saving} className="flex-1">
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Preferences
          </Button>
          <Button variant="outline" onClick={loadPreferences} disabled={saving}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
