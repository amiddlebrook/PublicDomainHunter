'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function NotFound() {
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        // For work detail routes, force client-side rendering by staying on the route
        if (pathname?.startsWith('/works/') && pathname !== '/works') {
            // The page will render via the dynamic route at /works/[id]
            // Just refresh to trigger the client component
            router.replace(pathname)
        }
    }, [pathname, router])

    // Return null to avoid flash, the router will handle the redirect
    return null
}
