'use client'
// src/app/admin/mca/page.tsx
// MCA members create and manage their ward development proposals

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input, Select, Textarea, Badge, Toast, SectionHeader, EmptyState } from '@/components/ui'

interface McaProposal {
  id:           string
  wardId:       number
  fiscalYear:   string
  title:        string
  description:  string | null
  sector:       string
  estimatedCost:number | null
  createdAt:    string
}
interface Ward { id: number; wardName: string; subCounty: string }
type ToastState = { type: 'success'|'error'; message: string } | null

const SECTORS = ['Health','Agriculture','Roads & Infrastructure','Water & Environment','General Public Service']
const FISCAL_YEARS = ['2026/2027','2027/2028','2025/2026']

export default function McaProposalsPage() {
  const [proposals, setProposals] = useState<McaProposal[]>([])
  const [wards,     setWards]     = useState<Ward[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState<ToastState>(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [filterFY,  setFilterFY]  = useState('2026/2027')
  const [deleting,  setDeleting]  = useState<string | null>(null)

  const [form, setForm] = useState({
    wardId: '', fiscalYear: '2026/2027', title: '',
    description: '', sector: '', estimatedCost: '',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, wRes] = await Promise.all([
        fetch(`/api/admin/mca-proposals?fiscalYear=${filterFY}`),
        fetch('/api/admin/wards'),
      ])
      const [pData, wData] = await Promise.all([pRes.json(), wRes.json()])
      if (pData.success) setProposals(pData.data)
      if (wData.success) setWards(wData.data)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [filterFY])

  useEffect(() => { loadData() }, [loadData])

  const handleAdd = async () => {
    if (!form.wardId || !form.title || !form.sector) return
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/mca-proposals', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          wardId:       parseInt(form.wardId, 10),
          fiscalYear:   form.fiscalYear,
          title:        form.title,
          description:  form.description || undefined,
          sector:       form.sector,
          estimatedCost:form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Proposal "${data.data.title}" filed successfully.` })
      setForm({ wardId:'', fiscalYear:'2026/2027', title:'', description:'', sector:'', estimatedCost:'' })
      setShowAdd(false)
      loadData()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Failed to file proposal' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res  = await fetch(`/api/admin/mca-proposals/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Proposal deleted.' })
      loadData()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Delete failed' })
    } finally { setDeleting(null) }
  }

  const wardMap = Object.fromEntries(wards.map(w => [w.id, w]))

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="MCA Ward Proposals"
        subtitle="Members of County Assembly file formal development proposals here. These are matched against citizen submissions in the Executive Briefing Matrix."
        action={
          <Button variant="gold" icon="➕" onClick={() => setShowAdd(s => !s)}>
            File proposal
          </Button>
        }
      />

      {/* Fiscal year filter */}
      <div className="flex gap-3 mb-6">
        {FISCAL_YEARS.map(fy => (
          <button
            key={fy}
            onClick={() => setFilterFY(fy)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterFY === fy
                ? 'bg-meruGreen text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-meruGreen/40'
            }`}
          >
            FY {fy}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-5 mb-6 border-meruGold/40 animate-slide-up">
          <p className="text-sm font-semibold text-neutralDark mb-4">➕ New MCA Proposal</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Ward" required
              value={form.wardId}
              onChange={e => setForm(f => ({ ...f, wardId: e.target.value }))}
              options={wards.map(w => ({ value: String(w.id), label: `${w.wardName} (${w.subCounty})` }))}
              placeholder="Select ward…"
            />
            <Select
              label="Fiscal year" required
              value={form.fiscalYear}
              onChange={e => setForm(f => ({ ...f, fiscalYear: e.target.value }))}
              options={FISCAL_YEARS.map(fy => ({ value: fy, label: `FY ${fy}` }))}
            />
            <Input
              label="Proposal title" required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Construction of Timau Cold Storage Facility"
              className="sm:col-span-2"
            />
            <Select
              label="Sector" required
              value={form.sector}
              onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
              options={SECTORS.map(s => ({ value: s, label: s }))}
              placeholder="Select sector…"
            />
            <Input
              label="Estimated cost (KSh)"
              value={form.estimatedCost}
              onChange={e => setForm(f => ({ ...f, estimatedCost: e.target.value }))}
              placeholder="e.g. 18750000"
              type="number"
            />
            <Textarea
              label="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the proposed project…"
              rows={3}
              className="sm:col-span-2"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd}
              disabled={!form.wardId || !form.title || !form.sector}>
              File proposal
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading proposals…</div>
      ) : proposals.length === 0 ? (
        <EmptyState
          icon="🏛️"
          title="No MCA proposals filed"
          description={`No proposals have been filed for FY ${filterFY} yet. MCAs can file proposals using the button above.`}
          action={<Button variant="gold" onClick={() => setShowAdd(true)}>File first proposal</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {proposals.map(p => {
            const ward = wardMap[p.wardId]
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-neutralDark leading-snug mb-1.5">{p.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {ward && <Badge variant="green">{ward.wardName}</Badge>}
                      <Badge variant="gray">{p.sector}</Badge>
                      {p.estimatedCost && (
                        <Badge variant="gold">
                          KSh {Number(p.estimatedCost).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-2 py-1.5 rounded-lg shrink-0 transition-colors"
                  >
                    {deleting === p.id ? '…' : '🗑'}
                  </button>
                </div>
                {p.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mt-2 line-clamp-2">{p.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Filed {new Date(p.createdAt).toLocaleDateString('en-KE')}
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
