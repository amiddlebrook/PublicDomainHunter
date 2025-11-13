import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Load ClientLayout with ssr: false to prevent any SSR issues
const ClientLayout = dynamic(() => import('./layout.client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  )
})

export const metadata: Metadata = {
  title: 'Public Domain Hunter',
  description: 'Track and analyze public domain works',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <ErrorBoundary>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
