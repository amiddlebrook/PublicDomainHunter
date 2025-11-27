'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ExternalLink } from 'lucide-react'
import { Button } from './ui/button'

interface StatsSourceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sources: {
        database: number
        gutenberg: number
        archive: number
    }
    total: string
}

export function StatsSourceModal({ open, onOpenChange, sources, total }: StatsSourceModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-dark-900 border-dark-800">
                <DialogHeader>
                    <DialogTitle className="text-white">Total Works: {total}</DialogTitle>
                    <DialogDescription>
                        Real-time data aggregated from multiple public domain sources
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Internal Database</p>
                            <p className="text-sm text-gray-400">Works in our catalog</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-indigo-400">{sources.database.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Project Gutenberg</p>
                            <p className="text-sm text-gray-400">Books via Gutendex API</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-400">{sources.gutenberg.toLocaleString()}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1"
                                onClick={() => window.open('https://gutenberg.org', '_blank')}
                            >
                                Visit <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Internet Archive</p>
                            <p className="text-sm text-gray-400">Public domain texts</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-pink-400">{sources.archive.toLocaleString()}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-1"
                                onClick={() => window.open('https://archive.org', '_blank')}
                            >
                                Visit <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-dark-700">
                        <p className="text-sm text-gray-500">
                            Data updated every 6 hours. Sources are queried in real-time via their public APIs.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
