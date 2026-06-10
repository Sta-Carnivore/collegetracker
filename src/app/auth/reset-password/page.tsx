'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const C = {
  bg:        '#EEE7D9',
  card:      '#FFFAF0',
  border:    'rgba(38,63,73,0.12)',
  ink:       '#263F49',
  inkStrong: '#1D2E36',
  inkMuted:  '#687B7C',
  inkFaint:  '#95A3A1',
  teal:      '#328F86',
  paleTeal:  '#D7ECE6',
  danger:    '#BA5A55',
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [message,   setMessage]   = useState('')
  const [isError,   setIsError]   = useState(false)
  const [ready,     setReady]     = useState(false)

  useEffect(() => { setReady(true) }, [])

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: '#F7F2E8',
    border: `1.5px solid ${C.border}`,
    borderRadius: 9,
    color: C.inkStrong,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'var(--font-sans)',
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setMessage('Passwords do not match.')
      setIsError(true)
      return
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      setIsError(true)
      return
    }
    setLoading(true)
    setMessage('')
    setIsError(false)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message)
      setIsError(true)
    } else {
      setMessage('Password updated! Redirecting…')
      setTimeout(() => router.push('/dashboard'), 1500)
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100svh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'var(--font-sans)' }}>
      <div style={{
        width: '100%', maxWidth: 360,
        opacity: ready ? 1 : 0,
        transform: ready ? 'none' : 'translateY(16px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div className="rounded-2xl p-8" style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 4px 24px rgba(38,63,73,0.08)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 22, marginBottom: 6 }}>
            Set new password
          </h1>
          <p style={{ color: C.inkMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
            Choose a new password for your account.
          </p>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label style={{ display: 'block', color: C.inkMuted, fontSize: 12, fontWeight: 500, marginBottom: 6 }}>New password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="At least 8 characters"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = C.teal)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: C.inkMuted, fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Confirm password</label>
              <input
                type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                placeholder="Repeat your password"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = C.teal)}
                onBlur={e => (e.target.style.borderColor = C.border)}
              />
            </div>

            {message && (
              <div className="rounded-xl px-4 py-3 text-sm" style={{
                background: isError ? '#F5DDD9' : C.paleTeal,
                color: isError ? C.danger : C.teal,
                border: `1px solid ${isError ? C.danger + '33' : C.teal + '33'}`,
                fontSize: 13,
              }}>{message}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-[10px] text-sm font-semibold transition-all duration-200"
              style={{ padding: '11px 16px', background: C.teal, color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#267970' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.teal }}>
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
