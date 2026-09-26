import Link from 'next/link'
import { ArrowLeft, Radar } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center text-center">
      <Radar className="h-10 w-10 text-violet-300" />
      <h1 className="mt-5 text-3xl font-bold text-white">Nothing on the radar here.</h1>
      <p className="mt-3 text-sm leading-6 text-slate-500">This route was either removed in the v2 rebuild or never existed.</p>
      <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-400"><ArrowLeft className="h-4 w-4" /> Back to radar</Link>
    </div>
  )
}
