'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
    User,
    Lock,
    Bell,
    Palette,
    CreditCard,
    Settings as SettingsIcon,
    Save,
    Trash2
} from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()
    const [saving, setSaving] = useState(false)

    const [profile, setProfile] = useState({
        fullName: user?.fullName || '',
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

    const handleSaveProfile = async () => {
        setSaving(true)
        // TODO: Implement profile update API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Profile updated!')
    }

    const handleSaveNotifications = async () => {
        setSaving(true)
        // TODO: Implement notification preferences API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Notification preferences saved!')
    }

    const handleSavePreferences = async () => {
        setSaving(true)
        // TODO: Implement preferences API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSaving(false)
        alert('Preferences saved!')
    }

    if (!user) {
        return (
            <div className="p-8 text-center text-gray-500">
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
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                </div>
                <p className="text-gray-600">
                    Manage your account settings and preferences
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="profile">
                        <User className="h-4 w-4 mr-2" />
                        Profile
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
                                    <p className="text-sm text-gray-500">Receive email updates about your account</p>
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
                                    <p className="text-sm text-gray-500">Get notified about new market opportunities</p>
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
                                    <p className="text-sm text-gray-500">Alert when high-value works become public domain</p>
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
                                    <p className="text-sm text-gray-500">Weekly summary of top opportunities</p>
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
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
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
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Separator />
                            <Button onClick={handleSavePreferences} disabled={saving}>
                                <Save className="h-4 w-4 mr-2" />
                                {saving ? 'Saving...' : 'Save Preferences'}
                            </Button>
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

                {/* Security Tab */ }
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

    {/* Notifications Tab */ }
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
                        <p className="text-sm text-gray-500">Receive email updates about your account</p>
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
                        <p className="text-sm text-gray-500">Get notified about new market opportunities</p>
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
                        <p className="text-sm text-gray-500">Alert when high-value works become public domain</p>
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
                        <p className="text-sm text-gray-500">Weekly summary of top opportunities</p>
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

    {/* Preferences Tab */ }
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
                                <SelectItem value="es">Español</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
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
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
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

    {/* Billing Tab */ }
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
                            <p className="text-2xl font-bold">$0<span className="text-sm font-normal text-gray-500">/month</span></p>
                            <p className="text-gray-500">Essential tools for public domain research.</p>
                        </div>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center"><span className="mr-2 text-green-500">✓</span> Basic Search</li>
                            <li className="flex items-center"><span className="mr-2 text-green-500">✓</span> 5 Viability Checks/day</li>
                            <li className="flex items-center"><span className="mr-2 text-green-500">✓</span> Community Support</li>
                        </ul>
                        <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="border border-indigo-200 bg-indigo-50 rounded-lg p-6 space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs px-3 py-1 rounded-bl-lg">POPULAR</div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-xl text-indigo-900">Pro Hunter</h3>
                            <p className="text-2xl font-bold text-indigo-900">$29<span className="text-sm font-normal text-indigo-600">/month</span></p>
                            <p className="text-indigo-700">Advanced tools for serious sellers.</p>
                        </div>
                        <ul className="space-y-2 text-sm text-indigo-800">
                            <li className="flex items-center"><span className="mr-2 text-indigo-500">✓</span> Unlimited Search</li>
                            <li className="flex items-center"><span className="mr-2 text-indigo-500">✓</span> Unlimited Viability Checks</li>
                            <li className="flex items-center"><span className="mr-2 text-indigo-500">✓</span> Market Signals & Trends</li>
                            <li className="flex items-center"><span className="mr-2 text-indigo-500">✓</span> Priority Support</li>
                        </ul>
                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={async () => {
                                try {
                                    setSaving(true);
                                    // Replace with your actual Stripe Price ID
                                    const priceId = 'price_1234567890';
                                    const response = await fetch('/api/billing/checkout', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
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
                    <p className="text-sm text-gray-500 mb-4">
                        Already have a subscription? Manage your payment methods and billing history.
                    </p>
                    <Button
                        variant="outline"
                        onClick={async () => {
                            try {
                                setSaving(true);
                                const response = await fetch('/api/billing/portal', {
                                    method: 'POST',
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
            </Tabs >
        </div >
    )
}
