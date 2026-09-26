'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function TestOAuthPage() {
  const [message, setMessage] = useState('Loading...')
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      setMessage(`OAuth Error Detected: ${error}`)
    } else {
      setMessage('OAuth test page loaded successfully!')
    }
  }, [searchParams])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>OAuth Test Page</h1>
      <p>{message}</p>
      <div>
        <h2>Test OAuth Links:</h2>
        <a href="/auth/google" style={{ display: 'block', margin: '10px 0', color: 'blue' }}>
          Test Google OAuth
        </a>
        <a href="/auth/github" style={{ display: 'block', margin: '10px 0', color: 'blue' }}>
          Test GitHub OAuth
        </a>
        <a href="/login?error=oauth_failed" style={{ display: 'block', margin: '10px 0', color: 'blue' }}>
          Test Error Handling
        </a>
      </div>
      <div>
        <h2>Environment Info:</h2>
        <p>API Base URL: {process.env.NEXT_PUBLIC_API_BASE_URL || 'https://publicdomainhunter.com'}</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      </div>
    </div>
  )
}
