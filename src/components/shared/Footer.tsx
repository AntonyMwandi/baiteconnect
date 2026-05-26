'use client'
// src/components/shared/Footer.tsx — fully working links, Meru logo, tri-lingual

import Link           from 'next/link'
import Image          from 'next/image'
import { useLanguage } from '@/lib/language-context'

const QUICK_LINKS = [
  { href: '/',            en: 'Home',            sw: 'Nyumbani',            ki: 'Inyumba'       },
  { href: '/submit',      en: 'Submit a Memo',   sw: 'Tuma Maombi',         ki: 'Tuma Ûrîa'     },
  { href: '/budget',      en: 'Budget Tool',     sw: 'Zana ya Bajeti',      ki: 'Ûgawîrîri'     },
  { href: '/projects',    en: 'Project Tracker', sw: 'Ufuatiliaji wa Miradi',ki: 'Ufuatiliaji'  },
  { href: '/leaderboard', en: 'Ward League',     sw: 'Ligi ya Wodi',        ki: 'Ward League'   },
  { href: '/about',       en: 'About',           sw: 'Kuhusu',              ki: 'Kuhusu'        },
  { href: '/contact',     en: 'Contact Us',      sw: 'Wasiliana Nasi',      ki: 'Wasiliana'     },
]

const LEGAL_ITEMS = [
  { href: '/privacy',   label: 'Privacy Policy',  external: false },
  { href: 'https://www.kenyalaw.org/lex/actview.xql?actid=Const2010', label: 'Constitution of Kenya 2010', external: true },
  { href: 'https://www.kenyalaw.org/lex/actview.xql?actid=No.18of2012', label: 'PFM Act 2012', external: true },
  { href: 'https://www.kenyalaw.org/lex/actview.xql?actid=No.17of2012', label: 'County Governments Act 2012', external: true },
  { href: 'https://www.odpc.go.ke/', label: 'Data Protection Act 2019', external: true },
]

const RESOURCE_LINKS = [
  { href: '/admin/login',                          label: 'Executive Dashboard', external: false },
  { href: '/leaderboard',                          label: 'Ward Rankings',        external: false },
  { href: 'https://www.meru.go.ke',                label: 'County Website',       external: true  },
  { href: 'https://www.meru.go.ke/departments/finance', label: 'Finance Dept.', external: true  },
  { href: 'https://www.cra.go.ke',                 label: 'Revenue Allocation',   external: true  },
  { href: 'https://www.controller.go.ke',          label: "Controller of Budget", external: true  },
]

export default function Footer() {
  const { lang } = useLanguage()
  const year = new Date().getFullYear()

  const tl = (item: { en: string; sw: string; ki: string }) =>
    item[lang as 'en' | 'sw' | 'ki'] ?? item.en

  return (
    <footer className="bg-neutralDark text-white mt-auto">

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-full overflow-hidden shadow-lg shrink-0 flex items-center justify-center">
              <Image src="/meru-logo.jpeg" alt="County Government of Meru" width={44} height={44}/>
            </div>
            <div>
              <p className="font-bold text-lg leading-none">BaiteConnect</p>
              <p className="text-white/40 text-xs mt-0.5">meru.go.ke</p>
            </div>
          </div>

          <p className="text-sm text-white/55 leading-relaxed mb-4">
            {lang === 'sw'
              ? 'Lango lako la dijitali la kushiriki katika bajeti ya Kaunti ya Meru.'
              : lang === 'ki'
              ? 'Rûgano rwako rwa dijitali rwa kushiriki katika bajeti ya Meru.'
              : "Your digital gateway to participate in Meru County's budget planning process."}
          </p>

          <div className="space-y-1.5 text-xs text-white/40">
            <a href="mailto:budget.finance@meru.go.ke" className="flex items-center gap-1.5 hover:text-meruGold transition-colors">
              📧 budget.finance@meru.go.ke
            </a>
            <p>📮 P.O. Box 120 – 60200, Meru</p>
            <p className="font-medium text-meruGold/70">📱 USSD: *384#</p>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-meruGold font-semibold text-sm uppercase tracking-wider mb-4">
            {lang === 'sw' ? 'Viungo vya Haraka' : lang === 'ki' ? 'Links za Haraka' : 'Quick Links'}
          </h3>
          <ul className="space-y-2">
            {QUICK_LINKS.map(link => (
              <li key={link.href}>
                <Link href={link.href}
                  className="text-sm text-white/60 hover:text-meruGold transition-colors inline-flex items-center gap-1.5 group">
                  <span className="w-1 h-1 rounded-full bg-meruGold/30 group-hover:bg-meruGold transition-colors shrink-0" />
                  {tl(link)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-meruGold font-semibold text-sm uppercase tracking-wider mb-4">
            {lang === 'sw' ? 'Mfumo wa Kisheria' : lang === 'ki' ? 'Mfumo wa Kisheria' : 'Legal Framework'}
          </h3>
          <ul className="space-y-2">
            {LEGAL_ITEMS.map(item => (
              <li key={item.href}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-meruGold transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-meruGold transition-colors shrink-0" />
                    <span className="leading-snug">{item.label}</span>
                    <span className="text-white/20 text-[10px]">↗</span>
                  </a>
                ) : (
                  <Link href={item.href}
                    className="text-sm text-white/60 hover:text-meruGold transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-meruGold transition-colors shrink-0" />
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h3 className="text-meruGold font-semibold text-sm uppercase tracking-wider mb-4">
            {lang === 'sw' ? 'Rasilimali' : lang === 'ki' ? 'Rasilimali' : 'Resources'}
          </h3>
          <ul className="space-y-2">
            {RESOURCE_LINKS.map(item => (
              <li key={item.href}>
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-white/60 hover:text-meruGold transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-meruGold transition-colors shrink-0" />
                    {item.label}
                    <span className="text-white/20 text-[10px]">↗</span>
                  </a>
                ) : (
                  <Link href={item.href}
                    className="text-sm text-white/60 hover:text-meruGold transition-colors inline-flex items-center gap-1.5 group">
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-meruGold transition-colors shrink-0" />
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-1.5">
            {['PFM Act 2012', 'Art. 201', 'KDPA 2019', 'CGA 2012'].map(badge => (
              <span key={badge} className="text-[10px] bg-white/8 border border-white/12 text-white/40 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Language + meta row */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-white/35">
            <span>🌐</span>
            <span>{lang === 'sw' ? 'Lugha ya sasa:' : lang === 'ki' ? 'Rûgano rwa sasa:' : 'Current language:'}</span>
            <span className="text-white/55 font-medium">
              {lang === 'en' ? 'English' : lang === 'sw' ? 'Kiswahili' : 'Kimîîru'}
            </span>
            <span className="text-white/15 hidden sm:inline">·</span>
            <span className="text-white/20 text-[10px] hidden sm:inline">Toggle in header</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/25">
            <span>FY 2026/2027</span>
            <span>·</span>
            <span>v2.0</span>
            <span>·</span>
            <span>45 wards</span>
            <span>·</span>
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black/20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/30 text-center sm:text-left">
            © {year} County Government of Meru · BaiteConnect · All rights reserved.
          </p>
          <p className="text-xs text-white/20 text-center hidden sm:block">
            {lang === 'sw'
              ? 'Inaoana na PFM Act 2012 na Katiba ya Kenya Kifungu 201'
              : lang === 'ki'
              ? 'Inaoana na PFM Act 2012'
              : 'Aligned with PFM Act 2012 · Constitution of Kenya Article 201'}
          </p>
        </div>
      </div>
    </footer>
  )
}
