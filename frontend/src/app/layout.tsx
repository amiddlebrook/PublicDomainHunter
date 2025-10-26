import './globals.css'
import type { ReactNode } from 'react'
import ClientLayout from './layout.client'
import { AuthProvider } from '@/contexts/AuthContext'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
