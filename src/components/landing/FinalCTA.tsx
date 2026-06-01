'use client'
import Link from 'next/link'
import { C, GRID } from '@/lib/atlas'
import Reveal from './Reveal'

export default function FinalCTA() {
  return (
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-24">
      <Reveal>
        <div className="rounded-3xl px-10 py-16 text-center relative overflow-hidden"
          style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 4px 32px rgba(38,63,73,0.08)', backgroundImage: GRID, backgroundSize: '28px 28px' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16" style={{ background: `linear-gradient(to right,transparent,${C.gold}80)` }}/>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
              style={{ background: C.paleTeal, border: `2px solid ${C.teal}`, color: C.teal }}>✓</div>
            <div className="h-px w-16" style={{ background: `linear-gradient(to left,transparent,${C.teal}80)` }}/>
          </div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem,3vw,2.9rem)', color: C.inkStrong, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Your route is ready to start.
          </h2>
          <p style={{ color: C.inkMuted, marginBottom: '2.5rem', fontSize: '1rem' }}>
            Free forever. Upgrade when you need AI features.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[10px] text-sm font-semibold transition-all duration-200"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#267970'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${C.teal}44` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.teal; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
            Start planning free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </Reveal>
    </section>
  )
}
