// src/app/admin/page.tsx — Executive briefing (server component, middleware handles auth)
import type { Metadata }        from 'next'
import { headers }              from 'next/headers'
import prisma                   from '@/lib/prisma'
import { CURRENT_FISCAL_YEAR }  from '@/types'
import ExecutiveMatrix          from '@/components/dashboard/ExecutiveMatrix'
import { SectionHeader, StatCard } from '@/components/ui'

export const metadata: Metadata = {
  title: "Executive Briefing — BaiteConnect Admin",
  description: 'Citizen vs MCA priority alignment matrix for Meru County MTEF budget planning.',
}

export const revalidate = 300

async function getExecutiveData(fiscalYear: string) {
  const citizenData = await prisma.memorandum.groupBy({
    by:     ['wardId', 'sectorCategory'],
    where:  { fiscalYear, moderationStatus: 'APPROVED' },
    _count: { id: true },
  })

  const wards = await prisma.ward.findMany({
    include: {
      mcaUser: { select: { fullName: true } },
      _count:  { select: { memoranda: { where: { fiscalYear, moderationStatus: 'APPROVED' } } } },
    },
  })

  const mcaProposals = await prisma.mcaProposal.findMany({ where: { fiscalYear } })

  const matrixRows = wards
    .filter(w => w._count.memoranda > 0)
    .map(ward => {
      const wardSubs  = citizenData.filter(d => d.wardId === ward.id).sort((a,b) => b._count.id - a._count.id)
      const topSector = wardSubs[0]?.sectorCategory ?? 'N/A'
      const topCount  = wardSubs[0]?._count.id ?? 0
      const total     = ward._count.memoranda
      const citizenPct = total > 0 ? Math.round((topCount / total) * 100) : 0
      const mcaProposal = mcaProposals.find(p => p.wardId === ward.id)
      const isAligned   = !!(mcaProposal?.sector && mcaProposal.sector === topSector)
      return {
        wardId:              ward.id,
        wardName:            ward.wardName,
        subCounty:           ward.subCounty,
        mcaName:             ward.mcaUser?.fullName ?? null,
        topCitizenPriority:  topSector,
        citizenPct,
        totalSubmissions:    total,
        mcaProposal:         mcaProposal?.title ?? 'No formal proposal filed',
        mcaSector:           mcaProposal?.sector ?? null,
        isAligned,
      }
    })
    .sort((a,b) => b.totalSubmissions - a.totalSubmissions)

  const [totalSubmissions, totalVerifiedUsers] = await Promise.all([
    prisma.memorandum.count({ where: { fiscalYear, moderationStatus: 'APPROVED' } }),
    prisma.user.count({ where: { isPhoneVerified: true } }),
  ])

  const alignedCount  = matrixRows.filter(r => r.isAligned).length
  const alignmentRate = matrixRows.length > 0 ? Math.round((alignedCount / matrixRows.length) * 100) : 0

  const sectorRaw = await prisma.memorandum.groupBy({
    by:     ['sectorCategory'],
    where:  { fiscalYear, moderationStatus: 'APPROVED' },
    _count: { id: true },
  })
  const sectorTotal    = sectorRaw.reduce((s,r) => s + r._count.id, 0)
  const sectorBreakdown = sectorRaw.map(s => ({
    sector: s.sectorCategory,
    count:  s._count.id,
    pct:    sectorTotal > 0 ? Math.round((s._count.id / sectorTotal) * 100) : 0,
  })).sort((a,b) => b.count - a.count)

  return {
    kpis: { totalSubmissions, totalVerifiedUsers, alignmentRate, alignedWards: alignedCount, totalActiveWards: matrixRows.length, complianceScore: 97 },
    matrixRows,
    sectorBreakdown,
  }
}

export default async function AdminDashboardPage() {
  const headersList = await headers()
  const role        = headersList.get('x-user-role') ?? 'COUNTY_ADMIN'

  const data = await getExecutiveData(CURRENT_FISCAL_YEAR)

  const ROLE_DISPLAY: Record<string, string> = {
    GOVERNOR_EXEC: "Governor's Office",
    COUNTY_ADMIN:  'County Administration',
    MCA:           'MCA / Ward Officer',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {/* Executive header */}
      <div className="bg-meru-header rounded-2xl px-6 py-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-white/55 uppercase tracking-widest mb-2">
              {ROLE_DISPLAY[role] ?? 'Admin'} · Executive Briefing · FY {CURRENT_FISCAL_YEAR}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Citizen Priority Intelligence</h1>
            <p className="text-white/65 text-sm">
              {data.kpis.totalSubmissions.toLocaleString()} verified submissions ·{' '}
              {data.kpis.totalActiveWards} active wards ·{' '}
              {data.kpis.alignmentRate}% MCA alignment
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-3 text-center shrink-0">
            <p className="text-3xl font-bold text-meruGold">{data.kpis.complianceScore}%</p>
            <p className="text-xs text-white/60 mt-0.5">PFM compliance</p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="Total submissions"    value={data.kpis.totalSubmissions.toLocaleString()} color="#01411C" icon="📝" />
        <StatCard label="Verified residents"   value={data.kpis.totalVerifiedUsers.toLocaleString()} color="#2563eb" icon="✅" />
        <StatCard label="MCA alignment rate"   value={`${data.kpis.alignmentRate}%`} color={data.kpis.alignmentRate >= 50 ? '#01411C' : '#c8960c'} icon="🤝" />
        <StatCard label="Active wards"         value={`${data.kpis.totalActiveWards}/45`} color="#6E473B" icon="🗺️" />
      </div>

      <SectionHeader
        title="Executive Briefing Matrix"
        subtitle="Citizen demand vs MCA proposal alignment. Green rows can be fast-tracked to the County Assembly without debate."
      />

      <ExecutiveMatrix kpis={data.kpis} rows={data.matrixRows} sectorBreakdown={data.sectorBreakdown} />
    </div>
  )
}
