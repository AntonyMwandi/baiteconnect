'use client'
// src/app/admin/subcounties/page.tsx
// Manage the 9 sub-counties of Meru County
// Sub-counties live as string fields on wards, so management = batch-updating ward.subCounty values

import { useState, useEffect } from 'react'
import { Card, Button, Input, Badge, Toast, SectionHeader } from '@/components/ui'
import { clsx } from 'clsx'

interface SubCountySummary {
  name:       string
  wardCount:  number
  memoCount:  number
  isSeeded:   boolean
}

type ToastState = { type: 'success'|'error'|'warning'; message: string } | null

const SEEDED_SUB_COUNTIES = [
  'Igembe North','Igembe Central','Igembe South',
  'Tigania West','Tigania East','Central Imenti',
  'North Imenti','South Imenti','Buuri',
]

export default function SubCountiesPage() {
  const [summaries, setSummaries] = useState<SubCountySummary[]>([])
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState<ToastState>(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [newName,   setNewName]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [renaming,  setRenaming]  = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState('')

  const loadSummaries = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/wards')
      const data = await res.json()
      if (!data.success) return

      // Aggregate by sub-county
      const map: Record<string, SubCountySummary> = {}
      for (const ward of data.data) {
        if (!map[ward.subCounty]) {
          map[ward.subCounty] = {
            name:      ward.subCounty,
            wardCount: 0,
            memoCount: 0,
            isSeeded:  SEEDED_SUB_COUNTIES.includes(ward.subCounty),
          }
        }
        map[ward.subCounty].wardCount++
        map[ward.subCounty].memoCount += ward._count?.memoranda ?? 0
      }
      setSummaries(Object.values(map).sort((a, b) => a.name.localeCompare(b.name)))
    } catch { /* silently */ }
    finally { setLoading(false) }
  }

  useEffect(() => { loadSummaries() }, [])

  // Adding a new sub-county means creating a placeholder ward under it,
  // which the admin can then populate or rename
  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    if (summaries.find(s => s.name.toLowerCase() === name.toLowerCase())) {
      setToast({ type: 'warning', message: `Sub-county "${name}" already exists.` })
      return
    }
    setSaving(true)
    try {
      // Create a placeholder ward so the sub-county exists in the system
      const res  = await fetch('/api/admin/wards', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ wardName: `${name} Ward (placeholder)`, subCounty: name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Sub-county "${name}" created with a placeholder ward. Add real wards in the Wards panel.` })
      setNewName('')
      setShowAdd(false)
      loadSummaries()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Failed to create sub-county' })
    } finally { setSaving(false) }
  }

  // Renaming a sub-county = batch PATCH all wards in that sub-county
  const handleRename = async (oldName: string) => {
    const newVal = renameVal.trim()
    if (!newVal || newVal === oldName) { setRenaming(null); return }
    setSaving(true)
    try {
      // Fetch all wards in old sub-county
      const res   = await fetch(`/api/admin/wards?subCounty=${encodeURIComponent(oldName)}`)
      const data  = await res.json()
      if (!data.success) throw new Error('Could not load wards')

      // Batch rename
      const results = await Promise.all(
        data.data.map((w: { id: number }) =>
          fetch(`/api/admin/wards/${w.id}`, {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ subCounty: newVal }),
          })
        )
      )
      const allOk = results.every(r => r.ok)
      if (!allOk) throw new Error('Some wards could not be renamed')

      setToast({ type: 'success', message: `Renamed "${oldName}" → "${newVal}" across ${data.data.length} wards.` })
      setRenaming(null)
      setRenameVal('')
      loadSummaries()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Rename failed' })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="Sub-County Management"
        subtitle="Meru County has 9 gazetted sub-counties. You can rename or add administrative divisions here."
        action={
          <Button variant="gold" icon="➕" onClick={() => setShowAdd(s => !s)}>
            Add sub-county
          </Button>
        }
      />

      {/* Add form */}
      {showAdd && (
        <Card className="p-5 mb-6 border-meruGold/40 animate-slide-up">
          <p className="text-sm font-semibold text-neutralDark mb-3">➕ New Sub-County</p>
          <div className="flex gap-3">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Imenti East"
              className="flex-1"
            />
            <Button variant="primary" loading={saving} onClick={handleAdd} disabled={!newName.trim()}>
              Create
            </Button>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            ⚠️ Sub-county additions should only be made following official gazettement by the Kenya National Bureau of Statistics. A placeholder ward will be created automatically — replace it with real wards in the Wards panel.
          </p>
        </Card>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading sub-counties…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {summaries.map(sc => (
            <Card key={sc.name} className="p-5">
              {renaming === sc.name ? (
                <div className="space-y-3">
                  <Input
                    label="New sub-county name"
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    placeholder={sc.name}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={saving} onClick={() => handleRename(sc.name)}
                      disabled={!renameVal.trim() || renameVal === sc.name}>
                      Save rename
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setRenaming(null); setRenameVal('') }}>
                      Cancel
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">
                    This will update the sub-county field on all {sc.wardCount} wards in this division.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-neutralDark text-base">{sc.name}</h3>
                      {sc.isSeeded && (
                        <Badge variant="green" className="mt-1">
                          ✓ Gazetted
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => { setRenaming(sc.name); setRenameVal(sc.name) }}
                      className="text-xs text-gray-400 hover:text-meruGreen border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      ✏️ Rename
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutralLight rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-meruGreen">{sc.wardCount}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Wards</p>
                    </div>
                    <div className="bg-neutralLight rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-meruBrown">{sc.memoCount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Submissions</p>
                    </div>
                  </div>

                  {/* Mini ward list */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1.5">Quick links</p>
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        href={`/admin/locations?subCounty=${encodeURIComponent(sc.name)}`}
                        className="text-xs text-meruGreen border border-meruGreen/25 px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        🗺️ View wards
                      </a>
                      <a
                        href={`/leaderboard?subCounty=${encodeURIComponent(sc.name)}`}
                        className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        🏆 Leaderboard
                      </a>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-blue-800 mb-2">ℹ️ About Sub-County Administration</p>
        <div className="text-sm text-blue-700 space-y-1.5 leading-relaxed">
          <p>Sub-counties in BaiteConnect are stored as a text label on each ward — they are not a separate database entity. This means renaming a sub-county here will batch-update all wards that carry that label.</p>
          <p>The 9 gazetted sub-counties of Meru County cannot be deleted as long as they contain wards with active submissions. Deactivate individual wards first if you need to consolidate boundaries.</p>
          <p>For official boundary changes, contact the Kenya National Bureau of Statistics (KNBS) and update the PostGIS ward polygon data in the <code className="bg-blue-100 px-1 rounded">001_add_postgis_ward_boundaries.sql</code> migration file.</p>
        </div>
      </div>
    </div>
  )
}
