'use client'
// src/app/admin/reports/page.tsx
// Manage whistleblower reports — dispatch MYS teams, resolve issues

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Badge, Select, Toast, SectionHeader, EmptyState } from '@/components/ui'
import { clsx } from 'clsx'

interface Report {
  id:               string
  reportText:       string
  photoEvidenceUrl: string
  evidenceLat:      number
  evidenceLng:      number
  status:           string
  mysCohortAssigned:string | null
  adminNotes:       string | null
  createdAt:        string
  project: { title: string; ward: { wardName: string; subCounty: string } }
  user:    { fullName: string; phoneNumber: string }
}
type ToastState = { type: 'success'|'error'; message: string } | null

const STATUS_CONFIG = {
  UNDER_REVIEW:  { label: 'Under review',   variant: 'amber' as const, icon: '🔍' },
  MYS_DISPATCHED:{ label: 'MYS dispatched', variant: 'blue'  as const, icon: '⚡' },
  RESOLVED:      { label: 'Resolved',       variant: 'green' as const, icon: '✅' },
}

const MYS_COHORTS = [
  'Imenti North MYS Unit','Imenti South MYS Unit','Central Imenti MYS Unit',
  'Buuri MYS Unit','Tigania East MYS Unit','Tigania West MYS Unit',
  'Igembe South MYS Unit','Igembe Central MYS Unit','Igembe North MYS Unit',
]

export default function ReportsPage() {
  const [reports,  setReports]  = useState<Report[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [status,   setStatus]   = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [mys,      setMys]      = useState<Record<string, string>>({})

  const loadReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status) params.set('status', status)
      const res  = await fetch(`/api/admin/reports?${params}`)
      const data = await res.json()
      if (data.success) setReports(data.data)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [status])

  useEffect(() => { loadReports() }, [loadReports])

  const updateReport = async (id: string, newStatus: string, cohort?: string) => {
    setUpdating(id)
    try {
      const res  = await fetch(`/api/admin/reports/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus, mysCohortAssigned: cohort }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Report updated to ${newStatus}.` })
      loadReports()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Update failed' })
    } finally { setUpdating(null) }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="Whistleblower Reports"
        subtitle="Citizen-filed delivery issue reports with geo-tagged evidence. Dispatch MYS teams or mark resolved."
      />

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['','UNDER_REVIEW','MYS_DISPATCHED','RESOLVED'].map(s => (
          <button key={s}
            onClick={() => setStatus(s)}
            className={clsx('px-3 py-2 rounded-xl text-xs font-medium border transition-all min-h-[36px]',
              status === s ? 'bg-meruGreen text-white border-meruGreen' : 'bg-white text-gray-600 border-gray-200')}
          >
            {s ? STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label : 'All reports'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading reports…</div>
      ) : reports.length === 0 ? (
        <EmptyState icon="🔍" title="No reports found" description="No whistleblower reports match this filter." />
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const sc     = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]
            const isOpen = expanded === report.id
            return (
              <Card key={report.id} className={clsx('overflow-hidden',
                report.status === 'UNDER_REVIEW' && 'border-amber-200')}>
                <div className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : report.id)}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge variant={sc?.variant ?? 'gray'}>{sc?.icon} {sc?.label}</Badge>
                        <Badge variant="green">{report.project.ward.wardName}</Badge>
                        {report.mysCohortAssigned && (
                          <Badge variant="blue">⚡ {report.mysCohortAssigned}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-neutralDark truncate">{report.project.title}</p>
                      <p className="text-xs text-gray-400">
                        Filed by {report.user.fullName} · {new Date(report.createdAt).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                    <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in space-y-3">
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">Report text</p>
                      <p className="text-sm text-neutralDark leading-relaxed">{report.reportText}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                      <div><span className="font-medium">Photo:</span><br/>
                        <a href={report.photoEvidenceUrl} target="_blank" rel="noopener noreferrer"
                          className="text-meruGreen hover:underline">View evidence</a>
                      </div>
                      <div><span className="font-medium">GPS:</span><br/>
                        {report.evidenceLat.toFixed(4)}, {report.evidenceLng.toFixed(4)}
                      </div>
                      <div><span className="font-medium">Reporter:</span><br/>
                        {report.user.fullName}<br/>
                        <span className="font-mono">{report.user.phoneNumber}</span>
                      </div>
                    </div>

                    {report.status === 'UNDER_REVIEW' && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Select
                          value={mys[report.id] ?? ''}
                          onChange={e => setMys(m => ({ ...m, [report.id]: e.target.value }))}
                          options={MYS_COHORTS.map(c => ({ value: c, label: c }))}
                          placeholder="Assign MYS cohort…"
                          className="flex-1"
                        />
                        <Button variant="primary" size="sm" loading={updating === report.id}
                          disabled={!mys[report.id]}
                          onClick={() => updateReport(report.id, 'MYS_DISPATCHED', mys[report.id])}>
                          ⚡ Dispatch MYS
                        </Button>
                        <Button variant="secondary" size="sm" loading={updating === report.id}
                          onClick={() => updateReport(report.id, 'RESOLVED')}>
                          ✅ Mark resolved
                        </Button>
                      </div>
                    )}
                    {report.status === 'MYS_DISPATCHED' && (
                      <Button variant="primary" size="sm" loading={updating === report.id}
                        onClick={() => updateReport(report.id, 'RESOLVED')}>
                        ✅ Mark as resolved
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
