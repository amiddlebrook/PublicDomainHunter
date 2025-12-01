import './globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Public Domain Hunter - OAuth Test',
  description: 'OAuth authentication test page',
}

export default function OAuthLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-dark-950 text-white font-sans antialiased selection:bg-primary-500/30">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
