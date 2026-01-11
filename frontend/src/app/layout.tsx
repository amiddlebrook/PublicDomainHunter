import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { SetupProvider } from '@/contexts/SetupContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SetupGate } from '@/components/SetupGate'
import ClientLayout from './layout.client'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

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
            <SetupProvider>
              <SetupGate>
                <ClientLayout>{children}</ClientLayout>
              </SetupGate>
            </SetupProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
