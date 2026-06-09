'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, Loader2, ExternalLink, Crown, Zap, Eye, EyeOff, AlertTriangle, X } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface Props {
  email: string
  provider: string
  isPro: boolean
  subscriptionPeriod: 'monthly' | 'quarterly' | null
  resumeCallsUsed: number
  initialName: string
  initialYear: number | null
  initialGpa: number | null
  initialSat: number | null
  initialAct: number | null
  initialMajors: string[]
}

/* ── Shared styles ────────────────────────────────────── */
const cardStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: '24px',
  boxShadow: '0 2px 10px rgba(38,63,73,0.07)',
} as const

const labelStyle = {
  fontSize: 11,
  fontWeight: 600 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: C.inkFaint,
  fontFamily: 'var(--font-sans)',
  display: 'block' as const,
  marginBottom: 6,
}

const inputStyle = {
  width: '100%',
  background: C.bgSoft,
  border: `1px solid ${C.border}`,
  color: C.ink,
  fontSize: 13,
  borderRadius: 10,
  padding: '9px 12px',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
} as const

const sectionTitle = {
  fontFamily: 'var(--font-serif)',
  color: C.inkStrong,
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 18,
} as const

const NOT_DECIDED = 'Not Decided'
const POPULAR_MAJORS = [
  'Computer Science', 'Business / Economics', 'Biology / Pre-Med',
  'Engineering', 'Psychology', 'Political Science', 'Mathematics',
  'Communications', 'Environmental Science', 'Data Science',
  'Architecture', 'Film / Media', 'Philosophy', 'Nursing',
]

const PRO_FEATURES = [
  'Bio Website Generator (5/month)',
  'AI Resume parsing (10/month)',
  'Email deadline reminders (coming soon)',
]

/* ── Profile section ──────────────────────────────────── */
function ProfileSection({ initialName, initialYear, initialGpa, initialSat, initialAct, initialMajors }: {
  initialName: string; initialYear: number | null
  initialGpa: number | null; initialSat: number | null; initialAct: number | null
  initialMajors: string[]
}) {
  const { toast } = useToast()
  const [name,   setName]   = useState(initialName)
  const [year,   setYear]   = useState(initialYear !== null ? String(initialYear) : '')
  const [gpa,    setGpa]    = useState(initialGpa  !== null ? String(initialGpa)  : '')
  const [sat,    setSat]    = useState(initialSat  !== null ? String(initialSat)  : '')
  const [act,    setAct]    = useState(initialAct  !== null ? String(initialAct)  : '')
  const [majors, setMajors] = useState<string[]>(initialMajors)
  const [customMajor, setCustomMajor] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleMajor(m: string) {
    if (m === NOT_DECIDED) {
      setMajors(prev => prev.includes(NOT_DECIDED) ? [] : [NOT_DECIDED])
    } else {
      setMajors(prev => {
        const without = prev.filter(x => x !== NOT_DECIDED)
        return without.includes(m) ? without.filter(x => x !== m) : [...without, m]
      })
    }
  }

  function addCustom() {
    const t = customMajor.trim()
    if (!t || majors.includes(t)) { setCustomMajor(''); return }
    setMajors(prev => [...prev.filter(x => x !== NOT_DECIDED), t])
    setCustomMajor('')
  }

  async function save() {
    setSaving(true)
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name:        name || null,
        graduation_year:  year ? parseInt(year) : null,
        gpa:              gpa  ? parseFloat(gpa) : null,
        sat_score:        sat  ? parseInt(sat)   : null,
        act_score:        act  ? parseInt(act)   : null,
        intended_majors:  majors,
      }),
    })
    setSaving(false)
    if (res.ok) toast('Profile updated')
    else toast('Failed to save', 'error')
  }

  return (
    <div style={cardStyle}>
      <p style={sectionTitle}>Profile</p>
      <div className="space-y-4">
        <div>
          <label style={labelStyle}>Display name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Your name" style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label style={labelStyle}>Graduation year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)}
              placeholder="e.g. 2026" style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
          </div>
          <div>
            <label style={labelStyle}>GPA (unweighted)</label>
            <input type="number" step="0.01" min="0" max="4" value={gpa}
              onChange={e => setGpa(e.target.value)} placeholder="e.g. 3.85"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
          </div>
          <div>
            <label style={labelStyle}>SAT score</label>
            <input type="number" min="400" max="1600" value={sat}
              onChange={e => setSat(e.target.value)} placeholder="400–1600"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
          </div>
          <div>
            <label style={labelStyle}>ACT score</label>
            <input type="number" min="1" max="36" value={act}
              onChange={e => setAct(e.target.value)} placeholder="1–36"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
          </div>
        </div>

        {/* Intended majors */}
        <div>
          <label style={labelStyle}>Intended major(s)</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <button onClick={() => toggleMajor(NOT_DECIDED)}
              className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
              style={majors.includes(NOT_DECIDED)
                ? { background: C.paleGold, color: C.gold, border: `1px solid ${C.gold}50` }
                : { background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
              Not Decided
            </button>
            {POPULAR_MAJORS.map(m => (
              <button key={m} onClick={() => toggleMajor(m)}
                className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
                style={majors.includes(m)
                  ? { background: C.paleTeal, color: C.teal, border: `1px solid ${C.teal}40` }
                  : { background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                {m}
              </button>
            ))}
            {majors.filter(m => !POPULAR_MAJORS.includes(m) && m !== NOT_DECIDED).map(m => (
              <span key={m} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg"
                style={{ background: C.paleTeal, color: C.teal, border: `1px solid ${C.teal}40` }}>
                {m}
                <button onClick={() => toggleMajor(m)} className="opacity-60 hover:opacity-100 ml-0.5"><X size={9}/></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={customMajor} onChange={e => setCustomMajor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustom()}
              placeholder="Other major…" style={{ ...inputStyle, flex: 1 }}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            <button onClick={addCustom}
              className="text-sm px-3 rounded-lg transition-all"
              style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.teal + '55' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
              Add
            </button>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-50"
          style={{ background: C.teal, color: 'white' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#267970'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
          Save profile
        </button>
      </div>
    </div>
  )
}

/* ── Password section ─────────────────────────────────── */
function PasswordSection() {
  const { toast } = useToast()
  const [current,  setCurrent]  = useState('')
  const [next,     setNext]     = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showCur,  setShowCur]  = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  async function changePassword() {
    setErr('')
    if (next !== confirm) { setErr('New passwords do not match.'); return }
    if (next.length < 8)  { setErr('Password must be at least 8 characters.'); return }
    setSaving(true)
    const res = await fetch('/api/settings/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: next }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      toast('Password updated')
      setCurrent(''); setNext(''); setConfirm('')
    } else {
      setErr(data.error ?? 'Something went wrong.')
    }
  }

  const pwInput = (value: string, onChange: (v: string) => void, placeholder: string, show: boolean, toggle: () => void) => (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={{ ...inputStyle, paddingRight: 40 }}
        onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
        onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
      <button type="button" onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
        style={{ color: C.ink }}>
        {show ? <EyeOff size={15}/> : <Eye size={15}/>}
      </button>
    </div>
  )

  return (
    <div style={cardStyle}>
      <p style={sectionTitle}>Change Password</p>
      <div className="space-y-3">
        <div>
          <label style={labelStyle}>Current password</label>
          {pwInput(current, setCurrent, '••••••••', showCur, () => setShowCur(v => !v))}
        </div>
        <div>
          <label style={labelStyle}>New password</label>
          {pwInput(next, setNext, 'At least 8 characters', showNext, () => setShowNext(v => !v))}
        </div>
        <div>
          <label style={labelStyle}>Confirm new password</label>
          {pwInput(confirm, setConfirm, 'Same as above', showNext, () => setShowNext(v => !v))}
        </div>

        {err && (
          <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
            style={{ background: '#F5DDD9', color: C.danger, border: `1px solid ${C.danger}30` }}>
            <AlertTriangle size={12}/> {err}
          </div>
        )}

        <button onClick={changePassword} disabled={saving || !current || !next || !confirm}
          className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-40"
          style={{ background: C.teal, color: 'white' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#267970'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
          {saving ? <Loader2 size={13} className="animate-spin"/> : <Check size={13}/>}
          Update password
        </button>
      </div>
    </div>
  )
}

/* ── Plan section ─────────────────────────────────────── */
function PlanSection({ isPro, subscriptionPeriod, resumeCallsUsed }: {
  isPro: boolean; subscriptionPeriod: 'monthly' | 'quarterly' | null; resumeCallsUsed: number
}) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(period: 'monthly' | 'quarterly' | 'bio_onetime') {
    setLoading(period)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  async function handlePortal() {
    setLoading('portal')
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setLoading(null)
  }

  return (
    <div style={cardStyle}>
      <p style={sectionTitle}>Subscription</p>
      {isPro ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: C.paleGold, color: '#7A5C1E', border: `1px solid ${C.gold}40` }}>
              <Crown size={11}/> Pro
            </span>
            <span style={{ color: C.inkMuted, fontSize: 14 }}>
              {subscriptionPeriod === 'quarterly' ? '$50 / 3 months' : '$20 / month'}
            </span>
          </div>
          <p style={{ color: C.inkFaint, fontSize: 12 }}>All AI features unlocked · Bio site: 5 generations/month</p>
          <button onClick={handlePortal} disabled={loading === 'portal'}
            className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 transition-all disabled:opacity-50"
            style={{ color: C.inkMuted, border: `1px solid ${C.border}`, background: C.bgSoft }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.ink; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(38,63,73,0.25)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.inkMuted; (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
            {loading === 'portal' ? <Loader2 size={13} className="animate-spin"/> : <ExternalLink size={13}/>}
            Manage subscription
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>Free</span>
            <span style={{ color: C.inkMuted, fontSize: 13 }}>AI Resume: {resumeCallsUsed}/1 use this month</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-4 space-y-3" style={{ border: `1px solid ${C.border}`, background: C.bgSoft }}>
              <div>
                <p style={{ color: C.inkStrong, fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-serif)' }}>
                  $20<span style={{ color: C.inkFaint, fontSize: 12, fontWeight: 400 }}>/month</span>
                </p>
                <p style={{ color: C.inkFaint, fontSize: 12 }}>Billed monthly</p>
              </div>
              <button onClick={() => handleCheckout('monthly')} disabled={loading === 'monthly'}
                className="w-full flex items-center justify-center gap-2 text-sm rounded-xl py-2 font-semibold transition-all disabled:opacity-50"
                style={{ background: C.teal, color: 'white' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#267970'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
                {loading === 'monthly' ? <Loader2 size={13} className="animate-spin"/> : null}
                Upgrade monthly
              </button>
            </div>
            <div className="rounded-xl p-4 space-y-3 relative" style={{ border: `1.5px solid ${C.gold}`, background: C.paleGold + '55' }}>
              <span className="absolute -top-2.5 left-3 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: C.gold, color: 'white' }}>Best value</span>
              <div>
                <p style={{ color: C.inkStrong, fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-serif)' }}>
                  $50<span style={{ color: C.inkFaint, fontSize: 12, fontWeight: 400 }}>/3 months</span>
                </p>
                <p style={{ color: C.inkFaint, fontSize: 12 }}>~$16.67/mo · save 17%</p>
              </div>
              <button onClick={() => handleCheckout('quarterly')} disabled={loading === 'quarterly'}
                className="w-full flex items-center justify-center gap-2 text-sm rounded-xl py-2 font-semibold transition-all disabled:opacity-50"
                style={{ background: C.gold, color: 'white' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#A8883A'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.gold}>
                {loading === 'quarterly' ? <Loader2 size={13} className="animate-spin"/> : null}
                Upgrade 3 months
              </button>
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: C.inkFaint, marginBottom: 10, fontFamily: 'var(--font-sans)' }}>Pro includes</p>
            <div className="space-y-2">
              {PRO_FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2.5 text-sm" style={{ color: C.inkMuted }}>
                  <Check size={13} style={{ color: C.success, flexShrink: 0 }} strokeWidth={2.5}/> {f}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4 flex items-center justify-between gap-4"
            style={{ border: `1px solid ${C.border}`, background: C.card }}>
            <div>
              <p style={{ color: C.inkStrong, fontWeight: 600, fontSize: 14 }}>Bio Website — One-time</p>
              <p style={{ color: C.inkFaint, fontSize: 12, marginTop: 2 }}>1 personal bio site, no subscription needed</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <p style={{ color: C.inkStrong, fontWeight: 700, fontFamily: 'var(--font-serif)', fontSize: 18 }}>$15</p>
              <button onClick={() => handleCheckout('bio_onetime')} disabled={loading === 'bio_onetime'}
                className="flex items-center gap-1.5 text-xs rounded-xl px-3 py-2 font-semibold transition-all disabled:opacity-50"
                style={{ background: C.plum, color: 'white' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#5D5075'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.plum}>
                {loading === 'bio_onetime' ? <Loader2 size={12} className="animate-spin"/> : <Zap size={12}/>}
                Buy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Danger zone ──────────────────────────────────────── */
function DangerZone({ email }: { email: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const [signingOut, setSigningOut]   = useState(false)
  const [deleting,   setDeleting]     = useState(false)
  const [confirmDel, setConfirmDel]   = useState(false)
  const [confirmText, setConfirmText] = useState('')

  async function signOut() {
    setSigningOut(true)
    await fetch('/api/settings/signout', { method: 'POST' })
    router.push('/login')
  }

  async function deleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/settings/account', { method: 'DELETE' })
    if (res.ok) {
      router.push('/login')
    } else {
      const data = await res.json()
      toast(data.error ?? 'Failed to delete account', 'error')
      setDeleting(false)
      setConfirmDel(false)
      setConfirmText('')
    }
  }

  return (
    <div style={{ ...cardStyle, border: `1px solid ${C.danger}30` }}>
      <p style={{ ...sectionTitle, color: C.danger }}>Danger Zone</p>
      <div className="space-y-4">

        {/* Sign out */}
        <div className="flex items-center justify-between gap-4 py-3"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p style={{ color: C.inkStrong, fontSize: 14, fontWeight: 500 }}>Sign out</p>
            <p style={{ color: C.inkFaint, fontSize: 12, marginTop: 2 }}>Sign out of your account on this device.</p>
          </div>
          <button onClick={signOut} disabled={signingOut}
            className="flex-shrink-0 flex items-center gap-2 text-sm rounded-xl px-4 py-2 transition-all disabled:opacity-50"
            style={{ color: C.inkMuted, border: `1px solid ${C.border}`, background: C.bgSoft }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.ink; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(38,63,73,0.25)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.inkMuted; (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
            {signingOut ? <Loader2 size={13} className="animate-spin"/> : null}
            Sign out
          </button>
        </div>

        {/* Delete account */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p style={{ color: C.inkStrong, fontSize: 14, fontWeight: 500 }}>Delete account</p>
              <p style={{ color: C.inkFaint, fontSize: 12, marginTop: 2 }}>
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            {!confirmDel && (
              <button onClick={() => setConfirmDel(true)}
                className="flex-shrink-0 text-sm rounded-xl px-4 py-2 transition-all"
                style={{ color: C.danger, border: `1px solid ${C.danger}40`, background: '#F5DDD9' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EFCBC7' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F5DDD9' }}>
                Delete account
              </button>
            )}
          </div>

          {confirmDel && (
            <div className="mt-4 rounded-xl p-4 space-y-3"
              style={{ background: '#F5DDD9', border: `1px solid ${C.danger}30` }}>
              <p style={{ fontSize: 13, color: C.danger, fontWeight: 500 }}>
                This will permanently delete your account and all application data.
              </p>
              <p style={{ fontSize: 12, color: C.inkMuted }}>
                Type <strong>{email}</strong> to confirm:
              </p>
              <input type="email" value={confirmText} onChange={e => setConfirmText(e.target.value)}
                placeholder={email}
                style={{ ...inputStyle, background: 'white', borderColor: `${C.danger}40` }}
                onFocus={e => (e.currentTarget.style.borderColor = C.danger)}
                onBlur={e => (e.currentTarget.style.borderColor = `${C.danger}40`)}/>
              <div className="flex gap-2">
                <button onClick={() => { setConfirmDel(false); setConfirmText('') }}
                  className="flex-1 text-sm rounded-xl py-2 transition-colors"
                  style={{ color: C.inkMuted, border: `1px solid ${C.border}`, background: 'white' }}>
                  Cancel
                </button>
                <button onClick={deleteAccount}
                  disabled={confirmText !== email || deleting}
                  className="flex-1 flex items-center justify-center gap-2 text-sm rounded-xl py-2 font-semibold transition-all disabled:opacity-40"
                  style={{ background: C.danger, color: 'white' }}>
                  {deleting ? <Loader2 size={13} className="animate-spin"/> : <AlertTriangle size={13}/>}
                  Delete permanently
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Main ─────────────────────────────────────────────── */
function SettingsInner({
  email, provider, isPro, subscriptionPeriod, resumeCallsUsed,
  initialName, initialYear, initialGpa, initialSat, initialAct, initialMajors,
}: Props) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const success  = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  // Fire the success toast ONCE on arrival (not in the render body — that re-fired
  // it on every re-render and stacked the toasts into a full-height column).
  useEffect(() => {
    if (success === 'bio') toast('Bio Website unlocked! You have 3 generations to use.')
    else if (success) toast('You\'re now Pro! All features unlocked.')
  }, [success, toast])

  const isEmailProvider = provider === 'email'

  return (
    <div style={{ color: C.ink }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, marginBottom: 6 }}>
        Settings
      </h1>
      <p style={{ color: C.inkMuted, fontSize: 14, marginBottom: 28 }}>
        {email} · {isPro ? 'Pro plan' : 'Free plan'}
      </p>

      {canceled && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.inkMuted }}>
          Checkout canceled. Your plan was not changed.
        </div>
      )}

      <div className="space-y-5">
        <ProfileSection
          initialName={initialName} initialYear={initialYear}
          initialGpa={initialGpa} initialSat={initialSat} initialAct={initialAct}
          initialMajors={initialMajors}/>

        {isEmailProvider && <PasswordSection/>}

        <PlanSection isPro={isPro} subscriptionPeriod={subscriptionPeriod} resumeCallsUsed={resumeCallsUsed}/>

        <DangerZone email={email}/>
      </div>
    </div>
  )
}

export default function SettingsClient(props: Props) {
  return (
    <Suspense fallback={null}>
      <SettingsInner {...props}/>
    </Suspense>
  )
}
