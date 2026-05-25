// src/app/admin/projects/[id]/page.tsx
// Deep project detail view with full stage history, whistleblower reports, and update controls

import type { Metadata }            from 'next'
import { notFound, redirect }       from 'next/navigation'
import { headers }                  from 'next/headers'
import Link                         from 'next/link'
import prisma                       from '@/lib/prisma'
import { Card, Badge }              from '@/components/ui'
import { getSession }               from '@/lib/auth'

export const revalidate = 60

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id }   = await params
  const project  = await prisma.project.findUnique({ where: { id }, select: { title: true } })
  return { title: project ? `${project.title} — BaiteConnect Admin` : 'Project Not Found' }
}

const STAGE_LABELS: Record<string, string> = {
  ALLOCATED: 'Budget Allocated',
  TENDERED:  'Tender Awarded',
  ONGOING:   'Construction Ongoing',
  COMPLETED: 'Project Completed',
}

const STAGE_COLORS: Record<string, string> = {
  ALLOCATED: '#6b7280',
  TENDERED:  '#2563eb',
  ONGOING:   '#c8960c',
  COMPLETED: '#01411C',
}

const REPORT_STATUS: Record<string, { label: string; color: string }> = {
  UNDER_REVIEW:  { label: 'Under Review',   color: '#92400e' },
  MYS_DISPATCHED:{ label: 'MYS Dispatched', color: '#1d4ed8' },
  RESOLVED:      { label: 'Resolved',       color: '#065f46' },
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id }    = await params
  const headerMap = await headers()
  const role      = headerMap.get('x-user-role')

  if (!role || !['COUNTY_ADMIN', 'GOVERNOR_EXEC', 'MCA'].includes(role)) {
    redirect('/admin/login')
  }

  const project = await prisma.project.findUnique({
    where:   { id },
    include: {
      ward:         { select: { wardName: true, subCounty: true } },
      stageHistory: { orderBy: { createdAt: 'asc' } },
      whistleReports: {
        include: { user: { select: { fullName: true, phoneNumber: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) notFound()

  const stageIdx     = ['ALLOCATED','TENDERED','ONGOING','COMPLETED'].indexOf(project.currentStage)
  const activeReports = project.whistleReports.filter(r => r.status !== 'RESOLVED').length

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-6">

      {/* Back */}
      <Link href="/admin/projects" className="inline-flex items-center gap-1.5 text-sm text-meruGreen hover:underline">
        ← Back to Projects
      </Link>

      {/* Header card */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-neutralDark mb-2">{project.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="green">{project.ward.wardName} Ward</Badge>
              <Badge variant="gray">{project.ward.subCounty}</Badge>
              <Badge variant="gold">
                KSh {Number(project.allocatedBudget).toLocaleString()}
              </Badge>
              {project.mcaPriorityMatch && <Badge variant="blue">🤝 MCA Match</Badge>}
              {activeReports >= 3 && <Badge variant="amber">⚠ {activeReports} Active Reports</Badge>}
            </div>
          </div>
          <span
            className="text-sm font-bold text-white px-3 py-1.5 rounded-full shrink-0"
            style={{ background: STAGE_COLORS[project.currentStage] ?? '#6b7280' }}
          >
            {STAGE_LABELS[project.currentStage] ?? project.currentStage}
          </span>
        </div>

        {project.description && (
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{project.description}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Contractor',       value: project.contractorName ?? 'Pending' },
            { label: 'Budget',           value: `KSh ${Number(project.allocatedBudget).toLocaleString()}` },
            { label: 'Last updated',     value: new Date(project.updatedAt).toLocaleDateString('en-KE') },
            { label: 'GPS',              value: project.latitude ? `${project.latitude.toFixed(4)}, ${project.longitude?.toFixed(4)}` : 'Not set' },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 mb-0.5">{f.label}</p>
              <p className="font-semibold text-neutralDark">{f.value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <h2 className="font-bold text-neutralDark mb-4">Delivery Timeline</h2>
        <div className="flex gap-0 mb-4">
          {['ALLOCATED','TENDERED','ONGOING','COMPLETED'].map((stage, idx) => (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className="w-4 h-4 rounded-full border-2 transition-all"
                style={{
                  background: idx <= stageIdx ? STAGE_COLORS[stage] : '#e5e7eb',
                  borderColor: idx <= stageIdx ? STAGE_COLORS[stage] : '#e5e7eb',
                }}
              />
              <span
                className="text-[10px] text-center font-medium leading-tight"
                style={{ color: idx <= stageIdx ? STAGE_COLORS[stage] : '#9ca3af' }}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
          ))}
        </div>

        {/* History log */}
        {project.stageHistory.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Stage History</p>
            <div className="space-y-2">
              {project.stageHistory.map(h => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <div
                    className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: STAGE_COLORS[h.stage] ?? '#9ca3af' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-neutralDark">{STAGE_LABELS[h.stage] ?? h.stage}</span>
                    {h.notes && <span className="text-gray-500 ml-2">— {h.notes}</span>}
                    {h.updatedBy && h.updatedBy !== 'seed' && (
                      <span className="text-gray-400 text-xs ml-2">by {h.updatedBy}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(h.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Whistleblower reports */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-neutralDark">
            Whistleblower Reports ({project.whistleReports.length})
          </h2>
          {activeReports > 0 && (
            <Badge variant="amber">⚠ {activeReports} unresolved</Badge>
          )}
        </div>

        {project.whistleReports.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No reports filed for this project.</p>
        ) : (
          <div className="space-y-3">
            {project.whistleReports.map(report => {
              const rs = REPORT_STATUS[report.status]
              return (
                <div key={report.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm text-gray-600 leading-relaxed flex-1">{report.reportText}</p>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-full text-white shrink-0"
                      style={{ background: rs?.color ?? '#6b7280' }}
                    >
                      {rs?.label ?? report.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    <span>👤 {report.user.fullName}</span>
                    <span className="font-mono">{report.user.phoneNumber}</span>
                    <span>📍 {report.evidenceLat.toFixed(4)}, {report.evidenceLng.toFixed(4)}</span>
                    {report.mysCohortAssigned && <span>⚡ {report.mysCohortAssigned}</span>}
                    <span>{new Date(report.createdAt).toLocaleDateString('en-KE')}</span>
                  </div>
                  {report.photoEvidenceUrl && (
                    <a
                      href={report.photoEvidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-meruGreen hover:underline mt-1.5 inline-flex items-center gap-1"
                    >
                      📷 View photo evidence ↗
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/projects"
          className="bg-meruGreen text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-green-900 transition-colors"
        >
          ← All Projects
        </Link>
        <Link
          href="/admin/reports"
          className="bg-white border border-gray-200 text-neutralDark text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          🔍 All Reports
        </Link>
      </div>
    </div>
  )
}
