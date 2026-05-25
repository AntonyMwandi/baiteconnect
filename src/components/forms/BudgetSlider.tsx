'use client'
// src/components/forms/BudgetSlider.tsx
// The 100-Shilling Coin Gamified Budget Balancer

import { useCallback } from 'react'
import { useLanguage } from '@/lib/language-context'
import { clsx }        from 'clsx'

interface SliderChoices {
  health:        number
  agriculture:   number
  roads:         number
  water:         number
  publicService: number
}

interface BudgetSliderProps {
  values:    SliderChoices
  onChange:  (updated: SliderChoices) => void
  readOnly?: boolean
}

const SECTORS = [
  { key: 'health',        icon: '🏥', color: '#01411C', light: '#e8f5ee', sectorKey: 'health' },
  { key: 'agriculture',   icon: '🌾', color: '#c8960c', light: '#fef9e7', sectorKey: 'agriculture' },
  { key: 'roads',         icon: '🛣️', color: '#2563eb', light: '#eff6ff', sectorKey: 'roads' },
  { key: 'water',         icon: '💧', color: '#0891b2', light: '#ecfeff', sectorKey: 'water' },
  { key: 'publicService', icon: '🏛️', color: '#6E473B', light: '#fdf4f2', sectorKey: 'publicService' },
] as const

type SectorKey = typeof SECTORS[number]['key']

// SVG donut slices
function DonutChart({ values, total }: { values: SliderChoices; total: number }) {
  const entries: { key: SectorKey; val: number; color: string }[] = SECTORS.map(s => ({
    key:   s.key as SectorKey,
    val:   values[s.key as keyof SliderChoices],
    color: s.color,
  }))

  let cumAngle = -Math.PI / 2
  const cx = 100, cy = 100, r = 78, ir = 48

  const slices = entries.map(e => {
    const pct   = total > 0 ? e.val / total : 0
    const angle = pct * 2 * Math.PI
    const x1    = cx + r * Math.cos(cumAngle)
    const y1    = cy + r * Math.sin(cumAngle)
    const x2    = cx + r * Math.cos(cumAngle + angle)
    const y2    = cy + r * Math.sin(cumAngle + angle)
    const ix1   = cx + ir * Math.cos(cumAngle)
    const iy1   = cy + ir * Math.sin(cumAngle)
    const ix2   = cx + ir * Math.cos(cumAngle + angle)
    const iy2   = cy + ir * Math.sin(cumAngle + angle)
    const large = angle > Math.PI ? 1 : 0

    // label position
    const midAngle = cumAngle + angle / 2
    const lx = cx + (r + ir) / 2 * Math.cos(midAngle)
    const ly = cy + (r + ir) / 2 * Math.sin(midAngle)

    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`
    const result = { ...e, path, lx, ly, pct, angle }
    cumAngle += angle
    return result
  })

  const isBalanced = total === 100

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[200px]" aria-label="Budget distribution donut chart">
      {slices.map(s => (
        <g key={s.key}>
          <path d={s.path} fill={s.color} opacity={0.9} className="transition-all duration-300" />
          {s.pct > 0.07 && (
            <text x={s.lx} y={s.ly} textAnchor="middle" dominantBaseline="central"
              fill="white" fontSize="9" fontWeight="700">
              {s.val}
            </text>
          )}
        </g>
      ))}
      {/* Centre circle */}
      <circle cx={cx} cy={cy} r={ir - 2} fill="white" />
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#374151" fontSize="10" fontWeight="500">KSh</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize="22" fontWeight="700"
        fill={isBalanced ? '#01411C' : '#dc2626'}>
        {total}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle" fill={isBalanced ? '#01411C' : '#dc2626'} fontSize="8" fontWeight="600">
        {isBalanced ? 'BALANCED ✓' : '≠ 100'}
      </text>
    </svg>
  )
}

export default function BudgetSlider({ values, onChange, readOnly = false }: BudgetSliderProps) {
  const { t } = useLanguage()

  const total = Object.values(values).reduce((a, b) => a + b, 0)
  const isBalanced = total === 100

  const handleChange = useCallback((key: SectorKey, newVal: number) => {
    if (readOnly) return

    const old   = values[key as keyof SliderChoices]
    const delta = newVal - old

    // Distribute the inverse delta proportionally across other sectors
    const others = SECTORS.filter(s => s.key !== key)
    const otherTotal = others.reduce((sum, s) => sum + values[s.key as keyof SliderChoices], 0)

    if (otherTotal === 0 && delta > 0) return

    const updated = { ...values, [key]: newVal } as SliderChoices

    let remainder = -delta
    const adjustable = others.filter(s => values[s.key as keyof SliderChoices] > 1 || remainder < 0)

    for (let i = 0; i < adjustable.length; i++) {
      const s   = adjustable[i]
      const cur = updated[s.key as keyof SliderChoices]
      if (i === adjustable.length - 1) {
        // Last one absorbs all remainder
        updated[s.key as keyof SliderChoices] = Math.max(1, cur + remainder)
      } else {
        const share = otherTotal > 0 ? cur / otherTotal : 1 / adjustable.length
        const adj   = Math.round(remainder * share)
        updated[s.key as keyof SliderChoices] = Math.max(1, cur + adj)
        remainder -= (updated[s.key as keyof SliderChoices] - cur)
      }
    }

    // Final correction to ensure exact 100
    const newTotal = Object.values(updated).reduce((a, b) => a + b, 0)
    const correction = 100 - newTotal
    if (correction !== 0) {
      const lastOther = others[others.length - 1]
      updated[lastOther.key as keyof SliderChoices] = Math.max(1,
        updated[lastOther.key as keyof SliderChoices] + correction
      )
    }

    onChange(updated)
  }, [values, onChange, readOnly])

  const handleReset = () => {
    onChange({ health: 40, agriculture: 20, roads: 15, water: 15, publicService: 10 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-neutralDark">{t('budget', 'title')}</h3>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t('budget', 'subtitle')}</p>
      </div>

      {/* Donut + sliders — two-column on md+ */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Donut chart */}
        <div className="flex flex-col items-center gap-3 w-full md:w-auto md:min-w-[200px]">
          <DonutChart values={values} total={total} />

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
            {SECTORS.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-[11px] text-gray-600 truncate">{t('sectors', s.sectorKey)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="flex-1 space-y-4 w-full">
          {SECTORS.map(s => {
            const val = values[s.key as keyof SliderChoices]
            return (
              <div key={s.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.icon}</span>
                    <span className="text-sm font-medium text-neutralDark">{t('sectors', s.sectorKey)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{t('budget', 'base')}: {
                      s.key === 'health' ? 40 : s.key === 'agriculture' ? 20 : s.key === 'roads' ? 15 : s.key === 'water' ? 15 : 10
                    }</span>
                    <span
                      className="text-sm font-bold px-2.5 py-0.5 rounded-full text-white min-w-[44px] text-center"
                      style={{ background: s.color }}
                    >
                      {val}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={70}
                  value={val}
                  disabled={readOnly}
                  onChange={e => handleChange(s.key as SectorKey, parseInt(e.target.value, 10))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:cursor-default"
                  style={{
                    background: `linear-gradient(to right, ${s.color} 0%, ${s.color} ${(val / 70) * 100}%, #e5e7eb ${(val / 70) * 100}%, #e5e7eb 100%)`,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Balance indicator */}
      <div className={clsx(
        'flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300',
        isBalanced
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-700'
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{isBalanced ? '✅' : '⚠️'}</span>
          <div>
            <p className="text-sm font-semibold">
              {isBalanced ? t('budget', 'balanced') : t('budget', 'unbalanced')}
            </p>
            <p className="text-xs opacity-75">
              {t('common', 'ksh')} {total} / 100
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={handleReset}
            className="text-xs underline opacity-70 hover:opacity-100 transition-opacity"
          >
            {t('budget', 'reset')}
          </button>
        )}
      </div>

      {!isBalanced && !readOnly && (
        <p className="text-xs text-red-600 text-center animate-fade-in">
          ⚠ {t('validation', 'balanceError')}
        </p>
      )}
    </div>
  )
}
