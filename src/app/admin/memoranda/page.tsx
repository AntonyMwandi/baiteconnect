'use client'
// src/app/admin/memoranda/page.tsx
// Review, approve, shadow-ban citizen memoranda submissions

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Select, Badge, Toast, SectionHeader, EmptyState, ProgressBar } from '@/components/ui'
import { clsx } from 'clsx'

interface Memo {
  id:               string
  referenceCode:    string
  fiscalYear:       string
  sectorCategory:   string
  writtenText:      string
  moderationStatus: string
  createdAt:        string
  submissionLat:    number
  submissionLng:    number
  isWithinWard:     boolean
  user:  { fullName: string; phoneNumber: string }
  ward:  { wardName: string; subCounty: string }
}
type ToastState = { type: 'success'|'error'; message: string } | null

const STATUS_CONFIG: Record<string, { label: string; variant: 'green'|'amber'|'red'|'gray'; icon: string }> = {
  APPROVED:     { label: 'Approved',     variant: 'green', icon: '✅' },
  PENDING:      { label: 'Pending',      variant: 'gray',  icon: '⏳' },
  UNDER_REVIEW: { label: 'Under review', variant: 'amber', icon: '🔍' },
  SHADOW_BANNED:{ label: 'Shadow banned',variant: 'red',   icon: '🚫' },
}

export default function MemorandaAdminPage() {
  const [memos,    setMemos]    = useState<Memo[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [status,   setStatus]   = useState('')
  const [page,     setPage]     = useState(1)
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const PAGE_SIZE = 15

  const loadMemos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), fiscalYear: '2026/2027' })
      if (status) params.set('status', status)
      const res  = await fetch(`/api/memoranda?${params}`)
      const data = await res.json()
      if (data.success) { setMemos(data.data.memoranda); setTotal(data.data.total) }
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [status, page])

  useEffect(() => { loadMemos() }, [loadMemos])

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    try {
      const res  = await fetch(`/api/memoranda/${id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Memo ${newStatus.toLowerCase()}.` })
      loadMemos()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Update failed' })
    } finally { setUpdating(null) }
  }

  // Stats
  const statusCounts = memos.reduce((acc, m) => {
    acc[m.moderationStatus] = (acc[m.moderationStatus] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="Memoranda Review"
        subtitle={`${total.toLocaleString()} total submissions for FY 2026/2027. Review and moderate citizen submissions before they appear in the executive matrix.`}
      />

      {/* Status filter + mini counts */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['', 'PENDING','UNDER_REVIEW','APPROVED','SHADOW_BANNED'].map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-medium border transition-all min-h-[36px]',
                status === s
                  ? 'bg-meruGreen text-white border-meruGreen'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-meruGreen/40'
              )}
            >
              {s ? STATUS_CONFIG[s]?.label : 'All'} {statusCounts[s] !== undefined ? `(${statusCounts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading memoranda…</div>
      ) : memos.length === 0 ? (
        <EmptyState icon="📝" title="No memoranda found" description="Try a different status filter." />
      ) : (
        <div className="space-y-3">
          {memos.map(memo => {
            const sc = STATUS_CONFIG[memo.moderationStatus]
            const isOpen = expanded === memo.id
            return (
              <Card key={memo.id} className={clsx('overflow-hidden', memo.moderationStatus === 'UNDER_REVIEW' && 'border-amber-200')}>
                <div
                  className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : memo.id)}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs text-meruGreen font-bold">{memo.referenceCode}</span>
                        <Badge variant={sc?.variant ?? 'gray'}>{sc?.icon} {sc?.label}</Badge>
                        <Badge variant="gray">{memo.ward.wardName}</Badge>
                        <Badge variant="blue">{memo.sectorCategory}</Badge>
                        {!memo.isWithinWard && <Badge variant="amber">⚠ Out-of-ward GPS</Badge>}
                      </div>
                      <p className="text-sm text-neutralDark font-medium">{memo.user.fullName}</p>
                      <p className="text-xs text-gray-400">{memo.user.phoneNumber} · {new Date(memo.createdAt).toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' })}</p>
                    </div>
                    <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-gray-100 animate-fade-in">
                    <div className="mt-3 bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1.5">Memorandum text</p>
                      <p className="text-sm text-neutralDark leading-relaxed whitespace-pre-wrap">{memo.writtenText}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500 mb-3">
                      <div><span className="font-medium">Sub-county:</span><br/>{memo.ward.subCounty}</div>
                      <div><span className="font-medium">Sector:</span><br/>{memo.sectorCategory}</div>
                      <div><span className="font-medium">GPS:</span><br/>{memo.submissionLat.toFixed(4)}, {memo.submissionLng.toFixed(4)}</div>
                      <div><span className="font-medium">Within ward:</span><br/>{memo.isWithinWard ? '✅ Yes' : '⚠ No'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {memo.moderationStatus !== 'APPROVED' && (
                        <Button variant="primary" size="sm" loading={updating === memo.id}
                          onClick={() => updateStatus(memo.id, 'APPROVED')}>
                          ✅ Approve
                        </Button>
                      )}
                      {memo.moderationStatus !== 'UNDER_REVIEW' && (
                        <Button variant="secondary" size="sm" loading={updating === memo.id}
                          onClick={() => updateStatus(memo.id, 'UNDER_REVIEW')}>
                          🔍 Flag for review
                        </Button>
                      )}
                      {memo.moderationStatus !== 'SHADOW_BANNED' && (
                        <Button variant="danger" size="sm" loading={updating === memo.id}
                          onClick={() => updateStatus(memo.id, 'SHADOW_BANNED')}>
                          🚫 Shadow ban
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex justify-center gap-3 mt-6">
        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
        <span className="flex items-center text-sm text-gray-500">Page {page} · {total} total</span>
        <Button variant="secondary" size="sm" disabled={memos.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next →</Button>
      </div>
    </div>
  )
}
