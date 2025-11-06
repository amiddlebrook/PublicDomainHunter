import WorkDetailClient from './WorkDetailClient'

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
  // For a production build, you would fetch all work IDs here if the API is accessible
  // Example:
  // try {
  //   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/works?limit=1000`)
  //   const works = await response.json()
  //   return works.map((work: any) => ({ id: work.id.toString() }))
  // } catch (error) {
  //   console.error('Could not fetch works for static generation:', error)
  // }

  // Return a placeholder page to satisfy Next.js static export requirements
  // The actual page content will be loaded client-side
  return [
    { id: '1' }
  ]
}
