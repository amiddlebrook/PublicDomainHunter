import WorkDetailClient from './WorkDetailClient'

// Enable dynamic parameters at runtime (for external work IDs)
export const dynamicParams = true

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function WorkDetailPage({ params }: PageProps) {
  const { id } = await params

  return <WorkDetailClient workId={id} />
}

// This function is required for static export with dynamic routes
// It generates the list of all possible [id] values at build time
export async function generateStaticParams() {
  // Fetch all work IDs from the API at build time
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://publicdomainhunter.averymiddlebrook2014.workers.dev'
    const response = await fetch(`${apiUrl}/api/works?limit=1000`)

    if (response.ok) {
      const data = await response.json()
      const works = Array.isArray(data) ? data : (data.works || [])

      if (works.length > 0) {
        return works.map((work: any) => ({ id: work.id.toString() }))
      }
    }
  } catch (error) {
    console.error('Could not fetch works for static generation:', error)
  }

  // Fallback: return at least a few pages if API is unreachable
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
    { id: '8' },
    { id: '9' },
    { id: '10' }
  ]
}
