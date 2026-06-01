'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { C } from '@/lib/atlas'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all duration-500"
      style={{
        background: scrolled ? `${C.card}f0` : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(38,63,73,0.08)' : 'none',
      }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.teal }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" fill="white"/>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>
          ApplyTracker
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/login"
          className="text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200"
          style={{ color: C.inkMuted }}
          onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
          onMouseLeave={e => (e.currentTarget.style.color = C.inkMuted)}>
          Sign in
        </Link>
        <Link href="/login"
          className="text-sm font-semibold px-4 py-2.5 rounded-[10px] transition-all duration-200"
          style={{ background: C.ink, color: C.bgSoft }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.inkStrong; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.ink; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
          Start free →
        </Link>
      </div>
    </nav>
  )
}
