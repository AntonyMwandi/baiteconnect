// src/app/leaderboard/page.tsx
import type { Metadata }     from 'next'
import prisma                from '@/lib/prisma'
import { CURRENT_FISCAL_YEAR } from '@/types'
import WardLeaderboard       from '@/components/dashboard/WardLeaderboard'
import { Card, SectionHeader, StatCard } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Ward League — BaiteConnect Meru County',
  description: 'All 45 wards of Meru County ranked by verified public participation submissions.',
}

export const revalidate = 120

async function getLeaderboardData() {
  const wards = await prisma.ward.findMany({
    include: {
      _count: {
        select: {
          memoranda: { where: { fiscalYear: CURRENT_FISCAL_YEAR, moderationStatus: 'APPROVED' } },
        },
      },
      mcaUser: { select: { fullName: true } },
    },
  })

  const ranked = wards
    .sort((a, b) => b._count.memoranda - a._count.memoranda)
    .map((w, idx) => ({
      id:              w.id,
      wardName:        w.wardName,
      subCounty:       w.subCounty,
      mcaName:         w.mcaUser?.fullName ?? null,
      submissionCount: w._count.memoranda,
      rank:            idx + 1,
    }))

  // Group by sub-county for the breakdown panel
  const bySubCounty: Record<string, { total: number; wards: number }> = {}
  for (const w of ranked) {
    if (!bySubCounty[w.subCounty]) bySubCounty[w.subCounty] = { total: 0, wards: 0 }
    bySubCounty[w.subCounty].total += w.submissionCount
    bySubCounty[w.subCounty].wards += 1
  }

  const subCountyBreakdown = Object.entries(bySubCounty)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)

  const totalSubmissions = ranked.reduce((s, w) => s + w.submissionCount, 0)
  const participatingWards = ranked.filter(w => w.submissionCount > 0).length

  return { ranked, subCountyBreakdown, totalSubmissions, participatingWards }
}

export default async function LeaderboardPage() {
  const { ranked, subCountyBreakdown, totalSubmissions, participatingWards } = await getLeaderboardData()
  const maxSubCount = subCountyBreakdown[0]?.total ?? 1

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <SectionHeader
        title="Ward Civic Engagement League"
        subtitle={`All 45 wards of Meru County ranked by verified submissions for FY ${CURRENT_FISCAL_YEAR}.`}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total verified submissions" value={totalSubmissions.toLocaleString()} color="#01411C" icon="📝" />
        <StatCard label="Participating wards"        value={`${participatingWards} / 45`}       color="#2563eb" icon="🗺️" />
        <StatCard label="Top ward"                   value={ranked[0]?.wardName ?? '—'}         color="#c8960c" icon="🥇" />
        <StatCard label="Top sub-county"             value={subCountyBreakdown[0]?.name ?? '—'} color="#6E473B" icon="🏆" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* Full leaderboard table */}
        <Card className="overflow-hidden">
          <div className="bg-meru-header px-5 py-4">
            <p className="text-xs text-white/60 uppercase tracking-widest mb-1">FY {CURRENT_FISCAL_YEAR}</p>
            <h2 className="font-bold text-white text-lg">🏆 All 45 Wards</h2>
            <p className="text-xs text-white/60 mt-1">
              Ranked by verified, moderated memorandum submissions
            </p>
          </div>
          <WardLeaderboard wards={ranked} compact={false} />
        </Card>

        {/* Sub-county breakdown sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <div className="bg-meruBrown px-4 py-3">
              <h3 className="font-bold text-white">Sub-County Breakdown</h3>
              <p className="text-xs text-white/60 mt-0.5">Aggregate submissions per sub-county</p>
            </div>
            <div className="divide-y divide-gray-50">
              {subCountyBreakdown.map((sc, idx) => (
                <div key={sc.name} className="px-4 py-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutralDark leading-tight">{sc.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-meruGreen rounded-full transition-all duration-700"
                          style={{ width: `${(sc.total / maxSubCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{sc.wards} wards</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-meruGreen shrink-0">
                    {sc.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Explainer */}
          <Card className="p-4 bg-yellow-50 border-yellow-100">
            <p className="text-xs font-semibold text-yellow-800 mb-2">⚡ Ward Rivalry</p>
            <p className="text-xs text-yellow-700 leading-relaxed">
              Rankings are updated in real time as verified submissions come in. Share this leaderboard with your ward community group, chama, or church to drive participation and move your ward up the table.
            </p>
          </Card>

          <Card className="p-4 bg-green-50 border-green-100">
            <p className="text-xs font-semibold text-meruGreen mb-2">📊 Why this matters</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              The Governor&apos;s planning team uses ward submission volumes as a weighting factor when allocating discretionary budget to ward-level projects. Higher participation = stronger evidence for your ward&apos;s priorities.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
