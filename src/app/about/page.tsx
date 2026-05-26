// src/app/about/page.tsx
import type { Metadata } from 'next'
import Image             from 'next/image'
import Link              from 'next/link'
import { Card }          from '@/components/ui'

export const metadata: Metadata = {
  title: 'About BaiteConnect — Meru County',
  description: 'About the BaiteConnect Digital Public Participation Portal for Meru County, Kenya.',
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-meru-header rounded-2xl p-8 text-white">
        <div className="w-24 h-24 bg-white rounded-full overflow-hidden shadow-2xl flex items-center justify-center shrink-0">
          <Image src="/meru-logo.jpeg" alt="County Government of Meru" width={88} height={88} className="object-contain" />
        </div>
        <div>
          <p className="text-white/60 text-sm uppercase tracking-widest mb-2">About</p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">BaiteConnect</h1>
          <p className="text-white/80 leading-relaxed">
            The official Digital Public Participation and Ward Budgeting Portal of the County Government of Meru, Kenya.
          </p>
        </div>
      </div>

      {/* What is BaiteConnect */}
      <Card className="p-6 sm:p-8">
        <h2 className="text-xl font-bold text-meruGreen mb-4">What is BaiteConnect?</h2>
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            BaiteConnect is a production-grade digital platform built for the County Government of Meru to fulfil its
            statutory public participation obligations under <strong>Article 201 of the Constitution of Kenya</strong> and
            the <strong>Public Finance Management Act 2012</strong>.
          </p>
          <p>
            Every year, the Department of Finance, Economic Planning and ICT must engage all 45 wards of Meru County
            in the Medium-Term Expenditure Framework (MTEF) and County Fiscal Strategy Paper (CFSP) budget planning cycle.
            BaiteConnect digitises this entire process — from submission of memoranda to project delivery tracking.
          </p>
          <p>
            The platform runs at <strong>baiteconnect.meru.go.ke</strong> and supports English, Kiswahili, and
            Kimîîru (the local Meru language), ensuring every resident — regardless of location, literacy level,
            or device — can participate in shaping the county budget.
          </p>
        </div>
      </Card>

      {/* Three pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          { icon: '📝', title: 'Submit Memoranda', desc: 'File your ward\'s budget priorities directly to the County Finance planning desk with a verified, court-admissible digital submission.' },
          { icon: '💰', title: '100-Shilling Balancer', desc: 'Express how you\'d split the county\'s spending across sectors using an interactive budget game. Your choices inform planning decisions.' },
          { icon: '🏗️', title: 'Project Accountability', desc: 'Track every funded project from budget allocation to completion. File geo-tagged reports when you spot delivery delays.' },
        ].map(p => (
          <Card key={p.title} className="p-5 text-center hover:shadow-card-lg transition-shadow">
            <div className="text-4xl mb-3">{p.icon}</div>
            <h3 className="font-bold text-neutralDark mb-2">{p.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
          </Card>
        ))}
      </div>

      {/* Governor's mandate */}
      <Card className="p-6 sm:p-8 bg-green-50 border-meruGreen/20">
        <div className="flex gap-4">
          <span className="text-3xl shrink-0">🏛️</span>
          <div>
            <h2 className="text-lg font-bold text-meruGreen mb-2">
              Governor Isaac Mutuma M&apos;Ethingia&apos;s Governance Mandate
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm">
              Governor Mutuma came to office explicitly pledging &ldquo;constant consultations&rdquo; and an end to
              one-man-show governance. BaiteConnect is the digital infrastructure that makes this promise concrete —
              giving every Meru resident a direct, verified channel to shape how public funds are spent in their ward,
              and giving the Governor data-backed evidence that community consensus is driving budget allocations.
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: '45', label: 'Wards covered' },
          { value: '9',  label: 'Sub-counties'  },
          { value: '3',  label: 'Languages'      },
          { value: '1M+', label: 'Residents served' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-meruGreen">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Legal compliance */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-neutralDark mb-4">Legal & Constitutional Compliance</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { law: 'Constitution of Kenya 2010', art: 'Article 201', note: 'Public participation in public finance' },
            { law: 'Public Finance Management Act 2012', art: 'Section 125', note: 'County budget public engagement' },
            { law: 'County Governments Act 2012', art: 'Section 91', note: 'Ward-level service delivery accountability' },
            { law: 'Kenya Data Protection Act 2019', art: 'Full compliance', note: 'AES-256 encryption, right to erasure' },
          ].map(item => (
            <div key={item.law} className="flex gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-meruGreen text-lg shrink-0">⚖️</span>
              <div>
                <p className="text-sm font-semibold text-neutralDark">{item.law}</p>
                <p className="text-xs text-meruGreen font-medium">{item.art}</p>
                <p className="text-xs text-gray-500">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <div className="flex flex-wrap gap-3 justify-center pb-4">
        <Link href="/submit"
          className="bg-meruGreen text-white font-bold px-8 py-3 rounded-xl hover:bg-green-900 transition-colors">
          📝 Submit a Memo
        </Link>
        <Link href="/projects"
          className="bg-white border border-gray-200 text-neutralDark font-medium px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          🏗️ Track Projects
        </Link>
        <Link href="/contact"
          className="bg-meruGold text-meruGreen font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
          📞 Contact Us
        </Link>
      </div>
    </div>
  )
}
