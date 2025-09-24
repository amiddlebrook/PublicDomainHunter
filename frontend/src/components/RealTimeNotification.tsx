'use client'

import { useState, useEffect } from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  TrendingUp,
  BookOpen,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { format } from 'date-fns'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

interface RealTimeNotificationProps {
  className?: string
}

export default function RealTimeNotification({ className }: RealTimeNotificationProps) {
  const { user } = useAuth()
  const { isConnected, connectionStatus, messages, clearMessages, reconnect } = useWebSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (messages.length > 0) {
      const newNotifications = messages
        .filter(msg => msg.type === 'notification')
        .map((msg, index) => ({
          id: `${msg.timestamp}-${index}`,
          type: msg.notification_type || 'info',
          title: getNotificationTitle(msg),
          message: getNotificationMessage(msg),
          timestamp: msg.timestamp,
          read: false,
          data: msg.data
        }))

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 50)) // Keep last 50
      }
    }
  }, [messages])

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  const getNotificationTitle = (message: any): string => {
    switch (message.notification_type) {
      case 'alert_triggered':
        return 'Alert Triggered'
      case 'new_work':
        return 'New Public Domain Work'
      case 'analytics_update':
        return 'Analytics Updated'
      case 'system_alert':
        return 'System Alert'
      default:
        return 'Notification'
    }
  }

  const getNotificationMessage = (message: any): string => {
    const data = message.data || {}

    switch (message.notification_type) {
      case 'alert_triggered':
        return `Alert "${data.alert?.alert_type}" was triggered for "${data.work?.title}"`
      case 'new_work':
        return `New work added: "${data.title}" by ${data.author || 'Unknown'}`
      case 'analytics_update':
        return 'Your analytics have been updated with new data'
      case 'system_alert':
        return data.message || 'System notification'
      default:
        return 'You have a new notification'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert_triggered':
        return <Bell className="h-4 w-4 text-yellow-500" />
      case 'new_work':
        return <BookOpen className="h-4 w-4 text-blue-500" />
      case 'analytics_update':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'system_alert':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
    clearMessages()
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'error':
        return 'Connection Error'
      default:
        return 'Disconnected'
    }
  }

  if (!user) return null

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status Indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex items-center gap-1 text-sm ${getConnectionStatusColor()}`}>
          {isConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{getConnectionStatusText()}</span>
        </div>
        {!isConnected && (
          <Button variant="outline" size="sm" onClick={reconnect}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
        )}
      </div>

      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-hidden z-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Mark all read
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={clearAllNotifications}>
                  Clear all
                </Button>
              </div>
            </div>
            <CardDescription>
              {unreadCount > 0 ? `${unreadCount} unread` : 'No new notifications'}
            </CardDescription>
          </CardHeader>

          <CardContent className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border rounded-lg transition-colors ${
                      notification.read
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.timestamp), 'MMM d, HH:mm')}
                          </span>
                          <div className="flex gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNotification(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
