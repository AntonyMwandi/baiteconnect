'use client'
// src/components/dashboard/WardLeaderboard.tsx

import { useLanguage }  from '@/lib/language-context'
import { Badge }        from '@/components/ui'
import { clsx }         from 'clsx'

interface WardRow {
  id:              number
  wardName:        string
  subCounty:       string
  submissionCount: number
  rank:            number
  mcaName?:        string | null
}

const MEDAL: Record<number, { icon: string; bg: string; text: string }> = {
  1: { icon: '🥇', bg: 'bg-yellow-50 border-yellow-200',  text: 'text-yellow-700' },
  2: { icon: '🥈', bg: 'bg-gray-50 border-gray-200',      text: 'text-gray-600'  },
  3: { icon: '🥉', bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700' },
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-16 sm:w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-meruGreen rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function WardLeaderboard({
  wards,
  compact = false,
}: {
  wards:    WardRow[]
  compact?: boolean
}) {
  const { t } = useLanguage()
  const maxCount = wards[0]?.submissionCount ?? 1
  const display  = compact ? wards.slice(0, 10) : wards

  if (!display.length) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No ward data available yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[36px_1fr_auto_80px] gap-2 px-3 sm:px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
        <span>#</span>
        <span>{t('leaderboard', 'ward')}</span>
        <span className="hidden sm:block">{t('leaderboard', 'subCounty')}</span>
        <span className="text-right">{t('leaderboard', 'submissions')}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {display.map(ward => {
          const medal = MEDAL[ward.rank]
          return (
            <div
              key={ward.id}
              className={clsx(
                'grid grid-cols-[36px_1fr_auto_80px] gap-2 px-3 sm:px-4 py-3 items-center hover:bg-gray-50/80 transition-colors',
                medal && `${medal.bg}`
              )}
            >
              {/* Rank */}
              <div className="flex items-center justify-center">
                {medal ? (
                  <span className="text-lg leading-none">{medal.icon}</span>
                ) : (
                  <span className="text-xs font-semibold text-gray-400 w-6 text-center">{ward.rank}</span>
                )}
              </div>

              {/* Ward name */}
              <div className="min-w-0">
                <p className={clsx('text-sm font-semibold leading-tight truncate', medal ? medal.text : 'text-neutralDark')}>
                  {ward.wardName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 sm:hidden truncate">{ward.subCounty}</p>
                {ward.rank <= 3 && (
                  <div className="mt-1">
                    <MiniBar value={ward.submissionCount} max={maxCount} />
                  </div>
                )}
              </div>

              {/* Sub-county (hidden on mobile) */}
              <div className="hidden sm:block">
                <Badge variant="gray">{ward.subCounty}</Badge>
              </div>

              {/* Count */}
              <div className="text-right">
                <span className={clsx(
                  'text-sm font-bold',
                  medal ? medal.text : 'text-gray-600'
                )}>
                  {ward.submissionCount.toLocaleString()}
                </span>
                {!compact && (
                  <div className="mt-1 flex justify-end">
                    <MiniBar value={ward.submissionCount} max={maxCount} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {compact && wards.length > 10 && (
        <div className="px-4 py-3 text-center border-t border-gray-100">
          <a href="/leaderboard" className="text-xs text-meruGreen font-medium hover:underline">
            View all {wards.length} wards →
          </a>
        </div>
      )}
    </div>
  )
}
