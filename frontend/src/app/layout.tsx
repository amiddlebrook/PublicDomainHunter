import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import ClientLayout from './layout.client'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
