'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import axios from 'axios'

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

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }, [])

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await axios.get('/api/auth/me')
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem('token')
          delete axios.defaults.headers.common['Authorization']
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      })

      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`

      // Get user info
      const userResponse = await axios.get('/api/auth/me')
      setUser(userResponse.data)
    } catch (error) {
      throw new Error('Invalid credentials')
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      await axios.post('/api/auth/register', userData)
    } catch (error) {
      throw new Error('Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
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
