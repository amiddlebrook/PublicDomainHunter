'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  id: number
  email: string
  username: string
  full_name?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: RegisterData) => Promise<void>
  loading: boolean
  isAuthenticated: boolean
}

interface RegisterData {
  email: string
  username: string
  password: string
  full_name?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const getAuthHeaders = () => {
    const headers = new Headers()
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  }

  const fetchWithAuth = async (input: RequestInfo, init: RequestInit = {}) => {
    const headers = new Headers(init.headers || {})
    const tokenHeaders = getAuthHeaders()
    tokenHeaders.forEach((value, key) => {
      if (!headers.has(key)) {
        headers.set(key, value)
      }
    })

    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    const response = await fetch(input, { ...init, headers })
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }
    return response
  }

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetchWithAuth('/api/auth/me')
          const data = await response.json()
          setUser(data)
        } catch (error) {
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        throw new Error('Invalid credentials')
      }

      const { access_token } = await response.json()
      localStorage.setItem('token', access_token)

      // Get user info
      const userResponse = await fetchWithAuth('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      const userData = await userResponse.json()
      setUser(userData)
    } catch (error) {
      throw new Error('Invalid credentials')
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }
    } catch (error) {
      throw new Error('Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
