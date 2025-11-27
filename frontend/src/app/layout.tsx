import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

// Load ClientLayout with ssr: false to prevent any SSR issues
const ClientLayout = dynamic(() => import('./layout.client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
    </div>
  )
})

export const metadata: Metadata = {
  title: 'Public Domain Hunter',
  description: 'Track and analyze public domain works',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-dark-950 text-white font-sans antialiased selection:bg-primary-500/30">
        <ErrorBoundary>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
