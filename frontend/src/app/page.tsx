'use client'

import dynamic from 'next/dynamic'

const Dashboard = dynamic(() => import('./dashboard.client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-96">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
    </div>
  ),
})

export default function HomePage() {
  return <Dashboard />
}
