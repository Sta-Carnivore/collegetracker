'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const C = {
  bg:        '#EEE7D9',
  bgSoft:    '#F7F2E8',
  card:      '#FFFAF0',
  border:    'rgba(38,63,73,0.12)',
  ink:       '#263F49',
  inkStrong: '#1D2E36',
  inkMuted:  '#687B7C',
  inkFaint:  '#95A3A1',
  teal:      '#328F86',
  paleTeal:  '#D7ECE6',
  gold:      '#C8A45A',
  paleGold:  '#F1E3B8',
  plum:      '#76658F',
  palePlum:  '#E8E1EF',
  slate:     '#4F7890',
  slateLight:'#DCE8ED',
  danger:    '#BA5A55',
}

const GRID = `linear-gradient(rgba(38,63,73,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(38,63,73,0.055) 1px,transparent 1px)`

/* ── Static mini route illustration ─────────────────────────── */
function RouteIllustration() {
  const [drawn, setDrawn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 200); return () => clearTimeout(t) }, [])

  const stops = [
    { x: 80,  y: 90,  label: 'Add your schools',      color: C.gold,  n: '1' },
    { x: 200, y: 190, label: 'Upload your resume',     color: C.teal,  n: '2' },
    { x: 95,  y: 295, label: 'Track every deadline',   color: C.plum,  n: '3' },
    { x: 205, y: 380, label: 'Submit with confidence', color: C.teal,  n: '4' },
  ]

  return (
    <div className="relative w-full max-w-[300px] mx-auto" style={{ height: 460 }}>
      {/* Card */}
      <div className="absolute inset-0 rounded-3xl"
        style={{
          background: C.card,
          border: `1.5px solid ${C.border}`,
          boxShadow: '0 16px 48px rgba(38,63,73,0.10)',
          backgroundImage: GRID,
          backgroundSize: '20px 20px',
        }}/>

      <svg viewBox="0 0 300 460" className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="lhatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke={C.paleTeal} strokeWidth="2.5"/>
          </pattern>
        </defs>

        {/* Hatch on first and last stop */}
        <ellipse cx="80" cy="90" rx="34" ry="20"
          fill="url(#lhatch)" opacity={drawn ? 0.7 : 0}
          style={{ transition: 'opacity 0.5s ease 0.4s' }}/>
        <ellipse cx="205" cy="380" rx="38" ry="20"
          fill={C.paleGold} opacity={drawn ? 0.55 : 0}
          style={{ transition: 'opacity 0.5s ease 1.4s' }}/>

        {/* Route line */}
        <path
          d="M 42 62 C 60 62, 80 74, 80 90
             C 80 108, 150 140, 200 190
             C 240 228, 160 258, 95 295
             C 50 322, 140 348, 205 380"
          fill="none" stroke={C.gold} strokeWidth="2.2" strokeLinecap="round"
          style={{
            strokeDasharray: 700,
            strokeDashoffset: drawn ? 0 : 700,
            transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4,0,0.2,1) 0.1s',
          }}
        />

        {/* Start */}
        <circle cx="42" cy="62" r="5" fill={C.teal}
          opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.3s ease 0.15s' }}/>
        <circle cx="42" cy="62" r="9" fill="none" stroke={C.teal} strokeWidth="1.2"
          opacity={drawn ? 0.35 : 0} style={{ transition: 'opacity 0.3s ease 0.15s' }}/>
        <text x="55" y="66" fontSize="8" fill={C.inkFaint} fontFamily="Montserrat,sans-serif"
          opacity={drawn ? 1 : 0} style={{ transition: 'opacity 0.3s ease 0.25s' }}>Start here</text>

        {/* Waypoints */}
        {stops.map((s, i) => (
          <g key={i} style={{
            opacity: drawn ? 1 : 0,
            transform: drawn ? 'none' : 'scale(0.5)',
            transformOrigin: `${s.x}px ${s.y}px`,
            transition: `opacity 0.4s ease ${0.5 + i * 0.25}s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.5 + i * 0.25}s`,
          }}>
            <circle cx={s.x} cy={s.y} r="16" fill={C.card} stroke={s.color} strokeWidth="1.8"/>
            <circle cx={s.x} cy={s.y} r="6" fill={s.color}/>
            <text x={s.x} y={s.y + 4} textAnchor="middle" fontSize="7" fontWeight="700"
              fill="white" fontFamily="Montserrat,sans-serif">{s.n}</text>
            <text
              x={i % 2 === 0 ? s.x + 24 : s.x - 24}
              y={s.y + 4}
              textAnchor={i % 2 === 0 ? 'start' : 'end'}
              fontSize="9" fontWeight="500" fill={C.inkMuted}
              fontFamily="Montserrat,sans-serif"
            >{s.label}</text>
          </g>
        ))}

        {/* Final check */}
        <g style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.4s ease 1.7s' }}>
          <rect x="217" y="362" width="22" height="14" rx="3"
            fill={C.teal} opacity="0.18" stroke={C.teal} strokeWidth="0.8"/>
          <text x="228" y="373" textAnchor="middle" fontSize="9" fill={C.teal}>✓</text>
        </g>

        {/* Compass top-right */}
        <g transform="translate(258, 50)" style={{ opacity: drawn ? 1 : 0, transition: 'opacity 0.5s ease 2s' }}>
          <circle r="18" fill={C.bgSoft} stroke={C.border} strokeWidth="1"/>
          <path d="M0,-10 L2.5,2 L0,0 L-2.5,2 Z" fill={C.gold}/>
          <path d="M0,10 L-2.5,-2 L0,0 L2.5,-2 Z" fill={C.inkFaint}/>
          <circle r="2" fill={C.ink}/>
          <line x1="-10" y1="0" x2="10" y2="0" stroke={C.border} strokeWidth="0.7"/>
        </g>
      </svg>
    </div>
  )
}

/* ── Login / Signup form ─────────────────────────────────────── */
function LoginPageInner() {
  const searchParams = useSearchParams()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState('')
  const [isError,  setIsError]  = useState(false)
  const [ready,    setReady]    = useState(false)

  const supabase = createClient()

  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t) }, [])

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setIsError(false)

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) { setMessage(error.message); setIsError(true) }
      else if (data.session) { window.location.href = '/dashboard' }
      else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInErr) { window.location.href = '/dashboard' }
        else setMessage('Check your email for a confirmation link.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setMessage(error.message); setIsError(true) }
      else window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  async function handleGoogleAuth() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: C.bgSoft,
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    color: C.inkStrong,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s ease',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{ minHeight: '100svh', background: C.bg, display: 'flex', fontFamily: 'var(--font-sans)' }}>

      {/* ── Left: Form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen lg:min-h-0"
        style={{ maxWidth: '100%' }}>

        {/* Logo */}
        <div className="w-full max-w-sm mb-8" style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.teal }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="2.5" fill="white"/>
                <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 15 }}>
              ApplyTracker
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm" style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 0.08s, transform 0.6s ease 0.08s',
        }}>
          <div className="rounded-2xl p-8"
            style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 4px 24px rgba(38,63,73,0.08)' }}>

            {/* Heading */}
            <h1 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 22, marginBottom: 6 }}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p style={{ color: C.inkMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              {isSignUp
                ? 'Start tracking your college applications for free.'
                : 'Sign in to continue planning your application season.'}
            </p>

            {/* Google */}
            <button onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2.5 rounded-[10px] text-sm font-medium transition-all duration-200"
              style={{ padding: '10px 16px', background: C.bgSoft, border: `1.5px solid ${C.border}`, color: C.inkStrong }}
              onMouseEnter={e => { (e.currentTarget).style.borderColor = C.inkMuted; (e.currentTarget).style.background = C.bg }}
              onMouseLeave={e => { (e.currentTarget).style.borderColor = C.border; (e.currentTarget).style.background = C.bgSoft }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: C.border }}/>
              <span style={{ color: C.inkFaint, fontSize: 11 }}>or</span>
              <div className="flex-1 h-px" style={{ background: C.border }}/>
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label style={{ display:'block', color:C.inkMuted, fontSize:12, fontWeight:500, marginBottom:6 }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = C.teal)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                  <label style={{ color:C.inkMuted, fontSize:12, fontWeight:500 }}>Password</label>
                  {/* Password-reset flow not built yet — hidden until it is, so this
                      isn't a dead button. Re-enable with supabase.auth.resetPasswordForEmail. */}
                </div>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder={isSignUp ? 'At least 8 characters' : '••••••••'}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = C.teal)}
                  onBlur={e => (e.target.style.borderColor = C.border)}
                />
              </div>

              {/* Message */}
              {message && (
                <div className="rounded-xl px-4 py-3 text-sm" style={{
                  background: isError ? '#F5DDD9' : C.paleTeal,
                  color: isError ? C.danger : C.teal,
                  border: `1px solid ${isError ? C.danger+'33' : C.teal+'33'}`,
                  fontSize: 13,
                }}>
                  {message}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full rounded-[10px] text-sm font-semibold transition-all duration-200"
                style={{ padding: '11px 16px', background: C.teal, color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!loading) (e.currentTarget).style.background = '#267970' }}
                onMouseLeave={e => { (e.currentTarget).style.background = C.teal }}>
                {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
            </form>

            {/* Toggle */}
            <p style={{ textAlign: 'center', color: C.inkFaint, fontSize: 13, marginTop: 20 }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => { setIsSignUp(!isSignUp); setMessage('') }}
                style={{ color: C.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                {isSignUp ? 'Sign in' : 'Sign up free'}
              </button>
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center mt-5">
            <Link href="/" style={{ color: C.inkFaint, fontSize: 12 }}
              onMouseEnter={e => (e.currentTarget.style.color = C.inkMuted)}
              onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right: Illustration (desktop only) ──────────────── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center px-12 relative overflow-hidden"
        style={{ background: C.bgSoft, borderLeft: `1px solid ${C.border}`, backgroundImage: GRID, backgroundSize: '24px 24px' }}>

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 45%, rgba(50,143,134,0.07) 0%, transparent 70%),
                       radial-gradient(ellipse 40% 40% at 60% 65%, rgba(200,164,90,0.06) 0%, transparent 60%)`,
        }}/>

        <div className="relative z-10 text-center" style={{
          opacity: ready ? 1 : 0,
          transform: ready ? 'none' : 'translateY(16px)',
          transition: 'opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s',
        }}>
          <RouteIllustration />

          <div className="mt-8" style={{ maxWidth: 280, margin: '2rem auto 0' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 20, lineHeight: 1.3, marginBottom: 10 }}>
              Your application season,<br/>mapped clearly.
            </h2>
            <p style={{ color: C.inkMuted, fontSize: 13, lineHeight: 1.7 }}>
              Track every school, every deadline, and every next step — all in one calm, organized place.
            </p>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-5 mt-6">
              {[
                { icon: '🔒', text: 'Private & secure' },
                { icon: '✦',  text: 'Free to start'    },
                { icon: '⚡', text: 'AI-powered'        },
              ].map(b => (
                <div key={b.text} className="flex items-center gap-1.5">
                  <span style={{ fontSize: 11 }}>{b.icon}</span>
                  <span style={{ color: C.inkFaint, fontSize: 11 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
