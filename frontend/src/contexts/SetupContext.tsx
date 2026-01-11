'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { API_BASE_URL } from '../lib/utils'
import { useAuth } from './AuthContext'

interface SetupStatus {
  setupCompleted: boolean
  configuredProviders: string[]
  loading: boolean
  error: string | null
}

interface SetupContextType extends SetupStatus {
  refreshSetupStatus: () => Promise<void>
  requiresSetup: boolean
}

const SetupContext = createContext<SetupContextType | undefined>(undefined)

export const useSetup = () => {
  const context = useContext(SetupContext)
  if (context === undefined) {
    throw new Error('useSetup must be used within a SetupProvider')
  }
  return context
}

interface SetupProviderProps {
  children: ReactNode
}

export const SetupProvider: React.FC<SetupProviderProps> = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    setupCompleted: false,
    configuredProviders: [],
    loading: true,
    error: null
  })

  const fetchSetupStatus = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSetupStatus({
        setupCompleted: false,
        configuredProviders: [],
        loading: false,
        error: null
      })
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/user/setup-status`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setSetupStatus({
          setupCompleted: data.setupCompleted,
          configuredProviders: data.configuredProviders || [],
          loading: false,
          error: null
        })
      } else {
        setSetupStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch setup status'
        }))
      }
    } catch (error) {
      console.error('Failed to fetch setup status:', error)
      setSetupStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch setup status'
      }))
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (!authLoading) {
      fetchSetupStatus()
    }
  }, [authLoading, fetchSetupStatus])

  const refreshSetupStatus = async () => {
    setSetupStatus(prev => ({ ...prev, loading: true }))
    await fetchSetupStatus()
  }

  // User requires setup if they're authenticated but haven't completed setup
  const requiresSetup = isAuthenticated && !setupStatus.loading && !setupStatus.setupCompleted

  const value: SetupContextType = {
    ...setupStatus,
    refreshSetupStatus,
    requiresSetup
  }

  return (
    <SetupContext.Provider value={value}>
      {children}
    </SetupContext.Provider>
  )
}
