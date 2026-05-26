'use client'
// src/components/shared/Header.tsx — with Meru logo, auth state, working nav

import { useState }        from 'react'
import Link                from 'next/link'
import Image               from 'next/image'
import { usePathname }     from 'next/navigation'
import { useLanguage }     from '@/lib/language-context'
import { useAuth }         from '@/lib/auth-context'
import type { Language }   from '@/types'
import { clsx }            from 'clsx'

const LANG_OPTIONS: { code: Language; native: string; full: string }[] = [
  { code:'en', native:'EN',  full:'English'   },
  { code:'sw', native:'SW',  full:'Kiswahili' },
  { code:'ki', native:'KÎÎ', full:'Kimîîru'   },
]

const NAV = [
  { href:'/',            label:{ en:'Home',        sw:'Nyumbani',     ki:'Inyumba'     } },
  { href:'/submit',      label:{ en:'Submit Memo',  sw:'Tuma Maombi',  ki:'Tuma Ûrîa'   } },
  { href:'/budget',      label:{ en:'Budget Tool',  sw:'Zana ya Bajeti',ki:'Ûgawîrîri'  } },
  { href:'/projects',    label:{ en:'Projects',     sw:'Miradi',       ki:'Imirimo'     } },
  { href:'/leaderboard', label:{ en:'Ward League',  sw:'Ligi ya Wodi', ki:'Ward League' } },
]

export default function Header() {
  const { lang, setLang }         = useLanguage()
  const { user, logout, loading } = useAuth()
  const pathname                  = usePathname()
  const [menuOpen,  setMenuOpen]  = useState(false)
  const [langOpen,  setLangOpen]  = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)

  const tNav = (item: typeof NAV[0]) => item.label[lang] ?? item.label.en

  const isAdmin = user && ['COUNTY_ADMIN','GOVERNOR_EXEC','MCA'].includes(user.role)

  return (
    <header className="bg-meruGreen text-white sticky top-0 z-50 shadow-lg">
      {/* Slim top strip */}
      <div className="hidden sm:flex items-center justify-between max-w-7xl mx-auto px-4 py-1 border-b border-white/10 text-[10px] text-white/50">
        <span>County Government of Meru · FY 2026/2027 · PFM Act 2012</span>
        <span className="text-meruGold/80 font-medium">baiteconnect.meru.go.ke</span>
      </div>

      {/* Main bar */}
      <nav className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 bg-white rounded-full overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
            <Image src="/meru-logo.jpeg" alt="Meru County" width={36} height={36} className="object-contain w-full h-full" />
          </div>
          <div className="leading-tight">
            <div className="font-bold text-base text-white leading-none">BaiteConnect</div>
            <div className="text-[10px] text-white/45 uppercase tracking-widest hidden sm:block">meru.go.ke</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  active ? 'bg-meruGold text-meruGreen' : 'text-white/80 hover:text-white hover:bg-white/10')}>
                {tNav(item)}
              </Link>
            )
          })}
          {isAdmin && (
            <Link href="/admin"
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                pathname.startsWith('/admin') ? 'bg-meruGold text-meruGreen' : 'text-white/60 hover:text-white hover:bg-white/10')}>
              Admin
            </Link>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">

          {/* Language picker */}
          <div className="relative">
            <button onClick={() => { setLangOpen(o => !o); setUserOpen(false); setMenuOpen(false) }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-white/20 text-xs font-semibold text-white hover:bg-white/10 transition-colors min-h-[34px]">
              🌐 {LANG_OPTIONS.find(l => l.code === lang)?.native}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[140px] animate-slide-up">
                {LANG_OPTIONS.map(opt => (
                  <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false) }}
                    className={clsx('w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-neutralLight transition-colors',
                      lang === opt.code ? 'font-semibold text-meruGreen bg-green-50' : 'text-neutralDark')}>
                    <span className="text-xs font-mono text-meruBrown w-7">{opt.native}</span>
                    <span>{opt.full}</span>
                    {lang === opt.code && <span className="ml-auto text-meruGreen text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth state */}
          {!loading && (
            <>
              {user ? (
                <div className="relative hidden sm:block">
                  <button onClick={() => { setUserOpen(o => !o); setLangOpen(false) }}
                    className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors min-h-[34px]">
                    <div className="w-5 h-5 bg-meruGold rounded-full flex items-center justify-center text-meruGreen font-bold text-[10px]">
                      {user.fullName?.charAt(0) ?? 'A'}
                    </div>
                    <span className="max-w-[80px] truncate">{user.fullName?.split(' ')[0]}</span>
                    <span className="text-white/40">▼</span>
                  </button>
                  {userOpen && (
                    <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[180px] animate-slide-up">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-neutralDark truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-400 font-mono">{user.phoneNumber}</p>
                        <span className="inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full bg-green-100 text-meruGreen">
                          {user.role.replace('_',' ')}
                        </span>
                      </div>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutralDark hover:bg-neutralLight transition-colors">
                          ⚙️ Admin Dashboard
                        </Link>
                      )}
                      <button onClick={() => { setUserOpen(false); logout() }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100">
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/admin/login"
                  className="hidden sm:flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/20 transition-colors min-h-[34px]">
                  🔐 Admin Login
                </Link>
              )}
            </>
          )}

          {/* Submit CTA */}
          <Link href="/submit"
            className="hidden sm:flex items-center gap-1.5 bg-meruGold text-meruGreen font-bold text-sm px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors shadow-md min-h-[34px]">
            📝 <span className="hidden md:inline">Submit Memo</span>
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => { setMenuOpen(o => !o); setLangOpen(false); setUserOpen(false) }}
            className="lg:hidden flex flex-col gap-1 p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[36px] min-h-[36px] items-center justify-center">
            <span className={clsx('block w-5 h-0.5 bg-white transition-all duration-200', menuOpen && 'rotate-45 translate-y-1.5')} />
            <span className={clsx('block w-5 h-0.5 bg-white transition-all duration-200', menuOpen && 'opacity-0')} />
            <span className={clsx('block w-5 h-0.5 bg-white transition-all duration-200', menuOpen && '-rotate-45 -translate-y-1.5')} />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-meruGreen/95 backdrop-blur-sm animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {NAV.map(item => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px]',
                    active ? 'bg-meruGold text-meruGreen font-bold' : 'text-white/85 hover:bg-white/10')}>
                  {tNav(item)}
                </Link>
              )
            })}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 min-h-[48px]">
                ⚙️ Admin Dashboard
              </Link>
            )}
            <div className="border-t border-white/10 pt-2 mt-1">
              {user ? (
                <button onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-900/20 min-h-[48px]">
                  🚪 Sign Out ({user.fullName?.split(' ')[0]})
                </button>
              ) : (
                <Link href="/admin/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/70 hover:bg-white/10 min-h-[48px]">
                  🔐 Admin Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
