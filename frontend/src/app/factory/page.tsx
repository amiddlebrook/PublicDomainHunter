'use client'

import { Construction, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function FactoryPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="p-4 bg-indigo-500/10 rounded-full">
                <Construction className="h-12 w-12 text-indigo-500" />
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">The Factory is Under Construction</h1>
                <p className="text-gray-200 max-w-md mx-auto">
                    We're building the ultimate product creation engine. Soon you'll be able to turn public domain assets into sellable products instantly.
                </p>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" asChild>
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
                <Button disabled>
                    Enter Studio (Coming Soon)
                </Button>
            </div>
        </div>
    )
}
