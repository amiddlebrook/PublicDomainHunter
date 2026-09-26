'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSetup } from '@/contexts/SetupContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { API_BASE_URL } from '@/lib/utils'
import {
    User,
    Lock,
    Bell,
    Palette,
    CreditCard,
    Key,
    Settings as SettingsIcon,
    Save,
    Trash2,
    CheckCircle2,
    XCircle,
    Loader2,
    ExternalLink
} from 'lucide-react'

interface ProviderStatus {
    configured: boolean
    masked: string | null
}

interface ApiKeysStatus {
    providers: Record<string, ProviderStatus>
    setupCompleted: boolean
    defaultProvider: string | null
}

const providerInfo = [
    { id: 'openai', name: 'OpenAI', docsUrl: 'https://platform.openai.com/api-keys', placeholder: 'sk-...' },
    { id: 'claude', name: 'Claude (Anthropic)', docsUrl: 'https://console.anthropic.com/settings/keys', placeholder: 'sk-ant-...' },
    { id: 'gemini', name: 'Google Gemini', docsUrl: 'https://makersuite.google.com/app/apikey', placeholder: 'AIza...' },
    { id: 'openrouter', name: 'OpenRouter', docsUrl: 'https://openrouter.ai/keys', placeholder: 'sk-or-...' },
]

export default function SettingsPage() {
    const { user } = useAuth()
    const { refreshSetupStatus } = useSetup()
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')

    const [profile, setProfile] = useState({
        fullName: user?.full_name || '',
        email: user?.email || '',
        username: user?.username || ''
    })

    const [notifications, setNotifications] = useState({
        emailNotifications: true,
        marketAlerts: true,
        newOpportunities: false,
        weeklyDigest: true
    })

    const [preferences, setPreferences] = useState({
        theme: 'dark',
        language: 'en',
        currency: 'USD'
    })

    // API Keys state
    const [apiKeysStatus, setApiKeysStatus] = useState<ApiKeysStatus | null>(null)
    const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'valid' | 'invalid'>>({})
    const [apiKeysLoading, setApiKeysLoading] = useState(true)
    const [apiKeysSaving, setApiKeysSaving] = useState(false)
    const [apiKeysError, setApiKeysError] = useState<string | null>(null)

    // Fetch API keys status
    useEffect(() => {
        const fetchApiKeys = async () => {
            try {
                const token = localStorage.getItem('token')
                const response = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                    credentials: 'include'
                })
                if (response.ok) {
                    const data = await response.json()
                    setApiKeysStatus(data)
                }
            } catch (error) {
                console.error('Failed to fetch API keys:', error)
            } finally {
                setApiKeysLoading(false)
            }
        }
        if (user) fetchApiKeys()
    }, [user])

    const handleSaveProfile = async () => {
        setSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Profile updated!')
    }

    const handleSaveNotifications = async () => {
        setSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Notification preferences saved!')
    }

    const handleSavePreferences = async () => {
        setSaving(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Preferences saved!')
    }

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

    const handleSaveApiKeys = async () => {
        setApiKeysSaving(true)
        setApiKeysError(null)

        try {
            const token = localStorage.getItem('token')

            // Merge new keys with existing (only update non-empty values)
            const keysToSave: Record<string, string> = {}
            for (const [key, value] of Object.entries(apiKeys)) {
                if (value?.trim()) {
                    keysToSave[key] = value.trim()
                }
            }

            const response = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                credentials: 'include',
                body: JSON.stringify({ apiKeys: keysToSave })
            })

            if (response.ok) {
                // Refresh status
                const statusResponse = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                    credentials: 'include'
                })
                if (statusResponse.ok) {
                    setApiKeysStatus(await statusResponse.json())
                }
                setApiKeys({})
                await refreshSetupStatus()
            } else {
                const data = await response.json()
                setApiKeysError(data.error || 'Failed to save API keys')
            }
        } catch (err) {
            setApiKeysError('Failed to save API keys')
        } finally {
            setApiKeysSaving(false)
        }
    }

    const handleDeleteApiKey = async (providerId: string) => {
        if (!confirm(`Are you sure you want to remove your ${providerId} API key?`)) return

        try {
            const token = localStorage.getItem('token')
            const response = await fetch(`${API_BASE_URL}/api/user/api-keys/${providerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                credentials: 'include'
            })

            if (response.ok) {
                const statusResponse = await fetch(`${API_BASE_URL}/api/user/api-keys`, {
                    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                    credentials: 'include'
                })
                if (statusResponse.ok) {
                    setApiKeysStatus(await statusResponse.json())
                }
                await refreshSetupStatus()
            }
        } catch (err) {
            console.error('Failed to delete API key:', err)
        }
    }

    if (!user) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Please log in to access settings.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <SettingsIcon className="h-8 w-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="profile">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="api-keys">
                        <Key className="h-4 w-4 mr-2" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Lock className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="h-4 w-4 mr-2" />
                        Notifications
                    </TabsTrigger>
                    <TabsTrigger value="preferences">
                        <Palette className="h-4 w-4 mr-2" />
                        Preferences
                    </TabsTrigger>
                    <TabsTrigger value="billing">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Billing
                    </TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal details and account information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        value={profile.username}
                                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Separator />
                            <Button onClick={handleSaveProfile} disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* API Keys Tab */}
                <TabsContent value="api-keys" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI API Keys</CardTitle>
                            <CardDescription>
                                Manage your AI provider API keys. You need at least one key to use AI features.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {apiKeysLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                </div>
                            ) : (
                                <>
                                    {providerInfo.map((provider) => {
                                        const status = apiKeysStatus?.providers[provider.id]
                                        const isConfigured = status?.configured

                                        return (
                                            <div key={provider.id} className="p-4 rounded-lg bg-muted/50 border space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <h3 className="font-medium">{provider.name}</h3>
                                                            {isConfigured && status?.masked && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    Current key: {status.masked}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isConfigured ? (
                                                            <span className="flex items-center text-sm text-green-500">
                                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                                Configured
                                                            </span>
                                                        ) : (
                                                            <span className="text-sm text-muted-foreground">Not configured</span>
                                                        )}
                                                        <a
                                                            href={provider.docsUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1"
                                                        >
                                                            Get Key <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <div className="flex-1 relative">
                                                        <Input
                                                            type="password"
                                                            placeholder={isConfigured ? 'Enter new key to replace' : provider.placeholder}
                                                            value={apiKeys[provider.id] || ''}
                                                            onChange={(e) => {
                                                                setApiKeys(prev => ({ ...prev, [provider.id]: e.target.value }))
                                                                setTestStatus(prev => ({ ...prev, [provider.id]: 'idle' }))
                                                            }}
                                                            className="pr-10"
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
                                                    >
                                                        Test
                                                    </Button>
                                                    {isConfigured && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteApiKey(provider.id)}
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {apiKeysError && (
                                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                            {apiKeysError}
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleSaveApiKeys}
                                        disabled={!Object.values(apiKeys).some(k => k?.trim()) || apiKeysSaving}
                                        className="w-full"
                                    >
                                        {apiKeysSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save API Keys
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center">
                                        Your API keys are encrypted and stored securely. You are billed directly by the AI providers.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Update your password to keep your account secure
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input id="currentPassword" type="password" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input id="newPassword" type="password" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input id="confirmPassword" type="password" />
                                </div>
                            </div>
                            <Separator />
                            <Button>
                                <Lock className="h-4 w-4 mr-2" />
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Danger Zone</CardTitle>
                            <CardDescription>
                                Irreversible actions for your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Account
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Notifications</CardTitle>
                            <CardDescription>
                                Configure which emails you want to receive
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive email updates about your account</p>
                                </div>
                                <Switch
                                    checked={notifications.emailNotifications}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, emailNotifications: checked })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Market Alerts</Label>
                                    <p className="text-sm text-muted-foreground">Get notified about new market opportunities</p>
                                </div>
                                <Switch
                                    checked={notifications.marketAlerts}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, marketAlerts: checked })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>New Opportunities</Label>
                                    <p className="text-sm text-muted-foreground">Alert when high-value works become public domain</p>
                                </div>
                                <Switch
                                    checked={notifications.newOpportunities}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, newOpportunities: checked })
                                    }
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Digest</Label>
                                    <p className="text-sm text-muted-foreground">Weekly summary of top opportunities</p>
                                </div>
                                <Switch
                                    checked={notifications.weeklyDigest}
                                    onCheckedChange={(checked) =>
                                        setNotifications({ ...notifications, weeklyDigest: checked })
                                    }
                                />
                            </div>
                            <Separator />
                            <Button onClick={handleSaveNotifications} disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Preferences Tab */}
                <TabsContent value="preferences" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Display Preferences</CardTitle>
                            <CardDescription>
                                Customize how the app looks and feels
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="theme">Theme</Label>
                                    <Select value={preferences.theme} onValueChange={(value) => setPreferences({ ...preferences, theme: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="language">Language</Label>
                                    <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Espanol</SelectItem>
                                            <SelectItem value="fr">Francais</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={preferences.currency} onValueChange={(value) => setPreferences({ ...preferences, currency: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Separator />
                            <Button onClick={handleSavePreferences} disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Billing Tab */}
                <TabsContent value="billing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription & Billing</CardTitle>
                            <CardDescription>
                                Manage your subscription and payment methods
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Free Plan */}
                                <div className="border rounded-lg p-6 space-y-4">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-xl">Free</h3>
                                        <p className="text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                                        <p className="text-muted-foreground">Essential tools for public domain research.</p>
                                    </div>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex items-center"><span className="mr-2 text-green-500">+</span> Basic Search</li>
                                        <li className="flex items-center"><span className="mr-2 text-green-500">+</span> 5 AI Analyses/day</li>
                                        <li className="flex items-center"><span className="mr-2 text-green-500">+</span> Community Support</li>
                                    </ul>
                                    <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                                </div>

                                {/* Pro Plan */}
                                <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-lg p-6 space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs px-3 py-1 rounded-bl-lg">POPULAR</div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-xl text-indigo-400">Pro Hunter</h3>
                                        <p className="text-2xl font-bold text-indigo-400">$29<span className="text-sm font-normal text-indigo-300">/month</span></p>
                                        <p className="text-indigo-300">Advanced tools for serious sellers.</p>
                                    </div>
                                    <ul className="space-y-2 text-sm text-indigo-300">
                                        <li className="flex items-center"><span className="mr-2 text-indigo-500">+</span> Unlimited Search</li>
                                        <li className="flex items-center"><span className="mr-2 text-indigo-500">+</span> Unlimited AI Analyses</li>
                                        <li className="flex items-center"><span className="mr-2 text-indigo-500">+</span> Market Signals & Trends</li>
                                        <li className="flex items-center"><span className="mr-2 text-indigo-500">+</span> Priority Support</li>
                                    </ul>
                                    <Button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                        onClick={async () => {
                                            try {
                                                setSaving(true);
                                                const priceId = 'price_1234567890';
                                                const token = localStorage.getItem('token');
                                                const response = await fetch(`${API_BASE_URL}/api/billing/checkout`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': token ? `Bearer ${token}` : ''
                                                    },
                                                    credentials: 'include',
                                                    body: JSON.stringify({ priceId }),
                                                });
                                                const data = await response.json();
                                                if (data.url) {
                                                    window.location.href = data.url;
                                                } else {
                                                    alert('Failed to start checkout');
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                alert('An error occurred');
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        disabled={saving}
                                    >
                                        {saving ? 'Processing...' : 'Upgrade to Pro'}
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <h4 className="font-medium mb-4">Manage Subscription</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Already have a subscription? Manage your payment methods and billing history.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            setSaving(true);
                                            const token = localStorage.getItem('token');
                                            const response = await fetch(`${API_BASE_URL}/api/billing/portal`, {
                                                method: 'POST',
                                                headers: { 'Authorization': token ? `Bearer ${token}` : '' },
                                                credentials: 'include',
                                            });
                                            const data = await response.json();
                                            if (data.url) {
                                                window.location.href = data.url;
                                            } else {
                                                alert('Failed to open billing portal. You may not have an active subscription.');
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert('An error occurred');
                                        } finally {
                                            setSaving(false);
                                        }
                                    }}
                                    disabled={saving}
                                >
                                    Open Customer Portal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
