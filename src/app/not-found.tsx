// src/app/not-found.tsx
import Link  from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-20 h-20 bg-white rounded-full shadow-card overflow-hidden mx-auto mb-6">
        <Image src="/meru-logo.jpeg" alt="Meru County" width={80} height={80} className="object-contain" />
      </div>

      <h1 className="text-6xl font-bold text-meruGreen mb-3">404</h1>
      <h2 className="text-xl font-semibold text-neutralDark mb-3">Page Not Found</h2>
      <p className="text-gray-500 max-w-sm leading-relaxed mb-8">
        The page you are looking for does not exist or may have been moved.
        Return to the BaiteConnect portal to continue participating.
      </p>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/"
          className="bg-meruGreen text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-900 transition-colors">
          🏠 Back to Home
        </Link>
        <Link href="/submit"
          className="bg-meruGold text-meruGreen font-semibold px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
          📝 Submit a Memo
        </Link>
      </div>

      <p className="text-xs text-gray-400 mt-8">
        County Government of Meru · baiteconnect.meru.go.ke
      </p>
    </div>
  )
}
