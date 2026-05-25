'use client'
// src/components/dashboard/ExecutiveMatrix.tsx

import { useLanguage }  from '@/lib/language-context'
import { Badge, ProgressBar, StatCard } from '@/components/ui'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { clsx }         from 'clsx'

interface MatrixRow {
  wardId:             number
  wardName:           string
  subCounty:          string
  mcaName:            string | null
  topCitizenPriority: string
  citizenPct:         number
  totalSubmissions:   number
  mcaProposal:        string
  mcaSector:          string | null
  isAligned:          boolean
}

interface Kpis {
  totalSubmissions:  number
  totalVerifiedUsers:number
  alignmentRate:     number
  alignedWards:      number
  totalActiveWards:  number
  complianceScore:   number
}

interface SectorData {
  sector: string
  count:  number
  pct:    number
}

const SECTOR_COLORS: Record<string, string> = {
  'Health':                  '#01411C',
  'Agriculture':             '#c8960c',
  'Roads & Infrastructure':  '#2563eb',
  'Water & Environment':     '#0891b2',
  'General Public Service':  '#6E473B',
}

export default function ExecutiveMatrix({
  kpis,
  rows,
  sectorBreakdown,
}: {
  kpis:            Kpis
  rows:            MatrixRow[]
  sectorBreakdown: SectorData[]
}) {
  const { t } = useLanguage()

  const alignedRows   = rows.filter(r => r.isAligned)
  const divergedRows  = rows.filter(r => !r.isAligned)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total verified submissions"
          value={kpis.totalSubmissions.toLocaleString()}
          sub={`↑ from ${kpis.totalVerifiedUsers.toLocaleString()} residents`}
          color="#01411C"
          icon="📝"
        />
        <StatCard
          label="MCA–citizen alignment"
          value={`${kpis.alignmentRate}%`}
          sub={`${kpis.alignedWards} of ${kpis.totalActiveWards} wards matched`}
          color={kpis.alignmentRate >= 50 ? '#01411C' : '#c8960c'}
          icon="🤝"
        />
        <StatCard
          label="PFM compliance score"
          value={`${kpis.complianceScore}%`}
          sub="Constitution Art. 201"
          color="#01411C"
          icon="⚖️"
        />
        <StatCard
          label="Active participating wards"
          value={`${kpis.totalActiveWards} / 45`}
          sub="All sub-counties covered"
          color="#2563eb"
          icon="🗺️"
        />
      </div>

      {/* Sector breakdown chart */}
      {sectorBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="font-semibold text-neutralDark mb-4">Citizen budget preferences (avg sliders)</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="w-full sm:w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sectorBreakdown} dataKey="pct" nameKey="sector" cx="50%" cy="50%" outerRadius={72} innerRadius={36}>
                    {sectorBreakdown.map(s => (
                      <Cell key={s.sector} fill={SECTOR_COLORS[s.sector] ?? '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2 w-full">
              {sectorBreakdown.map(s => (
                <div key={s.sector}>
                  <ProgressBar
                    value={s.pct}
                    max={100}
                    color={SECTOR_COLORS[s.sector] ?? '#9ca3af'}
                    label={`${s.sector} — ${s.count.toLocaleString()} submissions`}
                    height={8}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alignment matrix table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-neutralDark">{t('executive', 'matrixTitle')}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Rows in green can be fast-tracked to budget committee without debate.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <Badge variant="green">✓ {alignedRows.length} aligned</Badge>
            <Badge variant="amber">⚠ {divergedRows.length} diverged</Badge>
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Ward</th>
                <th className="text-left px-4 py-3 font-semibold">Top citizen priority</th>
                <th className="text-center px-4 py-3 font-semibold w-16">%</th>
                <th className="text-left px-4 py-3 font-semibold">MCA proposal</th>
                <th className="text-center px-4 py-3 font-semibold w-24">Match</th>
                <th className="text-right px-4 py-3 font-semibold">Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(row => (
                <tr
                  key={row.wardId}
                  className={clsx(
                    'transition-colors hover:bg-gray-50/50',
                    row.isAligned ? 'bg-green-50/30' : ''
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutralDark">{row.wardName}</p>
                    <p className="text-xs text-gray-400">{row.subCounty}</p>
                    {row.mcaName && <p className="text-xs text-meruBrown mt-0.5">MCA: {row.mcaName}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutralDark">{row.topCitizenPriority}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx(
                      'text-sm font-bold',
                      row.citizenPct >= 60 ? 'text-meruGreen' : row.citizenPct >= 40 ? 'text-meruGold' : 'text-gray-500'
                    )}>
                      {row.citizenPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                    <p className="truncate text-sm">{row.mcaProposal}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.isAligned ? (
                      <Badge variant="green">✓ {t('executive', 'aligned')}</Badge>
                    ) : (
                      <Badge variant="amber">⚡ {t('executive', 'diverges')}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-neutralDark">
                      {row.totalSubmissions.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export actions */}
      <div className="flex flex-wrap gap-3">
        <button className="flex items-center gap-2 bg-meruGreen text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-900 transition-colors shadow-card">
          📄 {t('executive', 'exportPDF')}
        </button>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-neutralDark text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-card">
          📊 {t('executive', 'exportCFSP')}
        </button>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-neutralDark text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors shadow-card">
          📱 {t('executive', 'smsDigest')}
        </button>
      </div>
    </div>
  )
}
