'use client'
// src/app/admin/users/page.tsx
// Manage user roles — assign MCA, Admin, Governor Exec roles

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input, Badge, Select, Toast, SectionHeader, EmptyState } from '@/components/ui'

interface User {
  id:              string
  fullName:        string
  phoneNumber:     string
  role:            string
  isPhoneVerified: boolean
  assignedWardId:  number | null
  createdAt:       string
  managedWards?:   { wardName: string; subCounty: string }[]
}

type ToastState = { type: 'success'|'error'; message: string } | null

const ROLE_LABELS: Record<string, { label: string; color: 'green'|'gold'|'blue'|'gray' }> = {
  CITIZEN:       { label: 'Citizen',       color: 'gray'  },
  MCA:           { label: 'MCA',           color: 'blue'  },
  COUNTY_ADMIN:  { label: 'County Admin',  color: 'green' },
  GOVERNOR_EXEC: { label: 'Governor Exec', color: 'gold'  },
}

export default function UsersPage() {
  const [users,    setUsers]    = useState<User[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [toast,    setToast]    = useState<ToastState>(null)
  const [editId,   setEditId]   = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [page,     setPage]     = useState(1)
  const PAGE_SIZE = 20

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) })
      if (search)     params.set('search', search)
      if (roleFilter) params.set('role',   roleFilter)
      const res  = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (data.success) setUsers(data.data.users)
    } catch { /* silently */ }
    finally { setLoading(false) }
  }, [search, roleFilter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleUpdate = async (userId: string) => {
    if (!editRole) return
    setSaving(true)
    try {
      const res  = await fetch(`/api/admin/users/${userId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role: editRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToast({ type: 'success', message: `Role updated to ${editRole}.` })
      setEditId(null)
      fetchUsers()
    } catch (e: unknown) {
      setToast({ type: 'error', message: e instanceof Error ? e.message : 'Role update failed' })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <SectionHeader
        title="Users & Roles"
        subtitle="Manage registered residents and assign administrative roles."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name or phone…"
          className="flex-1"
          icon="🔍"
        />
        <Select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          options={[
            { value: 'CITIZEN',       label: 'Citizens'       },
            { value: 'MCA',           label: 'MCAs'           },
            { value: 'COUNTY_ADMIN',  label: 'County Admins'  },
            { value: 'GOVERNOR_EXEC', label: 'Governor Exec'  },
          ]}
          placeholder="All roles"
          className="sm:w-48"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading users…</div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" description="Try adjusting your search or role filter." />
      ) : (
        <Card className="overflow-hidden divide-y divide-gray-50">
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_100px_80px] gap-3 px-4 py-2.5 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>User</span>
            <span>Phone</span>
            <span>Role</span>
            <span className="text-right">Actions</span>
          </div>

          {users.map(user => {
            const roleInfo = ROLE_LABELS[user.role] ?? ROLE_LABELS.CITIZEN
            return (
              <div key={user.id} className="px-4 py-3">
                {editId === user.id ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-neutralDark flex-1">{user.fullName}</span>
                    <Select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value)}
                      options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l.label }))}
                      className="w-44"
                    />
                    <Button variant="primary" size="sm" loading={saving} onClick={() => handleRoleUpdate(user.id)}>Save</Button>
                    <Button variant="ghost"   size="sm" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-[1fr_120px_100px_80px] gap-3 items-center">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutralDark truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(user.createdAt).toLocaleDateString('en-KE')}
                        {!user.isPhoneVerified && <span className="ml-2 text-amber-500">⚠ Unverified</span>}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate font-mono">{user.phoneNumber}</p>
                    <Badge variant={roleInfo.color}>{roleInfo.label}</Badge>
                    <div className="flex justify-end">
                      <button
                        onClick={() => { setEditId(user.id); setEditRole(user.role) }}
                        className="text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 min-h-[32px]"
                      >✏️ Role</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-6">
        <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</Button>
        <span className="flex items-center text-sm text-gray-500">Page {page}</span>
        <Button variant="secondary" size="sm" disabled={users.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}>Next →</Button>
      </div>
    </div>
  )
}
