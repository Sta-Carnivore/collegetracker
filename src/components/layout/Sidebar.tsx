'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Table2,
  FileText,
  Globe,
  CalendarRange,
  Settings,
  LogOut,
} from 'lucide-react'
import { C } from '@/lib/atlas'

const primaryNav = [
  { href: '/dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/tracker',     label: 'Tracker',     icon: Table2 },
  { href: '/resume',      label: 'AI Resume',   icon: FileText },
  { href: '/bio',         label: 'Bio Website', icon: Globe },
  { href: '/ai/strategy', label: 'Planner',     icon: CalendarRange },
]

const secondaryNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    if (href === '/tracker') return pathname.startsWith('/tracker')
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden md:flex flex-col w-56 flex-shrink-0 h-screen sticky top-0"
      style={{
        background: C.card,
        borderRight: `1px solid ${C.border}`,
        boxShadow: '2px 0 12px rgba(38,63,73,0.05)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: C.teal }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" fill="white"/>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>
          ApplyTracker
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={
                active
                  ? {
                      background: C.paleTeal,
                      color: C.teal,
                      fontWeight: 600,
                    }
                  : {
                      color: C.inkMuted,
                      fontWeight: 500,
                    }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = C.bgSoft
                  ;(e.currentTarget as HTMLElement).style.color = C.ink
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = C.inkMuted
                }
              }}
            >
              <Icon
                size={15}
                strokeWidth={active ? 2.2 : 1.75}
                style={{ color: active ? C.teal : 'inherit', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
              {active && (
                <span
                  className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: C.teal }}
                />
              )}
            </Link>
          )
        })}

        <div className="my-3" style={{ borderTop: `1px solid ${C.border}` }} />

        {secondaryNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={
                active
                  ? { background: C.paleTeal, color: C.teal, fontWeight: 600 }
                  : { color: C.inkFaint, fontWeight: 500 }
              }
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = C.bgSoft
                  ;(e.currentTarget as HTMLElement).style.color = C.inkMuted
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLElement).style.color = C.inkFaint
                }
              }}
            >
              <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0 }}/>
              <span style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4" style={{ borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
          style={{ color: C.inkFaint, fontFamily: 'var(--font-sans)', fontWeight: 500 }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = C.danger
            ;(e.currentTarget as HTMLElement).style.background = '#F5DDD9'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = C.inkFaint
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          }}
        >
          <LogOut size={15} strokeWidth={1.75} style={{ flexShrink: 0 }}/>
          Sign out
        </button>
      </div>
    </aside>
  )
}
