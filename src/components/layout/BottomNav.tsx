'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Table2, FileText, Globe, CalendarRange } from 'lucide-react'
import { C } from '@/lib/atlas'

const tabs = [
  { href: '/dashboard',   label: 'Home',    icon: LayoutDashboard },
  { href: '/tracker',     label: 'Tracker', icon: Table2 },
  { href: '/resume',      label: 'Resume',  icon: FileText },
  { href: '/bio',         label: 'Bio',     icon: Globe },
  { href: '/planner',     label: 'Planner',  icon: CalendarRange },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/tracker') return pathname.startsWith('/tracker')
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-stretch"
      style={{
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        boxShadow: '0 -2px 12px rgba(38,63,73,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-3 gap-1 min-h-[56px] transition-colors"
            style={{ color: active ? C.teal : C.inkFaint }}
          >
            <Icon size={19} strokeWidth={active ? 2.2 : 1.75} />
            <span className="text-[10px]" style={{ fontFamily: 'var(--font-sans)', fontWeight: active ? 600 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
