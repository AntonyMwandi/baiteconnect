// src/app/contact/page.tsx
import type { Metadata } from 'next'
import { Card }          from '@/components/ui'
import Link              from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us — BaiteConnect Meru County',
  description: 'Get in touch with the County Government of Meru regarding BaiteConnect and public participation.',
}

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="bg-meru-header rounded-2xl px-6 py-8 text-white">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-2">County Government of Meru</p>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-white/80 leading-relaxed max-w-xl">
          Reach the Department of Finance, Economic Planning &amp; ICT for support with BaiteConnect, submission queries, or general public participation enquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Primary contacts */}
        <Card className="p-6">
          <h2 className="font-bold text-neutralDark text-lg mb-4">📍 County Offices</h2>
          <div className="space-y-4 text-sm">
            {[
              { icon: '🏛️', label: 'Physical address', value: 'County Government Headquarters\nMeru Town, Kenya' },
              { icon: '📮', label: 'Postal address',    value: 'P.O. Box 120 – 60200\nMeru, Kenya' },
              { icon: '📧', label: 'Budget & Finance',  value: 'budget.finance@meru.go.ke' },
              { icon: '🌐', label: 'County website',    value: 'www.meru.go.ke', link: 'https://www.meru.go.ke' },
            ].map(c => (
              <div key={c.label} className="flex gap-3">
                <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{c.label}</p>
                  {c.link ? (
                    <a href={c.link} target="_blank" rel="noopener noreferrer"
                      className="text-meruGreen hover:underline font-medium">{c.value}</a>
                  ) : (
                    <p className="text-neutralDark whitespace-pre-line">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* BaiteConnect support */}
        <Card className="p-6">
          <h2 className="font-bold text-neutralDark text-lg mb-4">💻 BaiteConnect Support</h2>
          <div className="space-y-4 text-sm">
            {[
              { icon: '📱', label: 'USSD channel',       value: 'Dial *384# on any network\n(No internet required)' },
              { icon: '📲', label: 'SMS OTP issues',      value: 'Powered by Africa\'s Talking\nContact IT if SMS not received' },
              { icon: '🔐', label: 'Admin access',        value: 'Contact County ICT Department\nfor role assignment requests' },
              { icon: '🐛', label: 'Technical issues',    value: 'ict@meru.go.ke', link: 'mailto:ict@meru.go.ke' },
            ].map(c => (
              <div key={c.label} className="flex gap-3">
                <span className="text-xl shrink-0 mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-0.5">{c.label}</p>
                  {c.link ? (
                    <a href={c.link} className="text-meruGreen hover:underline font-medium">{c.value}</a>
                  ) : (
                    <p className="text-neutralDark whitespace-pre-line">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Sub-county offices */}
        <Card className="p-6 sm:col-span-2">
          <h2 className="font-bold text-neutralDark text-lg mb-4">🗺️ Sub-County Offices</h2>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            For in-person public participation assistance, visit your nearest sub-county office. Staff can help with memo submission, OTP verification issues, and project queries.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              'Igembe North', 'Igembe Central', 'Igembe South',
              'Tigania West', 'Tigania East', 'Central Imenti',
              'North Imenti', 'South Imenti', 'Buuri',
            ].map(sc => (
              <div key={sc} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm">
                <span className="text-meruGreen text-xs">📍</span>
                <span className="font-medium text-neutralDark">{sc}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* USSD info */}
        <Card className="p-6 bg-meruGreen text-white sm:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-5xl">📲</div>
            <div className="flex-1">
              <h3 className="font-bold text-xl mb-1">No smartphone? No problem.</h3>
              <p className="text-white/80 leading-relaxed">
                Access BaiteConnect on any feature phone by dialling <strong className="text-meruGold">*384#</strong>.
                Works on Safaricom, Airtel, and Telkom. No internet bundles needed.
                You can vote on ward priorities and check project status — completely free.
              </p>
            </div>
            <div className="bg-meruGold text-meruGreen font-bold text-2xl px-6 py-4 rounded-2xl shrink-0 shadow-lg">
              *384#
            </div>
          </div>
        </Card>
      </div>

      {/* Back links */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link href="/" className="text-sm text-meruGreen border border-meruGreen/30 px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors">
          ← Back to Portal
        </Link>
        <Link href="/about" className="text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          About BaiteConnect
        </Link>
        <Link href="/privacy" className="text-sm text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Privacy Policy
        </Link>
      </div>
    </div>
  )
}
