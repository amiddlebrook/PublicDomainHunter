'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import clsx from 'clsx'
import {
  BookOpen,
  Search,
  TrendingUp,
  Bell,
  User,
  Menu,
  X,
  Home,
  BarChart3,
  Settings,
  LogOut,
  Upload,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'

// Load RealTimeNotification only on client side to avoid SSR/hydration issues
const RealTimeNotification = dynamic(
  () => import('@/components/RealTimeNotification'),
  { ssr: false }
)

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Works', href: '/works', icon: BookOpen },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Trends', href: '/trends', icon: TrendingUp },
  { name: 'Alerts', href: '/alerts', icon: Bell },
]

interface ClientLayoutProps {
  children: ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure we're on the client before rendering
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a minimal loading state during SSR
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <ClientLayoutContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen}>{children}</ClientLayoutContent>
}

interface ClientLayoutContentProps extends ClientLayoutProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  userMenuOpen: boolean
  setUserMenuOpen: (open: boolean) => void
}

function ClientLayoutContent({ children, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, userMenuOpen, setUserMenuOpen }: ClientLayoutContentProps) {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-foreground">
                {navigation.find((item) => item.href === pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <RealTimeNotification />
                {isAuthenticated && user ? (
                  <div className="relative">
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full bg-card p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden lg:flex lg:items-center">
                        <span className="text-sm font-medium text-foreground" aria-hidden="true">
                          {user.username}
                        </span>
                      </span>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border">
                        <div className="border-b border-border px-4 py-2 text-sm text-foreground">
                          <div className="font-medium">{user.full_name || user.username}</div>
                          <div className="text-muted-foreground">{user.email}</div>
                        </div>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <LogOut className="mr-2 inline h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
