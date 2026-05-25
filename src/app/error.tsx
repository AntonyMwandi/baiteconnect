'use client'
// src/app/error.tsx
import { useEffect } from 'react'
import Link          from 'next/link'

export default function ErrorPage({
  error,
  reset,
}: {
  error:  Error & { digest?: string }
  reset:  () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-neutralDark mb-2">Something went wrong</h1>
      <p className="text-gray-500 max-w-sm leading-relaxed mb-2">
        An unexpected error occurred. Please try again. If the problem persists, contact the County ICT Department.
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-gray-400 mb-6 bg-gray-100 px-3 py-1.5 rounded-lg">
          Error ID: {error.digest}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-meruGreen text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-900 transition-colors"
        >
          🔄 Try Again
        </button>
        <Link href="/"
          className="bg-white border border-gray-200 text-neutralDark font-medium px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          🏠 Go Home
        </Link>
      </div>
    </div>
  )
}
