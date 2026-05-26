// src/app/page.tsx
import Link            from 'next/link'
import Image           from 'next/image'
import prisma          from '@/lib/prisma'
import { CURRENT_FISCAL_YEAR } from '@/types'
import { Card, StatCard }       from '@/components/ui'
import WardLeaderboard          from '@/components/dashboard/WardLeaderboard'

async function getHomeStats() {
  const [totalSubmissions, totalVerified, activeWardsRaw, totalProjects] = await Promise.all([
    prisma.memorandum.count({ where: { fiscalYear: CURRENT_FISCAL_YEAR, moderationStatus: 'APPROVED' } }),
    prisma.user.count({ where: { isPhoneVerified: true } }),
    prisma.memorandum.groupBy({ by: ['wardId'], where: { fiscalYear: CURRENT_FISCAL_YEAR } }),
    prisma.project.count(),
  ])
  return { totalSubmissions, totalVerified, activeWards: activeWardsRaw.length, totalProjects }
}

async function getTopWards() {
  const wards = await prisma.ward.findMany({
    include: {
      _count: { select: { memoranda: { where: { fiscalYear: CURRENT_FISCAL_YEAR, moderationStatus: 'APPROVED' } } } },
    },
  })
  return wards
    .sort((a, b) => b._count.memoranda - a._count.memoranda)
    .slice(0, 10)
    .map((w, idx) => ({
      id: w.id, wardName: w.wardName, subCounty: w.subCounty,
      submissionCount: w._count.memoranda, rank: idx + 1, mcaName: null,
    }))
}

export default async function HomePage() {
  const [stats, topWards] = await Promise.all([getHomeStats(), getTopWards()])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8">

      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="bg-meru-header rounded-2xl sm:rounded-3xl px-6 py-10 sm:px-12 sm:py-14 text-white relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 opacity-10 pointer-events-none hidden lg:block">
          <Image src="/meru-logo.jpeg" alt="" width={128} height={128} className="object-contain" />
        </div>

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs mb-5">
            <span className="w-1.5 h-1.5 bg-meruGold rounded-full animate-pulse" />
            MTEF FY 2026/2027 · Public Participation Open
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Shape Meru&apos;s Budget.<br />
            <span className="text-meruGold">Your voice counts.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-xl">
            Submit your ward&apos;s priorities directly to Governor Isaac Mutuma M&apos;Ethingia&apos;s planning desk.
            Verified submissions only — fulfilling Kenya Constitution Article 201.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/submit"
              className="inline-flex items-center gap-2 bg-meruGold text-meruGreen font-bold text-sm sm:text-base px-6 py-3 rounded-xl hover:bg-yellow-400 transition-colors shadow-gold-glow min-h-[48px]">
              📝 Submit a Memo
            </Link>
            <Link href="/budget"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white font-medium text-sm sm:text-base px-6 py-3 rounded-xl hover:bg-white/20 transition-colors min-h-[48px]">
              💰 Explore Budget
            </Link>
            <Link href="/projects"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/25 text-white font-medium text-sm sm:text-base px-6 py-3 rounded-xl hover:bg-white/20 transition-colors min-h-[48px]">
              🏗️ Track Projects
            </Link>
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Submissions"  value={stats.totalSubmissions.toLocaleString()} sub="Verified memos"  color="#01411C" icon="📝" />
        <StatCard label="Verified Residents" value={stats.totalVerified.toLocaleString()}    sub="Phone-verified" color="#2563eb" icon="✅" />
        <StatCard label="Active Wards"       value={`${stats.activeWards} / 45`}             sub="Participating"  color="#c8960c" icon="🗺️" />
        <StatCard label="Projects Tracked"   value={stats.totalProjects.toLocaleString()}    sub="County-wide"   color="#6E473B" icon="🏗️" />
      </div>

      {/* ── SPLIT PANE ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* Left panels */}
        <div className="space-y-6">
          {/* About */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-full overflow-hidden shadow border border-gray-100 shrink-0 flex items-center justify-center">
                <Image src="/meru-logo.jpeg" alt="Meru County" width={44} height={44} className="object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutralDark mb-1">About BaiteConnect</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  The official digital public participation portal of the County Government of Meru, Kenya.
                  Built to fulfil the MTEF/CFSP mandate under the PFM Act 2012 and Constitution Article 201.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600 leading-relaxed mt-5">
              {[
                { icon: '📋', title: 'Submit Memoranda', body: 'Lodge your ward\'s development priorities directly into the County Finance planning database.' },
                { icon: '💰', title: 'Budget Balancer', body: 'Use the 100-Shilling coin tool to show how you\'d split county spending across sectors.' },
                { icon: '🏗️', title: 'Project Accountability', body: 'Track funded projects and file geo-tagged reports when you spot delivery delays.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3 sm:flex-col sm:gap-2">
                  <span className="text-2xl sm:text-3xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="font-semibold text-neutralDark mb-1">{item.title}</p>
                    <p>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Constitutional compliance */}
          <Card className="p-5 bg-green-50 border-green-100">
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">⚖️</span>
              <div>
                <h3 className="font-semibold text-meruGreen mb-1">Constitutional Compliance</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  BaiteConnect fulfils the public participation mandate under <strong>Article 201 of the Constitution of Kenya</strong> and the <strong>Public Finance Management Act 2012</strong>. Every verified submission is cryptographically logged as an immutable audit trail for the County Assembly and Senate oversight.
                </p>
                <Link href="/about" className="text-xs text-meruGreen font-medium mt-2 inline-flex items-center gap-1 hover:underline">
                  Learn more about BaiteConnect →
                </Link>
              </div>
            </div>
          </Card>

          {/* Languages */}
          <Card className="p-5">
            <h3 className="font-semibold text-neutralDark mb-3">Available in 3 languages</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'EN',  label: 'English',   note: 'Primary interface language' },
                { code: 'SW',  label: 'Kiswahili', note: 'Lugha ya kitaifa' },
                { code: 'KÎÎ', label: 'Kimîîru',   note: 'Rûgano rwa Meru' },
              ].map(l => (
                <div key={l.code} className="flex items-center gap-2 bg-neutralLight rounded-xl px-4 py-2.5 text-sm">
                  <span className="font-mono font-bold text-meruGreen text-xs bg-green-100 px-2 py-0.5 rounded-md">{l.code}</span>
                  <div>
                    <p className="font-medium text-neutralDark leading-none">{l.label}</p>
                    <p className="text-xs text-gray-400">{l.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* USSD */}
          <Card className="p-5 border-meruGold/30">
            <div className="flex gap-3">
              <span className="text-2xl shrink-0">📲</span>
              <div>
                <h3 className="font-semibold text-neutralDark mb-1">No smartphone? Use USSD</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Feature phone users can access BaiteConnect via USSD code{' '}
                  <strong className="text-meruGreen">*384#</strong> on any Safaricom, Airtel, or Telkom line — no internet required.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right — leaderboard + CTA */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-meru-header px-4 py-3">
              <p className="text-xs text-white/55 uppercase tracking-wide mb-0.5">FY {CURRENT_FISCAL_YEAR}</p>
              <h3 className="font-bold text-white">🏆 Ward Engagement League</h3>
            </div>
            <WardLeaderboard wards={topWards} compact />
          </Card>

          <Card className="p-5 bg-meruGold border-yellow-200">
            <h3 className="font-bold text-meruGreen text-lg mb-2">Ready to be heard?</h3>
            <p className="text-sm text-green-900 mb-4 leading-relaxed">
              Your memo goes directly to the County Finance planning desk. Verified. Counted. Actionable.
            </p>
            <Link href="/submit"
              className="w-full flex items-center justify-center gap-2 bg-meruGreen text-white font-bold text-sm py-3 rounded-xl hover:bg-green-900 transition-colors min-h-[48px]">
              📝 Submit Your Memorandum
            </Link>
          </Card>

          {/* Quick links for footer pages */}
          <Card className="p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">More Information</h3>
            <div className="space-y-1">
              {[
                { href: '/about',   label: 'About BaiteConnect', icon: 'ℹ️' },
                { href: '/contact', label: 'Contact Us',          icon: '📞' },
                { href: '/privacy', label: 'Privacy Policy',      icon: '🔒' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-green-50 hover:text-meruGreen transition-colors">
                  <span>{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
