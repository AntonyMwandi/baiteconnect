'use client'
// src/app/budget/page.tsx

import { useState }    from 'react'
import { useLanguage } from '@/lib/language-context'
import BudgetSlider    from '@/components/forms/BudgetSlider'
import { Card, SectionHeader } from '@/components/ui'
import Link            from 'next/link'

interface SliderChoices {
  health: number; agriculture: number; roads: number
  water: number;  publicService: number
}

const SECTOR_FACTS: Record<string, string[]> = {
  health: [
    'Health consumes the largest single budget share due to 78 county health facilities serving 1.9 million residents.',
    'Includes SHA insurance co-payments, medicines, and over 3,200 health workers on the county payroll.',
    'Governor Mutuma has prioritized cancer screening and maternal health as flagship programmes.',
  ],
  agriculture: [
    'Meru County is Kenya\'s top miraa (khat) producer — a KSh 60B+ annual export crop.',
    'Dairy farming via the Maziwa Project supports 18,000 smallholder households.',
    'Subsidised agri-inputs (fertiliser, seeds) reduce production costs for smallholders by up to 40%.',
  ],
  roads: [
    '580km of county roads require maintenance, grading, or tarmacking.',
    'Rural feeder roads directly determine farm-to-market access for 240,000 farming households.',
    'The Muthara-Ntulili corridor is the highest-priority ungraded route flagged by citizens.',
  ],
  water: [
    'Only 58% of Meru households have piped water access — below the national average.',
    'Borehole drilling costs approximately KSh 3.2M per unit serving 1,800+ households.',
    'Climate adaptation includes soil conservation terracing across 45,000 hectares.',
  ],
  publicService: [
    'Covers county public service salaries, ward offices, and digital infrastructure.',
    'Includes the Meru Youth Service (MYS) revitalisation programme.',
    'Digital hubs at 18 vocational training centres provide free public Wi-Fi access.',
  ],
}

const SECTOR_KEYS = ['health', 'agriculture', 'roads', 'water', 'publicService'] as const
const SECTOR_ICONS: Record<string, string> = {
  health: '🏥', agriculture: '🌾', roads: '🛣️', water: '💧', publicService: '🏛️'
}

export default function BudgetPage() {
  const { t } = useLanguage()
  const [sliders, setSliders] = useState<SliderChoices>({
    health: 40, agriculture: 20, roads: 15, water: 15, publicService: 10
  })
  const [activeSector, setActiveSector] = useState<string | null>(null)

  const isBalanced = Object.values(sliders).reduce((a, b) => a + b, 0) === 100

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      <SectionHeader
        title={t('budget', 'title')}
        subtitle="FY 2026/2027 · County Government of Meru"
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* Main slider tool */}
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <BudgetSlider values={sliders} onChange={setSliders} />
          </Card>

          {/* Sector info cards */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Tap a sector to learn more
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECTOR_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => setActiveSector(activeSector === key ? null : key)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    activeSector === key
                      ? 'border-meruGreen bg-green-50 shadow-card'
                      : 'border-gray-100 bg-white hover:border-meruGreen/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{SECTOR_ICONS[key]}</span>
                      <span className="font-semibold text-neutralDark text-sm">{t('sectors', key)}</span>
                    </div>
                    <span className="text-xs text-white bg-meruGreen px-2 py-0.5 rounded-full font-bold">
                      KSh {sliders[key as keyof SliderChoices]}
                    </span>
                  </div>
                  {activeSector === key && (
                    <ul className="mt-2 space-y-1.5 text-xs text-gray-600 leading-relaxed">
                      {SECTOR_FACTS[key].map((fact, i) => (
                        <li key={i} className="flex gap-1.5">
                          <span className="text-meruGreen mt-0.5 shrink-0">•</span>
                          {fact}
                        </li>
                      ))}
                    </ul>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* CTA to submit */}
          {isBalanced && (
            <Card className="p-5 bg-green-50 border-green-200 animate-slide-up">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-meruGreen">✅ Budget balanced!</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Your allocation preferences will be saved with your memo submission.
                  </p>
                </div>
                <Link
                  href="/submit"
                  className="bg-meruGreen text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-900 transition-colors shrink-0 text-center min-h-[44px] flex items-center"
                >
                  Submit memo →
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar — county baseline */}
        <div className="space-y-4 lg:sticky lg:top-20">
          <Card className="overflow-hidden">
            <div className="bg-meru-header px-4 py-3">
              <p className="text-xs text-white/60 uppercase tracking-wide mb-0.5">County Baseline</p>
              <h3 className="font-bold text-white">FY 2026/2027 Actual Allocation</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { sector: 'Health',                  billions: 4.20, pct: 40, icon: '🏥' },
                { sector: 'Agriculture',             billions: 2.10, pct: 20, icon: '🌾' },
                { sector: 'Roads & Infrastructure',  billions: 1.58, pct: 15, icon: '🛣️' },
                { sector: 'Water & Environment',     billions: 1.58, pct: 15, icon: '💧' },
                { sector: 'General Public Service',  billions: 1.05, pct: 10, icon: '🏛️' },
              ].map(row => (
                <div key={row.sector} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{row.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutralDark leading-tight truncate">{row.sector}</p>
                      <p className="text-xs text-gray-400">KSh {row.billions}B</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-meruGreen rounded-full" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="text-sm font-bold text-meruGreen w-8 text-right">{row.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Total County Budget: <strong className="text-meruGreen">KSh 10.51 Billion</strong>
              </p>
            </div>
          </Card>

          <Card className="p-4 bg-amber-50 border-amber-100">
            <p className="text-xs font-semibold text-amber-800 mb-1">💡 Did you know?</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              By law, all Meru County residents can influence how this budget is distributed.
              Your slider choices become part of the official MTEF public participation report submitted to the Commission on Revenue Allocation.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
