'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { API_BASE_URL } from '@/lib/utils'

export default function OAuthTestPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
    const oauthError = searchParams.get('error')
    const oauthSuccess = searchParams.get('success')
    
    if (oauthError) {
      setError(`OAuth Error: ${oauthError}`)
    } else if (oauthSuccess) {
      setSuccess(`OAuth Success: ${oauthSuccess}`)
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
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>OAuth Authentication Test</h1>
      <p>This page tests OAuth without AuthContext complications.</p>
      
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#c00'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#efe', 
          border: '1px solid #cfc', 
          borderRadius: '4px',
          marginBottom: '20px',
          color: '#0c0'
        }}>
          <strong>✅ Success:</strong> {success}
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2>Test OAuth Login:</h2>
        <button 
          onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '12px', 
            margin: '10px 0',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔐 Login with Google
        </button>
        
        <button 
          onClick={() => window.location.href = `${API_BASE_URL}/auth/github`}
          style={{ 
            display: 'block', 
            width: '100%', 
            padding: '12px', 
            margin: '10px 0',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔐 Login with GitHub
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Debug Information:</h3>
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px' }}>
          <p><strong>API Base URL:</strong> {API_BASE_URL}</p>
          <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          <p><strong>Error Param:</strong> {searchParams.get('error') || 'none'}</p>
          <p><strong>Success Param:</strong> {searchParams.get('success') || 'none'}</p>
          <p><strong>All Params:</strong> {JSON.stringify(Object.fromEntries(searchParams.entries()))}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Links:</h3>
        <a href="/oauth-test?error=oauth_failed" style={{ display: 'block', color: 'blue', margin: '5px 0' }}>
          Test Error Display
        </a>
        <a href="/oauth-test?success=login_complete" style={{ display: 'block', color: 'green', margin: '5px 0' }}>
          Test Success Display
        </a>
        <a href="/simple-login" style={{ display: 'block', color: 'blue', margin: '5px 0' }}>
          ← Simple Login (with AuthContext)
        </a>
      </div>

      <div>
        <a href="/" style={{ color: '#666' }}>
          ← Back to Main Site
        </a>
      </div>
    </div>
  )
}
