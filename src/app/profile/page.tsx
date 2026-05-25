'use client'
// src/app/profile/page.tsx
// Citizen profile — view submissions, verification status, account details

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import { useAuth }             from '@/lib/auth-context'
import { useLanguage }         from '@/lib/language-context'
import { useRouter }           from 'next/navigation'
import { Card, Badge, StatCard, SectionHeader, EmptyState } from '@/components/ui'

interface Memo {
  id:               string
  referenceCode:    string
  fiscalYear:       string
  sectorCategory:   string
  moderationStatus: string
  createdAt:        string
  ward: { wardName: string; subCounty: string }
}

const STATUS_META: Record<string, { label: string; variant: 'green' | 'gray' | 'amber' | 'red' }> = {
  APPROVED:     { label: 'Approved',      variant: 'green' },
  PENDING:      { label: 'Pending Review',variant: 'gray'  },
  UNDER_REVIEW: { label: 'Under Review',  variant: 'amber' },
  SHADOW_BANNED:{ label: 'Processing',    variant: 'gray'  }, // never reveal shadow ban
}

export default function ProfilePage() {
  const { user, loading, logout } = useAuth()
  const { t }                     = useLanguage()
  const router                    = useRouter()
  const [memos,    setMemos]       = useState<Memo[]>([])
  const [memosLoading, setMemosLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/')
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    setMemosLoading(true)
    fetch(`/api/profile/memos`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setMemos(d.data) })
      .catch(() => {/* silently */})
      .finally(() => setMemosLoading(false))
  }, [user])

  if (loading || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="h-20 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <SectionHeader title="My Profile" subtitle="Your BaiteConnect account and submission history." />

      {/* Profile card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 bg-meruGreen rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-green-glow shrink-0">
            {user.fullName?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-neutralDark">{user.fullName}</h2>
            <p className="text-sm text-gray-500 font-mono mt-0.5">{user.phoneNumber}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="green">
                ✓ Phone Verified
              </Badge>
              <Badge variant={user.role === 'CITIZEN' ? 'gray' : 'blue'}>
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors shrink-0"
          >
            🚪 Sign Out
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard
          label="Memos submitted"
          value={memos.length}
          color="#01411C"
          icon="📝"
        />
        <StatCard
          label="Approved memos"
          value={memos.filter(m => m.moderationStatus === 'APPROVED').length}
          color="#2563eb"
          icon="✅"
        />
        <StatCard
          label="Fiscal years active"
          value={[...new Set(memos.map(m => m.fiscalYear))].length || '—'}
          color="#c8960c"
          icon="📅"
        />
      </div>

      {/* Admin access */}
      {['COUNTY_ADMIN', 'GOVERNOR_EXEC', 'MCA'].includes(user.role) && (
        <Card className="p-5 bg-green-50 border-meruGreen/20">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-meruGreen">Admin Access</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Your account has <strong>{user.role.replace('_', ' ')}</strong> privileges.
              </p>
            </div>
            <Link
              href="/admin"
              className="bg-meruGreen text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-green-900 transition-colors shrink-0"
            >
              ⚙️ Admin Dashboard
            </Link>
          </div>
        </Card>
      )}

      {/* Submission history */}
      <div>
        <h2 className="text-lg font-bold text-neutralDark mb-4">My Memoranda</h2>

        {memosLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : memos.length === 0 ? (
          <EmptyState
            icon="📝"
            title="No memos yet"
            description="You haven't submitted any budget memoranda yet. Submit your first memo to participate in the MTEF 2026/2027 process."
            action={
              <Link href="/submit" className="bg-meruGreen text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-green-900 transition-colors text-sm">
                Submit a Memo
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {memos.map(memo => {
              const st = STATUS_META[memo.moderationStatus] ?? STATUS_META.PENDING
              return (
                <Card key={memo.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-meruGreen">{memo.referenceCode}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <Badge variant="gray">{memo.sectorCategory}</Badge>
                      </div>
                      <p className="text-sm font-medium text-neutralDark">{memo.ward.wardName} Ward</p>
                      <p className="text-xs text-gray-400">{memo.ward.subCounty} · FY {memo.fiscalYear}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">
                      {new Date(memo.createdAt).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: '/submit',      icon: '📝', label: 'New Memo'       },
            { href: '/budget',      icon: '💰', label: 'Budget Tool'    },
            { href: '/projects',    icon: '🏗️', label: 'Projects'       },
            { href: '/leaderboard', icon: '🏆', label: 'Ward League'    },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 hover:bg-green-50 hover:text-meruGreen transition-colors text-center">
              <span className="text-xl">{l.icon}</span>
              <span className="text-xs font-medium text-gray-600">{l.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
