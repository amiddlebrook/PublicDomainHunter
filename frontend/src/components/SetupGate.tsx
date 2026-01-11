'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSetup } from '@/contexts/SetupContext'
import { Loader2, Key, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SetupGateProps {
  children: React.ReactNode
}

// Pages that don't require setup to be completed
const EXEMPT_PATHS = [
  '/login',
  '/register',
  '/setup',
  '/auth',
  '/forgot-password',
  '/reset-password'
]

export function SetupGate({ children }: SetupGateProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { setupCompleted, loading: setupLoading, requiresSetup } = useSetup()

  // Check if current path is exempt from setup requirement
  const isExemptPath = EXEMPT_PATHS.some(path => pathname?.startsWith(path))

  // Show loading state while checking auth and setup status
  if (authLoading || (isAuthenticated && setupLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If path is exempt, render children without gate
  if (isExemptPath) {
    return <>{children}</>
  }

  // If not authenticated, render children (login page will handle redirect)
  if (!isAuthenticated) {
    return <>{children}</>
  }

  // If setup is required, show the setup gate overlay
  if (requiresSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/20">
            <Key className="h-10 w-10 text-indigo-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Setup Required</h1>
            <p className="text-gray-400">
              To use Public Domain Hunter, you need to add at least one AI API key.
              This gives you access to powerful AI-powered analysis and content generation features.
            </p>
          </div>

          <div className="bg-dark-800/50 rounded-lg p-4 border border-dark-700 text-left space-y-3">
            <h3 className="font-medium text-white">Why do I need an API key?</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-1">1.</span>
                <span>You pay AI providers directly - no markups or hidden fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-1">2.</span>
                <span>Your data stays between you and the AI provider</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-indigo-400 mt-1">3.</span>
                <span>Choose from multiple providers (OpenAI, Claude, Gemini, etc.)</span>
              </li>
            </ul>
          </div>

          <Link href="/setup">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>

          <p className="text-xs text-gray-500">
            Already have API keys? Setup takes less than 2 minutes.
          </p>
        </div>
      </div>
    )
  }

  // Setup is complete, render children
  return <>{children}</>
}
