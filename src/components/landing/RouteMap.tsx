'use client'
import { useEffect, useRef, useState } from 'react'
import { C, GRID } from '@/lib/atlas'

export default function RouteMap() {
  const pathRef  = useRef<SVGPathElement>(null)
  const path2Ref = useRef<SVGPathElement>(null)
  const [phase, setPhase] = useState(0) // 0=idle 1=drawing 2=waypoints 3=done

  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (phase !== 1) return
    const el = pathRef.current
    const el2 = path2Ref.current
    if (!el || !el2) return

    const animate = (target: SVGPathElement, delay: number) => {
      const len = target.getTotalLength()
      target.style.strokeDasharray = `${len}`
      target.style.strokeDashoffset = `${len}`
      setTimeout(() => {
        target.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)'
        target.style.strokeDashoffset = '0'
      }, delay)
    }

    animate(el, 50)
    animate(el2, 200)

    const t = setTimeout(() => setPhase(2), 1400)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => {
    if (phase !== 2) return
    const t = setTimeout(() => setPhase(3), 1600)
    return () => clearTimeout(t)
  }, [phase])

  const waypoints = [
    { x: 100, y: 75,  label: 'School List',   side: 'right' as const, delay: 0   },
    { x: 235, y: 175, label: 'Resume Profile', side: 'left'  as const, delay: 300 },
    { x: 130, y: 270, label: 'Applications',   side: 'right' as const, delay: 600 },
    { x: 248, y: 368, label: 'Submit',         side: 'left'  as const, delay: 900 },
  ]

  return (
    <div className="relative w-full max-w-[360px] mx-auto" style={{ height: 440 }}>
      <div className="absolute inset-0 rounded-3xl" style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        boxShadow: '0 12px 48px rgba(38,63,73,0.12), 0 2px 8px rgba(38,63,73,0.06)',
        animation: 'float 6s ease-in-out infinite',
      }}/>
      <div className="absolute inset-0 rounded-3xl overflow-hidden"
        style={{ backgroundImage: GRID, backgroundSize: '22px 22px', opacity: 0.5 }}/>

      <svg viewBox="0 0 360 440" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="rough">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="2" result="n"/>
            <feDisplacementMap in="SourceGraphic" in2="n" scale="0.6" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="7" stroke={C.paleTeal} strokeWidth="3"/>
          </pattern>
        </defs>

        <ellipse cx="100" cy="75" rx="40" ry="22"
          fill="url(#hatch)" opacity={phase >= 2 ? 0.65 : 0}
          style={{ transition: 'opacity 0.6s ease 0.2s' }}/>
        <ellipse cx="248" cy="368" rx="44" ry="24"
          fill={C.paleGold} opacity={phase >= 2 ? 0.5 : 0}
          style={{ transition: 'opacity 0.6s ease 1s' }}/>

        <path ref={path2Ref}
          d="M 55 46 C 78 46,102 62,102 77 C 102 94,168 122,235 175 C 272 204,196 240,132 272 C 84 302,162 328,250 370"
          fill="none" stroke={C.gold} strokeWidth="5" strokeLinecap="round" opacity="0.1"/>
        <path ref={pathRef}
          d="M 55 44 C 78 44,100 60,100 75 C 100 92,166 120,235 173 C 272 202,196 238,132 270 C 84 300,162 326,248 368"
          fill="none" stroke={C.gold} strokeWidth="2.5" strokeLinecap="round"/>

        <circle cx="55" cy="44" r="5" fill={C.teal}
          opacity={phase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.3s ease 0.1s' }}/>
        <circle cx="55" cy="44" r="9" fill="none" stroke={C.teal} strokeWidth="1.5"
          opacity={phase >= 1 ? 0.35 : 0} style={{ transition: 'opacity 0.3s ease 0.1s' }}/>
        <text x="68" y="48" fontSize="8.5" fill={C.inkFaint} fontFamily="Montserrat,sans-serif"
          opacity={phase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.3s ease 0.2s' }}>Start</text>

        <g transform="translate(298,56)" opacity={phase >= 3 ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease 0.3s' }}>
          <circle r="20" fill={C.bgSoft} stroke={C.border} strokeWidth="1.2"/>
          <path d="M0,-11 L2.5,3 L0,1 L-2.5,3 Z" fill={C.gold}/>
          <path d="M0,11 L-2.5,-3 L0,-1 L2.5,-3 Z" fill={C.inkFaint}/>
          <circle r="2.5" fill={C.ink}/>
          <line x1="-11" y1="0" x2="11" y2="0" stroke={C.border} strokeWidth="0.8"/>
        </g>

        {waypoints.map((wp, i) => {
          const show = phase >= 2
          return (
            <g key={i} style={{
              opacity: show ? 1 : 0,
              transform: show ? 'none' : 'scale(0.6)',
              transformOrigin: `${wp.x}px ${wp.y}px`,
              transition: `opacity 0.45s ease ${wp.delay}ms, transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${wp.delay}ms`,
            }}>
              <circle cx={wp.x} cy={wp.y} r="17"
                fill={C.card} stroke={i === 3 ? C.gold : C.teal} strokeWidth="1.8"/>
              <circle cx={wp.x} cy={wp.y} r="6" fill={i === 3 ? C.gold : C.teal}/>
              <text x={wp.x} y={wp.y + 4} textAnchor="middle" fontSize="7.5" fontWeight="700"
                fill="white" fontFamily="Montserrat,sans-serif">{i + 1}</text>
              <text
                x={wp.side === 'right' ? wp.x + 26 : wp.x - 26}
                y={wp.y + 4}
                textAnchor={wp.side === 'right' ? 'start' : 'end'}
                fontSize="9" fontWeight="500" fill={C.inkMuted}
                fontFamily="Montserrat,sans-serif">{wp.label}</text>
              {i === 3 && (
                <path d="M 204 382 Q 226 387 276 384"
                  fill="none" stroke={C.gold} strokeWidth="2"
                  strokeLinecap="round" opacity="0.65" filter="url(#rough)"/>
              )}
            </g>
          )
        })}

        <g style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s ease 1100ms' }}>
          <rect x="260" y="350" width="26" height="16" rx="4"
            fill={C.teal} opacity="0.18" stroke={C.teal} strokeWidth="1"/>
          <text x="273" y="362" textAnchor="middle" fontSize="10" fill={C.teal}>✓</text>
        </g>
      </svg>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-6px) rotate(0.3deg); }
          66% { transform: translateY(-3px) rotate(-0.2deg); }
        }
      `}</style>
    </div>
  )
}
