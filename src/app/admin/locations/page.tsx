'use client'
// src/app/admin/locations/page.tsx
// Full CRUD management panel for: Wards · Sub-Locations · Villages

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input, Select, Badge, Toast, EmptyState, SectionHeader } from '@/components/ui'
import { clsx } from 'clsx'

// ─── Types ────────────────────────────────────────────────────
interface Village {
  id: number; name: string; latitude?: number; longitude?: number
  estimatedPop?: number; notes?: string; isActive: boolean
}
interface SubLocation {
  id: number; wardId: number; name: string
  latitude?: number; longitude?: number; notes?: string
  isActive: boolean; villages: Village[]
  _count?: { villages: number }
}
interface Ward {
  id: number; wardName: string; subCounty: string
  isActive: boolean; mcaName?: string | null
  subLocationCount?: number
  _count?: { memoranda: number; projects: number }
}
type ToastState = { type: 'success'|'error'|'warning'; message: string } | null
type ActiveTab  = 'wards' | 'sublocations' | 'villages'

const SUB_COUNTIES = [
  'Igembe North','Igembe Central','Igembe South',
  'Tigania West','Tigania East','Central Imenti',
  'North Imenti','South Imenti','Buuri',
]

// ─── Sub-component: Confirm Dialog ───────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-card-lg p-6 max-w-sm w-full animate-slide-up">
        <p className="text-sm text-neutralDark mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="danger"    fullWidth onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-component: Inline form row ──────────────────────────
function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
      <span className="text-xs font-medium text-gray-500 sm:w-28 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// WARDS PANEL
// ─────────────────────────────────────────────────────────────
function WardsPanel({ onWardSelect }: { onWardSelect: (id: number, name: string) => void }) {
  const [wards,    setWards]    = useState<Ward[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [filterSC, setFilterSC] = useState('')
  const [showAdd,  setShowAdd]  = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [confirm,  setConfirm]  = useState<{ wardId: number; wardName: string } | null>(null)
  const [editId,   setEditId]   = useState<number | null>(null)

  const [newWard, setNewWard] = useState({ wardName: '', subCounty: '' })
  const [editVal, setEditVal] = useState({ wardName: '', subCounty: '', isActive: true })
  const [saving,  setSaving]  = useState(false)

  const fetchWards = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterSC) params.set('subCounty', filterSC)
      if (search)   params.set('search', search)
      const res  = await fetch(`/api/admin/wards?${params}`)
      const data = await res.json()
      if (data.success) setWards(data.data)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [filterSC, search])

  useEffect(() => { fetchWards() }, [fetchWards])

  const handleAdd = async () => {
    if (!newWard.wardName.trim() || !newWard.subCounty) return
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/wards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(newWard),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Ward "${data.data.wardName}" added successfully.` })
      setNewWard({ wardName: '', subCounty: '' })
      setShowAdd(false)
      fetchWards()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Failed to add ward' })
    } finally { setSaving(false) }
  }

  const handleEdit = async (wardId: number) => {
    setSaving(true)
    try {
      const res  = await fetch(`/api/admin/wards/${wardId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(editVal),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Ward updated.' })
      setEditId(null)
      fetchWards()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Update failed' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (wardId: number) => {
    try {
      const res  = await fetch(`/api/admin/wards/${wardId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Ward removed.' })
      fetchWards()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Deletion failed' })
    } finally { setConfirm(null) }
  }

  // Group by sub-county for display
  const grouped: Record<string, Ward[]> = {}
  for (const w of wards) {
    if (!grouped[w.subCounty]) grouped[w.subCounty] = []
    grouped[w.subCounty].push(w)
  }

  return (
    <div className="space-y-4">
      {toast    && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm  && (
        <ConfirmDialog
          message={`Delete "${confirm.wardName}"? This is permanent and cannot be undone if the ward has memoranda.`}
          onConfirm={() => handleDelete(confirm.wardId)}
          onCancel={()  => setConfirm(null)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ward name…"
          className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-meruGreen/30 min-h-[44px]"
        />
        <select
          value={filterSC}
          onChange={e => setFilterSC(e.target.value)}
          className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-meruGreen/30 min-h-[44px]"
        >
          <option value="">All sub-counties</option>
          {SUB_COUNTIES.map(sc => <option key={sc} value={sc}>{sc}</option>)}
        </select>
        <Button variant="gold" onClick={() => setShowAdd(s => !s)} icon="➕">
          Add ward
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <Card className="p-4 border-meruGold/40 animate-slide-up">
          <p className="text-sm font-semibold text-neutralDark mb-3">➕ New Ward</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Ward name"
              value={newWard.wardName}
              onChange={e => setNewWard(w => ({ ...w, wardName: e.target.value }))}
              placeholder="e.g. Nkuene North"
              required
            />
            <Select
              label="Sub-county"
              value={newWard.subCounty}
              onChange={e => setNewWard(w => ({ ...w, subCounty: e.target.value }))}
              options={SUB_COUNTIES.map(sc => ({ value: sc, label: sc }))}
              placeholder="Select sub-county…"
              required
            />
          </div>
          <div className="flex gap-3 mt-3">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd}
              disabled={!newWard.wardName || !newWard.subCounty}>
              Save ward
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            ⚠ Note: The 45 official Meru County wards are already seeded. Only add new wards if gazette boundaries change.
          </p>
        </Card>
      )}

      {/* Ward table */}
      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading wards…</div>
      ) : wards.length === 0 ? (
        <EmptyState icon="🗺️" title="No wards found" description="Try adjusting your search or sub-county filter." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([sc, scWards]) => (
            <div key={sc}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>{sc}</span>
                <span className="font-normal text-gray-300">({scWards.length} wards)</span>
              </h3>
              <Card className="overflow-hidden divide-y divide-gray-50">
                {scWards.map(ward => (
                  <div key={ward.id} className={clsx('px-4 py-3', !ward.isActive && 'opacity-50 bg-gray-50')}>
                    {editId === ward.id ? (
                      // Inline edit row
                      <div className="space-y-2">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Input
                            value={editVal.wardName}
                            onChange={e => setEditVal(v => ({ ...v, wardName: e.target.value }))}
                            placeholder="Ward name"
                          />
                          <Select
                            value={editVal.subCounty}
                            onChange={e => setEditVal(v => ({ ...v, subCounty: e.target.value }))}
                            options={SUB_COUNTIES.map(s => ({ value: s, label: s }))}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editVal.isActive}
                              onChange={e => setEditVal(v => ({ ...v, isActive: e.target.checked }))}
                              className="w-4 h-4 accent-meruGreen"
                            />
                            Active (visible to residents)
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" loading={saving} onClick={() => handleEdit(ward.id)}>Save</Button>
                          <Button variant="ghost"   size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      // Display row
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-neutralDark">{ward.wardName}</span>
                            {!ward.isActive && <Badge variant="gray">Inactive</Badge>}
                            {ward.mcaName  && <Badge variant="blue">MCA: {ward.mcaName}</Badge>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            <span>📝 {ward._count?.memoranda ?? 0} memos</span>
                            <span>🏗️ {ward._count?.projects ?? 0} projects</span>
                            <span>📍 {ward.subLocationCount ?? 0} sub-locations</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onWardSelect(ward.id, ward.wardName)}
                            className="text-xs text-meruGreen border border-meruGreen/30 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors min-h-[34px]"
                          >
                            📍 Sub-locations
                          </button>
                          <button
                            onClick={() => { setEditId(ward.id); setEditVal({ wardName: ward.wardName, subCounty: ward.subCounty, isActive: ward.isActive }) }}
                            className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors min-h-[34px]"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => setConfirm({ wardId: ward.id, wardName: ward.wardName })}
                            className="text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors min-h-[34px]"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// SUB-LOCATIONS PANEL
// ─────────────────────────────────────────────────────────────
function SubLocationsPanel({
  filterWardId, filterWardName, allWards,
  onSubLocationSelect,
}: {
  filterWardId:       number | null
  filterWardName:     string
  allWards:           { id: number; wardName: string; subCounty: string }[]
  onSubLocationSelect:(id: number, name: string) => void
}) {
  const [subLocs,  setSubLocs]  = useState<SubLocation[]>([])
  const [loading,  setLoading]  = useState(false)
  const [showAdd,  setShowAdd]  = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [saving,   setSaving]   = useState(false)
  const [editId,   setEditId]   = useState<number | null>(null)
  const [editVal,  setEditVal]  = useState({ name: '', latitude: '', longitude: '', notes: '' })
  const [confirm,  setConfirm]  = useState<{ id: number; name: string } | null>(null)
  const [newSL, setNewSL]       = useState({ wardId: filterWardId ?? 0, name: '', latitude: '', longitude: '', notes: '' })

  const fetchSubLocs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterWardId) params.set('wardId', String(filterWardId))
      const res  = await fetch(`/api/admin/sub-locations?${params}`)
      const data = await res.json()
      if (data.success) setSubLocs(data.data)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [filterWardId])

  useEffect(() => { fetchSubLocs() }, [fetchSubLocs])
  useEffect(() => { setNewSL(s => ({ ...s, wardId: filterWardId ?? 0 })) }, [filterWardId])

  const handleAdd = async () => {
    if (!newSL.name.trim() || !newSL.wardId) return
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/sub-locations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({
          wardId:    newSL.wardId,
          name:      newSL.name,
          latitude:  newSL.latitude  ? parseFloat(newSL.latitude)  : undefined,
          longitude: newSL.longitude ? parseFloat(newSL.longitude) : undefined,
          notes:     newSL.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Sub-location "${data.data.name}" added.` })
      setNewSL(s => ({ ...s, name: '', latitude: '', longitude: '', notes: '' }))
      setShowAdd(false)
      fetchSubLocs()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Failed' })
    } finally { setSaving(false) }
  }

  const handleEdit = async (id: number) => {
    setSaving(true)
    try {
      const res  = await fetch(`/api/admin/sub-locations/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({
          name:      editVal.name,
          latitude:  editVal.latitude  ? parseFloat(editVal.latitude)  : undefined,
          longitude: editVal.longitude ? parseFloat(editVal.longitude) : undefined,
          notes:     editVal.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Sub-location updated.' })
      setEditId(null)
      fetchSubLocs()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Update failed' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      const res  = await fetch(`/api/admin/sub-locations/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Sub-location deleted.' })
      fetchSubLocs()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Delete failed' })
    } finally { setConfirm(null) }
  }

  return (
    <div className="space-y-4">
      {toast   && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmDialog
          message={`Delete sub-location "${confirm.name}" and all its villages?`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={()  => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          {filterWardName
            ? <p className="text-sm text-gray-500">Showing sub-locations in <strong className="text-meruGreen">{filterWardName}</strong></p>
            : <p className="text-sm text-gray-500">All sub-locations</p>}
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowAdd(s => !s)} icon="➕">
          Add sub-location
        </Button>
      </div>

      {showAdd && (
        <Card className="p-4 border-meruGold/40 animate-slide-up">
          <p className="text-sm font-semibold text-neutralDark mb-3">➕ New Sub-Location</p>
          <div className="space-y-3">
            {!filterWardId && (
              <Select
                label="Ward"
                value={String(newSL.wardId || '')}
                onChange={e => setNewSL(s => ({ ...s, wardId: parseInt(e.target.value, 10) }))}
                options={allWards.map(w => ({ value: String(w.id), label: `${w.wardName} (${w.subCounty})` }))}
                placeholder="Select ward…"
                required
              />
            )}
            <Input label="Sub-location name" value={newSL.name} onChange={e => setNewSL(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Njia Panda" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude (optional)"  value={newSL.latitude}  onChange={e => setNewSL(s => ({ ...s, latitude: e.target.value }))}  placeholder="-0.046" type="number" />
              <Input label="Longitude (optional)" value={newSL.longitude} onChange={e => setNewSL(s => ({ ...s, longitude: e.target.value }))} placeholder="37.649" type="number" />
            </div>
            <Input label="Notes (optional)" value={newSL.notes} onChange={e => setNewSL(s => ({ ...s, notes: e.target.value }))} placeholder="Any relevant notes…" />
          </div>
          <div className="flex gap-3 mt-3">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd} disabled={!newSL.name || !newSL.wardId}>Save</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      ) : subLocs.length === 0 ? (
        <EmptyState icon="📍" title="No sub-locations yet"
          description={filterWardName ? `Add the first sub-location to ${filterWardName} using the button above.` : 'Select a ward or add sub-locations using the button above.'} />
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-50">
          {subLocs.map(sl => (
            <div key={sl.id} className="px-4 py-3">
              {editId === sl.id ? (
                <div className="space-y-2">
                  <Input value={editVal.name} onChange={e => setEditVal(v => ({ ...v, name: e.target.value }))} placeholder="Name" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editVal.latitude}  onChange={e => setEditVal(v => ({ ...v, latitude: e.target.value }))}  placeholder="Lat" type="number" />
                    <Input value={editVal.longitude} onChange={e => setEditVal(v => ({ ...v, longitude: e.target.value }))} placeholder="Lng" type="number" />
                  </div>
                  <Input value={editVal.notes} onChange={e => setEditVal(v => ({ ...v, notes: e.target.value }))} placeholder="Notes" />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={saving} onClick={() => handleEdit(sl.id)}>Save</Button>
                    <Button variant="ghost"   size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-neutralDark">📍 {sl.name}</span>
                      <Badge variant="gray">{sl._count?.villages ?? sl.villages?.length ?? 0} villages</Badge>
                      {sl.latitude && <Badge variant="blue">GPS ✓</Badge>}
                    </div>
                    {sl.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{sl.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onSubLocationSelect(sl.id, sl.name)}
                      className="text-xs text-meruGreen border border-meruGreen/30 px-2.5 py-1.5 rounded-lg hover:bg-green-50 min-h-[34px]"
                    >
                      🏘️ Villages
                    </button>
                    <button
                      onClick={() => { setEditId(sl.id); setEditVal({ name: sl.name, latitude: String(sl.latitude ?? ''), longitude: String(sl.longitude ?? ''), notes: sl.notes ?? '' }) }}
                      className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 min-h-[34px]"
                    >✏️</button>
                    <button
                      onClick={() => setConfirm({ id: sl.id, name: sl.name })}
                      className="text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 min-h-[34px]"
                    >🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// VILLAGES PANEL
// ─────────────────────────────────────────────────────────────
function VillagesPanel({
  filterSubLocId, filterSubLocName,
}: {
  filterSubLocId:   number | null
  filterSubLocName: string
}) {
  const [villages,  setVillages] = useState<Village[]>([])
  const [loading,   setLoading]  = useState(false)
  const [showAdd,   setShowAdd]  = useState(false)
  const [toast,     setToast]    = useState<ToastState>(null)
  const [saving,    setSaving]   = useState(false)
  const [editId,    setEditId]   = useState<number | null>(null)
  const [confirm,   setConfirm]  = useState<{ id: number; name: string } | null>(null)

  const [newV,  setNewV]  = useState({ name: '', latitude: '', longitude: '', estimatedPop: '', notes: '' })
  const [editV, setEditV] = useState({ name: '', latitude: '', longitude: '', estimatedPop: '', notes: '' })

  const fetchVillages = useCallback(async () => {
    if (!filterSubLocId) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/admin/villages?subLocationId=${filterSubLocId}`)
      const data = await res.json()
      if (data.success) setVillages(data.data)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [filterSubLocId])

  useEffect(() => { fetchVillages() }, [fetchVillages])

  const handleAdd = async () => {
    if (!newV.name.trim() || !filterSubLocId) return
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/villages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({
          subLocationId: filterSubLocId,
          name:          newV.name,
          latitude:      newV.latitude      ? parseFloat(newV.latitude)      : undefined,
          longitude:     newV.longitude     ? parseFloat(newV.longitude)     : undefined,
          estimatedPop:  newV.estimatedPop  ? parseInt(newV.estimatedPop)    : undefined,
          notes:         newV.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Village "${data.data.name}" added.` })
      setNewV({ name:'', latitude:'', longitude:'', estimatedPop:'', notes:'' })
      setShowAdd(false)
      fetchVillages()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Failed' })
    } finally { setSaving(false) }
  }

  const handleEdit = async (id: number) => {
    setSaving(true)
    try {
      const res  = await fetch(`/api/admin/villages/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({
          name:         editV.name,
          latitude:     editV.latitude     ? parseFloat(editV.latitude)     : undefined,
          longitude:    editV.longitude    ? parseFloat(editV.longitude)    : undefined,
          estimatedPop: editV.estimatedPop ? parseInt(editV.estimatedPop)   : undefined,
          notes:        editV.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Village updated.' })
      setEditId(null)
      fetchVillages()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Update failed' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      const res  = await fetch(`/api/admin/villages/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: 'Village deleted.' })
      fetchVillages()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Delete failed' })
    } finally { setConfirm(null) }
  }

  if (!filterSubLocId) {
    return <EmptyState icon="🏘️" title="Select a sub-location" description="Navigate to Wards → Sub-Locations, then tap Villages to manage village-level entries." />
  }

  return (
    <div className="space-y-4">
      {toast   && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && (
        <ConfirmDialog
          message={`Delete village "${confirm.name}"?`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={()  => setConfirm(null)}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Villages in <strong className="text-meruGreen">{filterSubLocName}</strong></p>
        <Button variant="gold" size="sm" onClick={() => setShowAdd(s => !s)} icon="➕">Add village</Button>
      </div>

      {showAdd && (
        <Card className="p-4 border-meruGold/40 animate-slide-up">
          <p className="text-sm font-semibold mb-3">➕ New Village</p>
          <div className="space-y-3">
            <Input label="Village name" value={newV.name} onChange={e => setNewV(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Kiangua" required />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude"     value={newV.latitude}     onChange={e => setNewV(v => ({ ...v, latitude: e.target.value }))}     placeholder="-0.046" type="number" />
              <Input label="Longitude"    value={newV.longitude}    onChange={e => setNewV(v => ({ ...v, longitude: e.target.value }))}    placeholder="37.649" type="number" />
            </div>
            <Input label="Est. population" value={newV.estimatedPop} onChange={e => setNewV(v => ({ ...v, estimatedPop: e.target.value }))} placeholder="e.g. 1200" type="number" />
            <Input label="Notes"           value={newV.notes}        onChange={e => setNewV(v => ({ ...v, notes: e.target.value }))}        placeholder="Optional notes" />
          </div>
          <div className="flex gap-3 mt-3">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd} disabled={!newV.name}>Save</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-400 text-sm">Loading…</div>
      ) : villages.length === 0 ? (
        <EmptyState icon="🏘️" title="No villages yet" description="Add the first village to this sub-location." />
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-50">
          {villages.map(v => (
            <div key={v.id} className="px-4 py-3">
              {editId === v.id ? (
                <div className="space-y-2">
                  <Input value={editV.name} onChange={e => setEditV(ev => ({ ...ev, name: e.target.value }))} placeholder="Village name" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editV.latitude}     onChange={e => setEditV(ev => ({ ...ev, latitude: e.target.value }))}     placeholder="Lat" type="number" />
                    <Input value={editV.longitude}    onChange={e => setEditV(ev => ({ ...ev, longitude: e.target.value }))}    placeholder="Lng" type="number" />
                  </div>
                  <Input value={editV.estimatedPop} onChange={e => setEditV(ev => ({ ...ev, estimatedPop: e.target.value }))} placeholder="Est. population" type="number" />
                  <Input value={editV.notes}         onChange={e => setEditV(ev => ({ ...ev, notes: e.target.value }))}         placeholder="Notes" />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={saving} onClick={() => handleEdit(v.id)}>Save</Button>
                    <Button variant="ghost"   size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-neutralDark">🏘️ {v.name}</span>
                      {v.estimatedPop && <Badge variant="gray">{v.estimatedPop.toLocaleString()} people</Badge>}
                      {v.latitude && <Badge variant="blue">GPS ✓</Badge>}
                    </div>
                    {v.notes && <p className="text-xs text-gray-400 mt-0.5">{v.notes}</p>}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditId(v.id); setEditV({ name: v.name, latitude: String(v.latitude ?? ''), longitude: String(v.longitude ?? ''), estimatedPop: String(v.estimatedPop ?? ''), notes: v.notes ?? '' }) }}
                      className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 min-h-[34px]"
                    >✏️</button>
                    <button
                      onClick={() => setConfirm({ id: v.id, name: v.name })}
                      className="text-xs text-red-500 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-50 min-h-[34px]"
                    >🗑</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
export default function LocationsManagementPage() {
  const [activeTab,        setActiveTab]        = useState<ActiveTab>('wards')
  const [selectedWardId,   setSelectedWardId]   = useState<number | null>(null)
  const [selectedWardName, setSelectedWardName] = useState('')
  const [selectedSubLocId,   setSelectedSubLocId]   = useState<number | null>(null)
  const [selectedSubLocName, setSelectedSubLocName] = useState('')
  const [allWards, setAllWards] = useState<{ id: number; wardName: string; subCounty: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/wards')
      .then(r => r.json())
      .then(d => { if (d.success) setAllWards(d.data.map((w: Ward) => ({ id: w.id, wardName: w.wardName, subCounty: w.subCounty }))) })
      .catch(() => {/* silently */})
  }, [])

  const handleWardSelect = (id: number, name: string) => {
    setSelectedWardId(id); setSelectedWardName(name)
    setSelectedSubLocId(null); setSelectedSubLocName('')
    setActiveTab('sublocations')
  }

  const handleSubLocSelect = (id: number, name: string) => {
    setSelectedSubLocId(id); setSelectedSubLocName(name)
    setActiveTab('villages')
  }

  const TABS: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'wards',        label: 'Wards (45)',     icon: '🗺️' },
    { key: 'sublocations', label: 'Sub-Locations',  icon: '📍' },
    { key: 'villages',     label: 'Villages',       icon: '🏘️' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <SectionHeader
        title="Ward & Locations Management"
        subtitle="Manage the full administrative geography of Meru County — wards, sub-locations, and villages. Changes here update live across all citizen-facing forms."
      />

      {/* Breadcrumb */}
      {(selectedWardName || selectedSubLocName) && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
          <button onClick={() => { setActiveTab('wards'); setSelectedWardId(null); setSelectedWardName(''); setSelectedSubLocId(null); setSelectedSubLocName('') }}
            className="hover:text-meruGreen transition-colors">All Wards</button>
          {selectedWardName && (
            <>
              <span className="text-gray-300">/</span>
              <button onClick={() => { setActiveTab('sublocations'); setSelectedSubLocId(null); setSelectedSubLocName('') }}
                className="hover:text-meruGreen transition-colors text-meruGreen font-medium">{selectedWardName}</button>
            </>
          )}
          {selectedSubLocName && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-meruGreen font-medium">{selectedSubLocName}</span>
            </>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150',
              activeTab === tab.key
                ? 'bg-white text-meruGreen shadow-card'
                : 'text-gray-500 hover:text-neutralDark'
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Panels */}
      {activeTab === 'wards'        && <WardsPanel onWardSelect={handleWardSelect} />}
      {activeTab === 'sublocations' && (
        <SubLocationsPanel
          filterWardId={selectedWardId}
          filterWardName={selectedWardName}
          allWards={allWards}
          onSubLocationSelect={handleSubLocSelect}
        />
      )}
      {activeTab === 'villages' && (
        <VillagesPanel
          filterSubLocId={selectedSubLocId}
          filterSubLocName={selectedSubLocName}
        />
      )}

      {/* Info box */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Geographic Hierarchy</p>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Sub-County</strong> (9 total) → stored as a text field on each Ward. Cannot be deleted without reassigning wards.</p>
          <p><strong>Ward</strong> (45 seeded) → the primary unit for public participation and project assignment. New wards can only be added if gazette boundaries change.</p>
          <p><strong>Sub-Location</strong> → used for granular project location tagging and future GIS precision. Not yet exposed to citizens in the form (roadmap item).</p>
          <p><strong>Village</strong> → optional population-level detail. Used by the MYS dispatch module to route maintenance teams.</p>
        </div>
      </div>
    </div>
  )
}
