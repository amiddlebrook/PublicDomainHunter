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
    LogOut,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Market Intelligence', href: '/search', icon: Search },
    { name: 'Viability Lab', href: '/viability', icon: Sparkles },
    { name: 'Asset Inspector', href: '/works', icon: Database },
    { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
    { name: 'AI Insights', href: '/ai-insights', icon: Sparkles },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'Upload', href: '/upload', icon: Upload },
]

interface SidebarProps {
    open: boolean
    setOpen: (open: boolean) => void
    collapsed?: boolean
    setCollapsed?: (collapsed: boolean) => void
}

export function Sidebar({ open, setOpen, collapsed, setCollapsed }: SidebarProps) {
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
                    'fixed inset-y-0 left-0 z-50 bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col',
                    open ? 'translate-x-0 w-72' : '-translate-x-full w-72',
                    collapsed ? 'lg:w-20' : 'lg:w-72'
                )}
            >
                {/* Header */}
                <div className={clsx("flex h-16 shrink-0 items-center px-6 bg-slate-950", collapsed ? "justify-center" : "justify-between")}>
                    <div className="flex items-center gap-2 font-semibold text-white">
                        <div className="h-8 w-8 rounded bg-indigo-500 flex items-center justify-center shrink-0">
                            <Database className="h-5 w-5 text-white" />
                        </div>
                        {!collapsed && <span className="text-lg tracking-tight whitespace-nowrap opacity-100 transition-opacity duration-300">PD Hunter</span>}
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
                <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-6 gap-y-8 scrollbar-none">
                    <div>
                        {!collapsed && (
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2 whitespace-nowrap">
                                Workspace
                            </div>
                        )}
                        <ul className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            title={collapsed ? item.name : undefined}
                                            className={clsx(
                                                'group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white border-l-2 border-transparent',
                                                collapsed && 'justify-center px-2'
                                            )}
                                        >
                                            <item.icon className={clsx('h-5 w-5 shrink-0', isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-white')} />
                                            {!collapsed && <span className="whitespace-nowrap">{item.name}</span>}
                                        </Link>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>

                    <div className="mt-auto">
                        {!collapsed && (
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-2 whitespace-nowrap">
                                System
                            </div>
                        )}
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href="/settings"
                                    title={collapsed ? "Settings" : undefined}
                                    className={clsx(
                                        "group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l-2 border-transparent",
                                        collapsed && 'justify-center px-2'
                                    )}
                                >
                                    <Settings className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-white" />
                                    {!collapsed && <span className="whitespace-nowrap">Settings</span>}
                                </Link>
                            </li>
                            <li>
                                <button
                                    onClick={() => logout()}
                                    title={collapsed ? "Sign out" : undefined}
                                    className={clsx(
                                        "w-full group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors border-l-2 border-transparent text-left",
                                        collapsed && 'justify-center px-2'
                                    )}
                                >
                                    <LogOut className="h-5 w-5 shrink-0 text-slate-500 group-hover:text-white" />
                                    {!collapsed && <span className="whitespace-nowrap">Sign out</span>}
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                {/* Collapse Toggle (Desktop Only) */}
                <div className="hidden lg:flex p-4 border-t border-slate-800 justify-end">
                    <button
                        onClick={() => setCollapsed && setCollapsed(!collapsed)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-5 w-5" />
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider">
                                <span className="mr-2">Collapse</span>
                                <ChevronLeft className="h-4 w-4" />
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}
