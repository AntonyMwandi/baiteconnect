// src/app/offline/page.tsx
// Shown by the service worker when user is offline and page isn't cached

import Link  from 'next/link'
import Image from 'next/image'

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-20 h-20 bg-white rounded-full shadow-card overflow-hidden mx-auto mb-6">
        <Image src="/meru-logo.jpeg" alt="Meru County" width={80} height={80} className="object-contain" />
      </div>

      <div className="text-5xl mb-4">📶</div>
      <h1 className="text-2xl font-bold text-neutralDark mb-2">You are offline</h1>
      <p className="text-gray-500 max-w-sm leading-relaxed mb-6">
        BaiteConnect requires an internet connection to load new content.
        Any memos you have drafted will be automatically submitted when you reconnect.
      </p>

      <div className="bg-meruGreen/5 border border-meruGreen/20 rounded-2xl p-5 max-w-sm w-full mb-6">
        <p className="text-sm font-semibold text-meruGreen mb-2">📲 No internet? Use USSD</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Dial <strong className="text-meruGreen font-mono">*384#</strong> on any network — no data bundles needed.
          Check project status, ward rankings, and view your submission reference code.
        </p>
      </div>

      <Link
        href="/"
        className="bg-meruGreen text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-900 transition-colors"
      >
        Try Again
      </Link>
    </div>
  )
}
