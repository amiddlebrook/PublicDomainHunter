'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import {
    Search,
    Database,
    Briefcase,
    Upload,
    FileBarChart,
    Settings,
    Sparkles,
    LayoutDashboard,
    X,
    LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Market Intelligence', href: '/search', icon: Search },
    { name: 'Asset Inspector', href: '/works', icon: Database },
    { name: 'Viability Lab', href: '/viability', icon: Sparkles },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'Upload', href: '/upload', icon: Upload },
]

interface SidebarProps {
    open: boolean
    setOpen: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
    const pathname = usePathname()
    const { logout } = useAuth()

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={clsx(
                    'fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm transition-opacity lg:hidden',
                    open ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setOpen(false)}
            />

            {/* Sidebar container */}
            <div
                className={clsx(
                    'fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:w-72 lg:flex-col',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-slate-950">
                    <div className="flex items-center gap-2 font-semibold text-white">
                        <div className="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center">
                            <Database className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg tracking-tight">PD Hunter</span>
                    </div>
                    <button
                        type="button"
                        className="lg:hidden text-slate-400 hover:text-white"
                        onClick={() => setOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6 gap-y-8">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2">
                            Workspace
                        </div>
                        <ul className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className={clsx(
                                                'group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-2 border-transparent'
                                            )}
                                        >
                                            <item.icon className={clsx('h-5 w-5 shrink-0', isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-white')} />
                                            {item.name}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    <div className="mt-auto">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2">
                            System
                        </div>
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href="/settings"
                                    className="group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l-2 border-transparent"
                                >
                                    <Settings className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-white" />
                                    Settings
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={() => logout()}
                                    className="w-full group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l-2 border-transparent text-left"
                                >
                                    <LogOut className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-white" />
                                    Sign out
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>
        </>
    )
}
