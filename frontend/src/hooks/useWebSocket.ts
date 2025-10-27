import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface WebSocketMessage {
  type: string
  timestamp: string
  data: any
  notification_type?: string
}

interface UseWebSocketReturn {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  messages: WebSocketMessage[]
  sendMessage: (message: any) => void
  clearMessages: () => void
  reconnect: () => void
  lastMessage: WebSocketMessage | null
}

export const useWebSocket = (url?: string): UseWebSocketReturn => {
  const { user } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const websocketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const defaultUrl = user ? `/api/ws/ws/${user.id}` : null
  const wsUrl = url || defaultUrl

  const connect = useCallback(() => {
    if (!wsUrl || !user) {
      setConnectionStatus('disconnected')
      return
    }

    try {
      setConnectionStatus('connecting')
      const ws = new WebSocket(`ws://localhost:8000${wsUrl}`)

      ws.onopen = () => {
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setMessages(prev => [...prev.slice(-99), message]) // Keep last 100 messages
          setLastMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setConnectionStatus('disconnected')
        websocketRef.current = null

        console.log('WebSocket disconnected:', event.code, event.reason)

        // Attempt to reconnect if it wasn't a manual disconnect
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectAttempts.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      }

      ws.onerror = (error) => {
        setConnectionStatus('error')
        console.error('WebSocket error:', error)
      }

      websocketRef.current = ws
    } catch (error) {
      setConnectionStatus('error')
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [wsUrl, user])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Manual disconnect')
      websocketRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setLastMessage(null)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttempts.current = 0
    setTimeout(connect, 100)
  }, [connect, disconnect])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [])

  return {
    isConnected,
    connectionStatus,
    messages,
    sendMessage,
    clearMessages,
    reconnect,
    lastMessage
  }
}
