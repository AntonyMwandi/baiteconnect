'use client'
// src/app/admin/layout.tsx — Auth-guarded admin shell

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import Image                   from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth }             from '@/lib/auth-context'
import { clsx }                from 'clsx'

const ADMIN_NAV = [
  { group:'Overview', items:[
    { href:'/admin',             icon:'📊', label:'Executive Briefing',   roles:['COUNTY_ADMIN','GOVERNOR_EXEC','MCA'] },
  ]},
  { group:'Geography', items:[
    { href:'/admin/locations',   icon:'🗺️', label:'Wards & Locations',    roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
    { href:'/admin/subcounties', icon:'📐', label:'Sub-Counties',          roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
  ]},
  { group:'People', items:[
    { href:'/admin/users',       icon:'👥', label:'Users & Roles',         roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
    { href:'/admin/mca',         icon:'🏛️', label:'MCA Proposals',         roles:['COUNTY_ADMIN','GOVERNOR_EXEC','MCA'] },
  ]},
  { group:'Content', items:[
    { href:'/admin/memoranda',   icon:'📝', label:'Memoranda Review',      roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
    { href:'/admin/projects',    icon:'🏗️', label:'Project Management',    roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
    { href:'/admin/reports',     icon:'🔍', label:'Whistleblower Reports', roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
  ]},
  { group:'System', items:[
    { href:'/admin/audit',       icon:'🔐', label:'Audit Log',             roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
    { href:'/admin/settings',    icon:'⚙️',  label:'Settings',              roles:['COUNTY_ADMIN','GOVERNOR_EXEC'] },
  ]},
]

const ROLE_DISPLAY: Record<string, { label:string; color:string; bg:string }> = {
  GOVERNOR_EXEC: { label:"Governor's Office", color:'#01411C', bg:'#e8f5ee' },
  COUNTY_ADMIN:  { label:'County Admin',      color:'#1d4ed8', bg:'#eff6ff' },
  MCA:           { label:'MCA',               color:'#6E473B', bg:'#fdf4f2' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const pathname = usePathname()
  const router   = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && pathname !== '/admin/login') {
      if (!user || !['COUNTY_ADMIN','GOVERNOR_EXEC','MCA'].includes(user.role)) {
        router.replace('/admin/login')
      }
    }
  }, [user, loading, pathname, router])

  if (pathname === '/admin/login') return <>{children}</>

  if (loading) return (
    <div className="min-h-screen bg-meruGreen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
          <Image src="/meru-logo.jpeg" alt="Meru" width={56} height={56} className="object-contain" />
        </div>
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-white/60 text-sm mt-3">Verifying session…</p>
      </div>
    </div>
  )

  if (!user || !['COUNTY_ADMIN','GOVERNOR_EXEC','MCA'].includes(user.role)) return null

  const roleInfo = ROLE_DISPLAY[user.role] ?? { label: user.role, color: '#374151', bg: '#f3f4f6' }
  const filteredNav = ADMIN_NAV.map(g => ({ ...g, items: g.items.filter(i => i.roles.includes(user.role)) })).filter(g => g.items.length > 0)

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 bg-white rounded-full overflow-hidden flex items-center justify-center shrink-0">
            <Image src="/meru-logo.jpeg" alt="Meru County" width={34} height={34} className="object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">BaiteConnect</p>
            <p className="text-white/40 text-[10px] mt-0.5">Admin Console</p>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-meruGold flex items-center justify-center text-meruGreen font-bold text-xs shrink-0">
              {user.fullName?.charAt(0) ?? 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold leading-tight truncate">{user.fullName}</p>
              <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5" style={{ background: roleInfo.bg, color: roleInfo.color }}>
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-3 space-y-4 px-3">
        {filteredNav.map(group => (
          <div key={group.group}>
            <p className="text-[10px] text-white/35 uppercase tracking-widest font-semibold px-2 mb-1">{group.group}</p>
            {group.items.map(item => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={clsx('flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 min-h-[44px]',
                    active ? 'bg-meruGold text-meruGreen font-semibold shadow-md' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
                  <span className="text-base leading-none shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <Link href="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all min-h-[44px]">
          <span>🏠</span><span>Public Portal</span>
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all min-h-[44px]">
          <span>🚪</span><span>Sign Out</span>
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <aside className="hidden lg:flex flex-col w-60 bg-meruGreen shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-hidden shadow-xl">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-meruGreen flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 bg-neutralLight">
        <div className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-16 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="flex flex-col gap-1 p-2 rounded-lg hover:bg-gray-100">
              <span className="block w-4 h-0.5 bg-neutralDark" />
              <span className="block w-4 h-0.5 bg-neutralDark" />
              <span className="block w-4 h-0.5 bg-neutralDark" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white rounded-full overflow-hidden border border-gray-200">
                <Image src="/meru-logo.jpeg" alt="Meru" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-sm font-semibold text-neutralDark">Admin Console</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: roleInfo.bg, color: roleInfo.color }}>{roleInfo.label}</span>
            <button onClick={logout} className="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50">Sign out</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  )
}
