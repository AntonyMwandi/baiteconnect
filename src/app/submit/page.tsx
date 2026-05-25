// src/app/submit/page.tsx
import type { Metadata }  from 'next'
import prisma             from '@/lib/prisma'
import MemoForm           from '@/components/forms/MemoForm'
import { Card }           from '@/components/ui'

export const metadata: Metadata = {
  title: 'Submit Memo — BaiteConnect Meru County',
  description: 'Submit your budget memorandum for the MTEF FY 2026/2027 public participation process.',
}

async function getWards() {
  return prisma.ward.findMany({
    select: { id: true, wardName: true, subCounty: true },
    orderBy: [{ subCounty: 'asc' }, { wardName: 'asc' }],
  })
}

export default async function SubmitPage() {
  const wards = await getWards()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">

        {/* Left — info panel */}
        <div className="space-y-5 order-2 lg:order-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutralDark mb-2">Submit Your Budget Memorandum</h1>
            <p className="text-gray-500 leading-relaxed">
              MTEF FY 2026/2027 · County Government of Meru
            </p>
          </div>

          <Card className="p-5">
            <h2 className="font-semibold text-neutralDark mb-3">How it works</h2>
            <ol className="space-y-3">
              {[
                { step: '1', icon: '🪪', title: 'Verify your identity', body: 'Enter your National ID and phone number. A one-time SMS code confirms you\'re a real Meru County resident.' },
                { step: '2', icon: '📋', title: 'Describe your priority', body: 'Write your specific development need — be as detailed as possible. Name roads, facilities, or infrastructure you want addressed.' },
                { step: '3', icon: '💰', title: 'Balance the budget', body: 'Use the 100-Shilling tool to show how you\'d split county spending. Your choices inform the planning team\'s resource allocation.' },
                { step: '4', icon: '📱', title: 'Get your reference SMS', body: 'Receive a confirmation SMS with a unique reference code. You\'ll be notified when the County Finance team reviews your memo.' },
              ].map(item => (
                <li key={item.step} className="flex gap-3">
                  <div className="w-7 h-7 bg-meruGreen text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="font-medium text-neutralDark text-sm">{item.icon} {item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5 bg-blue-50 border-blue-100">
            <div className="flex gap-3">
              <span className="text-xl shrink-0">🔒</span>
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Your data is protected</p>
                <p className="text-blue-800 leading-relaxed">
                  National ID numbers are SHA-256 hashed before storage. Phone numbers are used only for OTP delivery and status updates. We do not share your data with any third party. Compliant with Kenya Data Protection Act 2019.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 border-meruGold/30 bg-yellow-50">
            <div className="flex gap-3">
              <span className="text-xl shrink-0">📲</span>
              <div className="text-sm text-yellow-900">
                <p className="font-semibold mb-1">No data bundles? No problem.</p>
                <p className="leading-relaxed">
                  This portal is optimized for 2G/3G networks and works offline — submissions sync automatically when you reconnect.
                  No smartphone? Dial <strong>*384#</strong> on any basic phone.
                </p>
              </div>
            </div>
          </Card>

          {/* Ward count stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Sub-counties', value: '9' },
              { label: 'Total wards', value: '45' },
              { label: 'Memo limit', value: '1 / year' },
            ].map(s => (
              <Card key={s.label} className="p-3">
                <p className="text-xl font-bold text-meruGreen">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Right — the form */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-20">
          <MemoForm wards={wards} />
        </div>
      </div>
    </div>
  )
}
