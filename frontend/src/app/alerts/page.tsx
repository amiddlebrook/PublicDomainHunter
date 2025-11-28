'use client'

import { API_BASE_URL } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface Alert {
  id: number
  user_id: number
  work_id: number
  alert_type: string
  threshold_value?: number
  is_active: boolean
  created_at: string
  updated_at?: string
  work?: {
    id: number
    title: string
    author: string
    media_type: string
  }
}

const alertTypes = [
  {
    value: 'new_work',
    label: 'New Public Domain Work',
    description: 'Get notified when new works enter the public domain',
    icon: BookOpen,
    color: 'blue'
  },
  {
    value: 'trend_change',
    label: 'Trend Score Change',
    description: 'Alert when a work\'s trend score exceeds threshold',
    icon: TrendingUp,
    color: 'green'
  },
  {
    value: 'competition_change',
    label: 'Competition Change',
    description: 'Notify when competition levels change significantly',
    icon: AlertTriangle,
    color: 'yellow'
  },
  {
    value: 'monetization_opportunity',
    label: 'Monetization Opportunity',
    description: 'Alert for high monetization potential works',
    icon: DollarSign,
    color: 'purple'
  }
]

export default function AlertsPage() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedWork, setSelectedWork] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [thresholdValue, setThresholdValue] = useState('')
  const [works, setWorks] = useState<any[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      fetchAlerts()
      fetchWorks()
    }
  }, [user])

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`)
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/works?limit=100`)
      if (response.ok) {
        const data = await response.json()
        setWorks(data)
      }
    } catch (error) {
      console.error('Error fetching works:', error)
    }
  }

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedWork || !selectedType) {
      setError('Please select a work and alert type')
      return
    }

    try {
      const alertData = {
        work_id: parseInt(selectedWork),
        alert_type: selectedType,
        threshold_value: thresholdValue ? parseFloat(thresholdValue) : null,
        is_active: true
      }

      const response = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })

      if (response.ok) {
        setSuccess('Alert created successfully!')
        setShowCreateForm(false)
        setSelectedWork('')
        setSelectedType('')
        setThresholdValue('')
        fetchAlerts()
      } else {
        const errorData = await response.json()
        setError(errorData.detail || 'Failed to create alert')
      }
    } catch (error) {
      setError('Failed to create alert')
    }
  }

  const handleDeleteAlert = async (alertId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Alert deleted successfully!')
        fetchAlerts()
      } else {
        setError('Failed to delete alert')
      }
    } catch (error) {
      setError('Failed to delete alert')
    }
  }

  const getAlertTypeInfo = (type: string) => {
    return alertTypes.find(t => t.value === type) || alertTypes[0]
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="success" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Inactive
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Alert Management</h1>
          <p className="mt-2 text-gray-300">
            Create and manage alerts for public domain works and opportunities.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Alert</CardTitle>
            <CardDescription>
              Set up notifications for specific works or market conditions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Work
                </label>
                <Select value={selectedWork} onValueChange={setSelectedWork}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a work to monitor" />
                  </SelectTrigger>
                  <SelectContent>
                    {works.map((work) => (
                      <SelectItem key={work.id} value={work.id.toString()}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{work.title}</div>
                            <div className="text-sm text-gray-300">{work.author}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alert Type
                </label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose alert type" />
                  </SelectTrigger>
                  <SelectContent>
                    {alertTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-300">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {(selectedType === 'trend_change' || selectedType === 'competition_change' || selectedType === 'monetization_opportunity') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Threshold Value
                  </label>
                  <Input
                    type="number"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    placeholder={
                      selectedType === 'trend_change' ? 'Enter trend score threshold (0-100)' :
                        selectedType === 'competition_change' ? 'Enter sales rank threshold' :
                          'Enter monetization score threshold (0-100)'
                    }
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit">Create Alert</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Your Alerts ({alerts.length})</h2>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-200 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No alerts yet</h3>
              <p className="text-gray-300 mb-4">
                Create your first alert to get notified about public domain opportunities.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert) => {
              const typeInfo = getAlertTypeInfo(alert.alert_type)
              const Icon = typeInfo.icon

              return (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-${typeInfo.color}-100`}>
                          <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white">{typeInfo.label}</h3>
                            {getStatusBadge(alert.is_active)}
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{typeInfo.description}</p>

                          {alert.work && (
                            <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                              <BookOpen className="h-4 w-4" />
                              <span>Monitoring: {alert.work.title}</span>
                              {alert.work.author && <span>by {alert.work.author}</span>}
                            </div>
                          )}

                          {alert.threshold_value && (
                            <div className="text-sm text-gray-300">
                              Threshold: {alert.threshold_value}
                              {alert.alert_type === 'trend_change' && '/100'}
                              {alert.alert_type === 'monetization_opportunity' && '/100'}
                            </div>
                          )}

                          <div className="text-xs text-gray-200 mt-1">
                            Created: {new Date(alert.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Alert Types Info */}
      <Card>
        <CardHeader>
          <CardTitle>Available Alert Types</CardTitle>
          <CardDescription>
            Learn about the different types of alerts you can create.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {alertTypes.map((type) => {
              const Icon = type.icon
              return (
                <div key={type.value} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                    <Icon className={`h-5 w-5 text-${type.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{type.label}</h4>
                    <p className="text-sm text-gray-300">{type.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
