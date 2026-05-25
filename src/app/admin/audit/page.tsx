'use client'
// src/app/admin/audit/page.tsx
// Immutable audit trail viewer — all system actions logged here

import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, SectionHeader, EmptyState } from '@/components/ui'
import { clsx } from 'clsx'

interface AuditEntry {
  id:         string
  action:     string
  entityType: string
  entityId:   string
  metadata:   Record<string, unknown> | null
  ipAddress:  string | null
  createdAt:  string
  actor?:     { fullName: string; phoneNumber: string } | null
}

const ACTION_COLORS: Record<string, 'green'|'blue'|'amber'|'red'|'gray'> = {
  MEMORANDUM_SUBMITTED:    'green',
  OTP_SENT:                'blue',
  OTP_VERIFIED:            'blue',
  WARD_CREATED:            'green',
  WARD_UPDATED:            'blue',
  WARD_DELETED:            'red',
  SUB_LOCATION_CREATED:    'green',
  SUB_LOCATION_DELETED:    'red',
  VILLAGE_CREATED:         'green',
  VILLAGE_DELETED:         'red',
  PROJECT_CREATED:         'green',
  PROJECT_STAGE_UPDATED:   'blue',
  WHISTLEBLOWER_REPORT_FILED: 'amber',
  MEMO_STATUS_UPDATED:     'blue',
  USER_ROLE_UPDATED:       'amber',
  MCA_PROPOSAL_FILED:      'green',
  MCA_PROPOSAL_DELETED:    'red',
}

export default function AuditLogPage() {
  const [entries,  setEntries]  = useState<AuditEntry[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [entityFilter, setEntityFilter] = useState('')
  const PAGE_SIZE = 30

  const loadAudit = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (entityFilter) params.set('entityType', entityFilter)
      const res  = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      if (data.success) { setEntries(data.data.entries); setTotal(data.data.total) }
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [page, entityFilter])

  useEffect(() => { loadAudit() }, [loadAudit])

  const ENTITY_TYPES = ['Memorandum','Ward','SubLocation','Village','Project','WhistleblowerReport','User','McaProposal','OtpVerification']

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <SectionHeader
        title="System Audit Log"
        subtitle={`Immutable cryptographic record of all system actions. ${total.toLocaleString()} entries total. Admissible as legal evidence for Senate oversight under PFM Act 2012.`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setEntityFilter(''); setPage(1) }}
          className={clsx('px-3 py-1.5 rounded-xl text-xs border transition-all',
            !entityFilter ? 'bg-meruGreen text-white border-meruGreen' : 'bg-white text-gray-500 border-gray-200')}
        >All</button>
        {ENTITY_TYPES.map(et => (
          <button key={et}
            onClick={() => { setEntityFilter(et); setPage(1) }}
            className={clsx('px-3 py-1.5 rounded-xl text-xs border transition-all',
              entityFilter === et ? 'bg-meruGreen text-white border-meruGreen' : 'bg-white text-gray-500 border-gray-200')}
          >{et}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading audit log…</div>
      ) : entries.length === 0 ? (
        <EmptyState icon="🔐" title="No audit entries" description="No actions have been logged yet." />
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-50">
          {entries.map(entry => {
            const color = ACTION_COLORS[entry.action] ?? 'gray'
            return (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                <div className={clsx('w-2 h-2 rounded-full mt-2 shrink-0',
                  color === 'green' ? 'bg-meruGreen' :
                  color === 'blue'  ? 'bg-blue-500'  :
                  color === 'amber' ? 'bg-amber-500' :
                  color === 'red'   ? 'bg-red-500'   : 'bg-gray-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-neutralDark">
                      {entry.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                    <Badge variant="gray">{entry.entityType}</Badge>
                    {entry.ipAddress && (
                      <span className="text-xs font-mono text-gray-400">{entry.ipAddress}</span>
                    )}
                  </div>
                  {entry.actor && (
                    <p className="text-xs text-gray-500">
                      By <strong>{entry.actor.fullName}</strong> ({entry.actor.phoneNumber})
                    </p>
                  )}
                  {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                      {JSON.stringify(entry.metadata)}
                    </p>
                  )}
                </div>
                <time className="text-xs text-gray-400 shrink-0 ml-auto">
                  {new Date(entry.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short' })}{' '}
                  {new Date(entry.createdAt).toLocaleTimeString('en-KE', { hour:'2-digit', minute:'2-digit' })}
                </time>
              </div>
            )
          })}
        </Card>
      )}

      <div className="flex justify-center gap-3 mt-6">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >← Prev</button>
        <span className="flex items-center text-sm text-gray-500">Page {page} · {total} entries</span>
        <button
          disabled={entries.length < PAGE_SIZE}
          onClick={() => setPage(p => p + 1)}
          className="px-4 py-2 rounded-xl border text-sm disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >Next →</button>
      </div>
    </div>
  )
}
