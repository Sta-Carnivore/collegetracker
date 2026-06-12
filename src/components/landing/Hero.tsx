'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { C, GRID } from '@/lib/atlas'
import RouteMap from './RouteMap'

export default function Hero() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  const fade = (delay: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
    opacity: ready ? 1 : 0,
    transform: ready ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
    ...extra,
  })

  return (
    <section className="relative min-h-screen flex items-center pt-20"
      style={{ backgroundImage: GRID, backgroundSize: '28px 28px' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 55% 55% at 72% 50%, rgba(50,143,134,0.07) 0%,transparent 70%),
                     radial-gradient(ellipse 40% 50% at 28% 35%, rgba(200,164,90,0.06) 0%,transparent 60%)`,
      }}/>

      <div className="relative w-full max-w-7xl mx-auto px-6 md:px-10 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <div style={fade(0)}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-8"
              style={{ background: C.paleTeal, color: C.teal, border: `1px solid ${C.teal}33` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.teal }}/>
              Free to start — no credit card needed
            </div>
          </div>

          <h1 style={{
            ...fade(120),
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.8rem,5.5vw,5.2rem)',
            lineHeight: 1.1,
            color: C.inkStrong,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            marginBottom: '1.5rem',
          }}>
            Your college<br/>
            application season,{' '}
            <span style={{ color: C.teal }}>mapped clearly.</span>
          </h1>

          <p style={{ ...fade(240), color: C.inkMuted, lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: '44ch', fontSize: '1.05rem' }}>
            Track schools, deadlines, materials, your profile, and the next task that actually matters.
          </p>

          <div style={{ ...fade(340), display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/login?mode=signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] text-sm font-semibold transition-all duration-200"
              style={{ background: C.teal, color: 'white' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#267970'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${C.teal}44` }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.teal; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
              Start planning
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[10px] text-sm font-medium transition-all duration-200"
              style={{ background: 'transparent', color: C.inkMuted, border: `1.5px solid ${C.border}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.inkMuted; (e.currentTarget as HTMLElement).style.color = C.ink }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.inkMuted }}>
              See how it works
            </a>
          </div>

          <div style={{ ...fade(460), display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2.5rem' }}>
            <div className="flex -space-x-2">
              {[C.paleTeal, C.slateLight, C.paleGold, C.palePlum].map((bg, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold"
                  style={{ background: bg, borderColor: C.bg, color: C.inkMuted }}>
                  {['A','B','C','D'][i]}
                </div>
              ))}
            </div>
            <p style={{ color: C.inkFaint, fontSize: '0.8rem' }}>Students using ApplyTracker for their 2026–27 apps</p>
          </div>
        </div>

        <div style={fade(200)} className="flex justify-center lg:justify-end">
          <RouteMap />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2" style={{
        opacity: ready ? 1 : 0,
        transition: 'opacity 0.7s ease 800ms',
        animation: ready ? 'bounce 2s ease-in-out 1.5s infinite' : 'none',
      }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 8l5 5 5-5" stroke={C.inkFaint} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(5px)} }
      `}</style>
    </section>
  )
}
