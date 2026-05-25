'use client'
// src/components/dashboard/ProjectCard.tsx

import { useState }      from 'react'
import { useLanguage }   from '@/lib/language-context'
import { Badge, Button, ProgressBar, Toast } from '@/components/ui'
import type { ProjectWithReports }           from '@/types'
import { clsx }          from 'clsx'

const STAGE_ORDER = ['ALLOCATED', 'TENDERED', 'ONGOING', 'COMPLETED'] as const
type Stage = typeof STAGE_ORDER[number]

const STAGE_COLORS: Record<Stage, string> = {
  ALLOCATED: '#6b7280',
  TENDERED:  '#2563eb',
  ONGOING:   '#c8960c',
  COMPLETED: '#01411C',
}

interface WhistleFormState {
  reportText:  string
  photoUrl:    string
  lat:         number
  lng:         number
  loading:     boolean
  error:       string
}

export default function ProjectCard({
  project,
  userId,
  userPhone,
  userName,
}: {
  project:    ProjectWithReports
  userId?:    string
  userPhone?: string
  userName?:  string
}) {
  const { t }                     = useLanguage()
  const [expanded, setExpanded]   = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [toast, setToast]         = useState<{ type: 'success'|'error'; message: string } | null>(null)
  const [whistle, setWhistle]     = useState<WhistleFormState>({
    reportText: '', photoUrl: '', lat: 0, lng: 0, loading: false, error: ''
  })

  const stageIdx      = STAGE_ORDER.indexOf(project.currentStage as Stage)
  const pct           = Math.round(((stageIdx + 1) / STAGE_ORDER.length) * 100)
  const isUnderAudit  = project._count.whistleReports >= 3
  const stageColor    = STAGE_COLORS[project.currentStage as Stage] ?? '#6b7280'

  const requestGeoAndPhoto = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setWhistle(w => ({ ...w, lat: pos.coords.latitude, lng: pos.coords.longitude }))
      })
    }
    // Trigger camera file input
    const input = document.getElementById(`photo-${project.id}`) as HTMLInputElement
    input?.click()
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // In production: upload to R2/Vercel Blob, get URL
    setWhistle(w => ({ ...w, photoUrl: `https://uploads.baiteconnect.meru.go.ke/evidence/${file.name}` }))
  }

  const handleSubmitReport = async () => {
    if (!userId) {
      setToast({ type: 'error', message: 'Please verify your identity before filing a report.' })
      return
    }
    if (!whistle.reportText.trim() || whistle.reportText.length < 20) {
      setWhistle(w => ({ ...w, error: 'Please describe the issue in at least 20 characters.' }))
      return
    }
    if (!whistle.photoUrl) {
      setWhistle(w => ({ ...w, error: 'A geo-tagged photo from the project site is required.' }))
      return
    }

    setWhistle(w => ({ ...w, loading: true, error: '' }))
    try {
      const res = await fetch(`/api/projects/${project.id}/report`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reportText:       whistle.reportText,
          photoEvidenceUrl: whistle.photoUrl,
          evidenceLat:      whistle.lat || -0.046,
          evidenceLng:      whistle.lng || 37.649,
          phoneNumber:      userPhone,
          firstName:        userName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Report submission failed')
      setShowReport(false)
      setWhistle({ reportText:'', photoUrl:'', lat:0, lng:0, loading:false, error:'' })
      setToast({ type: 'success', message: `Report filed. ${data.data?.projectFlaggedForAudit ? 'Project flagged for audit.' : 'Escalated to County PDU.'}` })
    } catch (err: unknown) {
      setWhistle(w => ({ ...w, error: err instanceof Error ? err.message : 'Failed. Try again.', loading: false }))
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className={clsx(
        'bg-white rounded-2xl border overflow-hidden shadow-card transition-shadow hover:shadow-card-lg',
        isUnderAudit ? 'border-amber-300' : 'border-gray-100'
      )}>
        {/* Card header */}
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutralDark text-sm sm:text-base leading-snug mb-1">
                {project.title}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="green">{project.ward.wardName}</Badge>
                <Badge variant="gray">
                  KSh {Number(project.allocatedBudget).toLocaleString()}
                </Badge>
                {project.mcaPriorityMatch && (
                  <Badge variant="blue">🤝 {t('projects', 'mcaMatch')}</Badge>
                )}
                {isUnderAudit && (
                  <Badge variant="amber">⚠ {t('projects', 'underAudit')}</Badge>
                )}
              </div>
            </div>

            {/* Stage badge */}
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full text-white shrink-0"
              style={{ background: isUnderAudit ? '#92400e' : stageColor }}
            >
              {isUnderAudit ? '🔍 Audit' : t('projects', `stages.${project.currentStage}` as Parameters<typeof t>[1])}
            </span>
          </div>

          {/* Progress bar */}
          <ProgressBar value={stageIdx + 1} max={4} color={isUnderAudit ? '#92400e' : stageColor} />

          {/* Stage timeline */}
          <div className="flex mt-3 gap-0">
            {STAGE_ORDER.map((stage, idx) => (
              <div key={stage} className="flex-1 flex flex-col items-center gap-0.5">
                <div className={clsx(
                  'w-2.5 h-2.5 rounded-full transition-colors duration-300',
                  idx <= stageIdx ? 'scale-110' : 'bg-gray-200'
                )} style={{ background: idx <= stageIdx ? STAGE_COLORS[stage] : undefined }} />
                <span className={clsx(
                  'text-[9px] text-center leading-tight',
                  idx === stageIdx ? 'font-semibold text-neutralDark' : 'text-gray-400'
                )}>
                  {t('projects', `stages.${stage}` as Parameters<typeof t>[1])}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expand / collapse detail */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full px-4 py-2 text-xs text-meruGreen font-medium bg-green-50/50 border-t border-gray-100 hover:bg-green-50 transition-colors text-left flex items-center justify-between"
        >
          <span>{expanded ? 'Hide details' : 'Show details & history'}</span>
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="px-4 sm:px-5 pb-4 border-t border-gray-100 animate-fade-in">
            {project.description && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{project.description}</p>
            )}
            {project.contractorName && (
              <p className="text-xs text-gray-500 mt-2">
                🏗️ Contractor: <strong>{project.contractorName}</strong>
              </p>
            )}
            {project.stageHistory.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage history</p>
                {project.stageHistory.map(h => (
                  <div key={h.id} className="flex items-start gap-2 text-xs text-gray-500">
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ background: STAGE_COLORS[h.stage as Stage] ?? '#6b7280' }}
                    />
                    <span className="font-medium text-neutralDark">{h.stage}</span>
                    {h.notes && <span>— {h.notes}</span>}
                    <span className="ml-auto shrink-0">
                      {new Date(h.createdAt).toLocaleDateString('en-KE')}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {project._count.whistleReports > 0 && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
                ⚠ {project._count.whistleReports} delivery issue report{project._count.whistleReports > 1 ? 's' : ''} filed — under administrative review
              </div>
            )}
          </div>
        )}

        {/* Whistleblower button */}
        <div className="px-4 sm:px-5 pb-4 pt-2">
          {!showReport ? (
            <button
              onClick={() => setShowReport(true)}
              className="text-xs text-red-600 border border-red-200 rounded-xl px-3 py-2 hover:bg-red-50 transition-colors flex items-center gap-1.5 w-full justify-center min-h-[40px]"
            >
              📸 {t('projects', 'reportIssue')}
            </button>
          ) : (
            <div className="space-y-3 mt-2 animate-slide-up border border-red-200 rounded-xl p-3 bg-red-50/50">
              <p className="text-xs text-red-700 font-medium">{t('projects', 'reportHint')}</p>

              <textarea
                value={whistle.reportText}
                onChange={e => setWhistle(w => ({ ...w, reportText: e.target.value }))}
                placeholder="Describe the delivery issue you observed at the project site…"
                rows={3}
                className="w-full text-sm border border-red-200 rounded-xl px-3 py-2 bg-white resize-none outline-none focus:ring-2 focus:ring-red-300"
              />

              {/* Hidden geo-tagged camera input */}
              <input
                id={`photo-${project.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />

              {whistle.photoUrl ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-green-600">📷</span>
                  <span className="text-xs text-green-800 truncate">Photo attached</span>
                </div>
              ) : (
                <button
                  onClick={requestGeoAndPhoto}
                  className="w-full border-2 border-dashed border-red-300 rounded-xl py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  📷 Take geo-tagged photo (required)
                </button>
              )}

              {whistle.error && <p className="text-xs text-red-600">{whistle.error}</p>}

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowReport(false); setWhistle(w => ({ ...w, error: '' })) }}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" fullWidth loading={whistle.loading} onClick={handleSubmitReport}>
                  Submit report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
