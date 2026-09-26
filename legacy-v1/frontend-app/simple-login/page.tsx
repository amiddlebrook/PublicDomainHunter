'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { API_BASE_URL } from '@/lib/utils'

export default function SimpleLoginPage() {
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
    const oauthError = searchParams.get('error')
    if (oauthError) {
      setError(`OAuth Error: ${oauthError}`)
    }
  }, [searchParams])

  if (!mounted) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Simple Login Test</h1>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h2>Test OAuth Login:</h2>
        <button 
          onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '10px', 
            margin: '10px 0',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login with Google
        </button>
        
        <button 
          onClick={() => window.location.href = `${API_BASE_URL}/auth/github`}
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '10px', 
            margin: '10px 0',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login with GitHub
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Debug Info:</h3>
        <p>API Base URL: {API_BASE_URL}</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
        <p>Error Param: {searchParams.get('error') || 'none'}</p>
      </div>

      <div>
        <a href="/test-oauth" style={{ color: 'blue' }}>
          ← Back to Test Page
        </a>
      </div>
    </div>
  )
}
