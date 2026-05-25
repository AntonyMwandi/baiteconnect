'use client'
// src/app/admin/projects/page.tsx
// Full project management — create, update stages, assign contractors

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input, Select, Textarea, Badge, Toast, SectionHeader, EmptyState, StatCard } from '@/components/ui'
import { clsx } from 'clsx'

interface Project {
  id:              string
  wardId:          number
  title:           string
  description:     string | null
  allocatedBudget: number
  currentStage:    string
  contractorName:  string | null
  mcaPriorityMatch:boolean
  latitude:        number | null
  longitude:       number | null
  updatedAt:       string
  activeReportCount: number
  ward: { wardName: string; subCounty: string }
  stageHistory: { id: number; stage: string; notes: string | null; createdAt: string }[]
}
interface Ward { id: number; wardName: string; subCounty: string }
type ToastState = { type: 'success'|'error'; message: string } | null

const STAGES = ['ALLOCATED','TENDERED','ONGOING','COMPLETED'] as const
type Stage = typeof STAGES[number]

const STAGE_LABELS: Record<Stage, string> = {
  ALLOCATED: 'Allocated', TENDERED: 'Tender Awarded',
  ONGOING: 'Ongoing',     COMPLETED: 'Completed',
}
const STAGE_COLORS: Record<Stage, string> = {
  ALLOCATED: '#6b7280', TENDERED: '#2563eb', ONGOING: '#c8960c', COMPLETED: '#01411C',
}
const SECTORS = ['Health','Agriculture','Roads & Infrastructure','Water & Environment','General Public Service']

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [wards,    setWards]    = useState<Ward[]>([])
  const [loading,  setLoading]  = useState(true)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [showAdd,  setShowAdd]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [stageFilter, setStageFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [stageUpdating, setStageUpdating] = useState<string | null>(null)
  const [stageNotes, setStageNotes] = useState<Record<string, string>>({})
  const [newStage,   setNewStage]   = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    wardId:'', title:'', description:'', allocatedBudget:'',
    currentStage:'ALLOCATED', contractorName:'', mcaPriorityMatch: false,
    latitude:'', longitude:'',
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, wRes] = await Promise.all([
        fetch(`/api/projects${stageFilter ? `?stage=${stageFilter}` : ''}`),
        fetch('/api/admin/wards'),
      ])
      const [pData, wData] = await Promise.all([pRes.json(), wRes.json()])
      if (pData.success) setProjects(pData.data)
      if (wData.success) setWards(wData.data)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [stageFilter])

  useEffect(() => { loadData() }, [loadData])

  const handleCreate = async () => {
    if (!form.wardId || !form.title || !form.allocatedBudget) return
    setSaving(true)
    try {
      const res  = await fetch('/api/projects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          wardId:          parseInt(form.wardId),
          title:           form.title,
          description:     form.description || undefined,
          allocatedBudget: parseFloat(form.allocatedBudget),
          currentStage:    form.currentStage,
          contractorName:  form.contractorName || undefined,
          mcaPriorityMatch:form.mcaPriorityMatch,
          latitude:        form.latitude  ? parseFloat(form.latitude)  : undefined,
          longitude:       form.longitude ? parseFloat(form.longitude) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Project "${data.data.title}" created.` })
      setForm({ wardId:'', title:'', description:'', allocatedBudget:'', currentStage:'ALLOCATED', contractorName:'', mcaPriorityMatch:false, latitude:'', longitude:'' })
      setShowAdd(false)
      loadData()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Failed to create project' })
    } finally { setSaving(false) }
  }

  const handleStageUpdate = async (projectId: string) => {
    const stage = newStage[projectId]
    if (!stage) return
    setStageUpdating(projectId)
    try {
      const res  = await fetch(`/api/projects/${projectId}/stage`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ stage, notes: stageNotes[projectId] || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Stage updated to ${STAGE_LABELS[stage as Stage]}.` })
      setNewStage(s   => ({ ...s,   [projectId]: '' }))
      setStageNotes(n => ({ ...n,   [projectId]: '' }))
      loadData()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Stage update failed' })
    } finally { setStageUpdating(null) }
  }

  // Summary stats
  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = projects.filter(p => p.currentStage === s).length
    return acc
  }, {} as Record<string, number>)
  const totalBudget = projects.reduce((s, p) => s + p.allocatedBudget, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="Project Management"
        subtitle="Create and manage all funded county projects. Update delivery stages and monitor whistleblower reports."
        action={<Button variant="gold" icon="➕" onClick={() => setShowAdd(s => !s)}>New project</Button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {STAGES.map(s => (
          <StatCard key={s} label={STAGE_LABELS[s]} value={stageCounts[s] ?? 0}
            color={STAGE_COLORS[s]} icon={s === 'COMPLETED' ? '✅' : s === 'ONGOING' ? '🔨' : s === 'TENDERED' ? '📋' : '📁'} />
        ))}
      </div>
      <div className="bg-meruGreen/5 border border-meruGreen/20 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
        <span className="text-sm text-gray-600">Total allocated budget across {projects.length} projects</span>
        <span className="text-lg font-bold text-meruGreen">KSh {totalBudget.toLocaleString()}</span>
      </div>

      {/* Create form */}
      {showAdd && (
        <Card className="p-5 mb-6 border-meruGold/40 animate-slide-up">
          <p className="text-sm font-semibold text-neutralDark mb-4">➕ New County Project</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Ward *" value={form.wardId} onChange={e => setForm(f => ({ ...f, wardId: e.target.value }))}
              options={wards.map(w => ({ value: String(w.id), label: `${w.wardName} — ${w.subCounty}` }))}
              placeholder="Select ward…" required />
            <Select label="Initial stage" value={form.currentStage} onChange={e => setForm(f => ({ ...f, currentStage: e.target.value }))}
              options={STAGES.map(s => ({ value: s, label: STAGE_LABELS[s] }))} />
            <Input label="Project title *" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Timau Cold Storage Facility" className="sm:col-span-2" required />
            <Input label="Allocated budget (KSh) *" value={form.allocatedBudget} type="number"
              onChange={e => setForm(f => ({ ...f, allocatedBudget: e.target.value }))}
              placeholder="e.g. 18750000" required />
            <Input label="Contractor name" value={form.contractorName}
              onChange={e => setForm(f => ({ ...f, contractorName: e.target.value }))}
              placeholder="e.g. ColdTech Africa Ltd" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude (GPS)"  value={form.latitude}  type="number" onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}  placeholder="-0.046" />
              <Input label="Longitude (GPS)" value={form.longitude} type="number" onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} placeholder="37.649" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="checkbox" id="mca-match" checked={form.mcaPriorityMatch}
                onChange={e => setForm(f => ({ ...f, mcaPriorityMatch: e.target.checked }))}
                className="w-4 h-4 accent-meruGreen" />
              <label htmlFor="mca-match" className="text-sm text-gray-700">MCA priority match (both citizen and MCA proposed this)</label>
            </div>
            <Textarea label="Description (optional)" value={form.description} rows={3}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Brief description of the project scope…" className="sm:col-span-2" />
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleCreate}
              disabled={!form.wardId || !form.title || !form.allocatedBudget}>Create project</Button>
          </div>
        </Card>
      )}

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        {['', ...STAGES].map(s => (
          <button key={s} onClick={() => setStageFilter(s)}
            className={clsx('px-3 py-2 rounded-xl text-xs font-medium border transition-all min-h-[36px]',
              stageFilter === s
                ? 'bg-meruGreen text-white border-meruGreen'
                : 'bg-white text-gray-600 border-gray-200 hover:border-meruGreen/40'
            )}>
            {s ? STAGE_LABELS[s as Stage] : 'All projects'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading projects…</div>
      ) : projects.length === 0 ? (
        <EmptyState icon="🏗️" title="No projects" description="Create the first project using the button above." />
      ) : (
        <div className="space-y-3">
          {projects.map(p => {
            const isOpen = expanded === p.id
            return (
              <Card key={p.id} className={clsx('overflow-hidden', p.activeReportCount >= 3 && 'border-amber-300')}>
                <div className="px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isOpen ? null : p.id)}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm text-neutralDark">{p.title}</span>
                        {p.mcaPriorityMatch && <Badge variant="blue">🤝 MCA match</Badge>}
                        {p.activeReportCount > 0 && (
                          <Badge variant="amber">⚠ {p.activeReportCount} report{p.activeReportCount > 1 ? 's' : ''}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>📍 {p.ward.wardName}</span>
                        <span>💰 KSh {p.allocatedBudget.toLocaleString()}</span>
                        {p.contractorName && <span>🏗️ {p.contractorName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white px-2.5 py-1 rounded-full"
                        style={{ background: STAGE_COLORS[p.currentStage as Stage] ?? '#6b7280' }}>
                        {STAGE_LABELS[p.currentStage as Stage] ?? p.currentStage}
                      </span>
                      <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 pt-3 border-t border-gray-100 animate-fade-in space-y-4">
                    {p.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
                    )}

                    {/* Stage timeline */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Delivery timeline</p>
                      <div className="flex gap-0">
                        {STAGES.map((s, idx) => {
                          const stageIdx = STAGES.indexOf(p.currentStage as Stage)
                          const done = idx <= stageIdx
                          return (
                            <div key={s} className="flex-1 flex flex-col items-center gap-1">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: done ? STAGE_COLORS[s] : '#e5e7eb' }} />
                              <span className="text-[9px] text-center leading-tight font-medium"
                                style={{ color: done ? STAGE_COLORS[s] : '#9ca3af' }}>
                                {STAGE_LABELS[s]}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* History */}
                    {p.stageHistory.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">History</p>
                        <div className="space-y-1">
                          {p.stageHistory.map(h => (
                            <div key={h.id} className="flex items-start gap-2 text-xs text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                                style={{ background: STAGE_COLORS[h.stage as Stage] ?? '#9ca3af' }} />
                              <span className="font-medium text-neutralDark">{STAGE_LABELS[h.stage as Stage] ?? h.stage}</span>
                              {h.notes && <span>— {h.notes}</span>}
                              <span className="ml-auto shrink-0">{new Date(h.createdAt).toLocaleDateString('en-KE')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Update stage */}
                    {p.currentStage !== 'COMPLETED' && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-semibold text-gray-500">Update delivery stage</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select
                            value={newStage[p.id] ?? ''}
                            onChange={e => setNewStage(s => ({ ...s, [p.id]: e.target.value }))}
                            options={STAGES.filter(s => s !== p.currentStage).map(s => ({ value: s, label: STAGE_LABELS[s] }))}
                            placeholder="Select new stage…"
                            className="flex-1"
                          />
                          <Input
                            value={stageNotes[p.id] ?? ''}
                            onChange={e => setStageNotes(n => ({ ...n, [p.id]: e.target.value }))}
                            placeholder="Optional note…"
                            className="flex-1"
                          />
                          <Button variant="primary" size="sm" loading={stageUpdating === p.id}
                            disabled={!newStage[p.id]}
                            onClick={() => handleStageUpdate(p.id)}>
                            Update
                          </Button>
                        </div>
                      </div>
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
