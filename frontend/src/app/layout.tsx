import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import ClientLayout from './layout.client'

export const metadata: Metadata = {
  title: 'Public Domain Hunter — Opportunity Radar',
  description: 'Discover commercially interesting public-domain works using evidence-first research signals.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-950 text-white antialiased selection:bg-violet-500/30">
        <ErrorBoundary>
          <ClientLayout>{children}</ClientLayout>
        </ErrorBoundary>
      </body>
    </html>
  )
}
