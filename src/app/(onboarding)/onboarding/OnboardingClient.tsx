'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, X, GraduationCap, BookOpen, BarChart2, Sparkles } from 'lucide-react'
import { C } from '@/lib/atlas'

const CURRENT_YEAR = new Date().getFullYear()
const GRAD_YEARS = [CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2, CURRENT_YEAR + 3, CURRENT_YEAR + 4]

const POPULAR_MAJORS = [
  'Computer Science', 'Business / Economics', 'Biology / Pre-Med',
  'Engineering', 'Psychology', 'Political Science', 'Mathematics',
  'Communications', 'Environmental Science', 'Data Science',
  'Architecture', 'Film / Media', 'Philosophy', 'Nursing',
]

interface Props {
  initialName: string
  initialYear: number | null
  initialGpa: number | null
  initialSat: number | null
  initialAct: number | null
  initialMajors: string[]
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

const labelStyle = {
  fontSize: 11,
  fontWeight: 600 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  color: C.inkFaint,
  fontFamily: 'var(--font-sans)',
}

const STEP_ICONS  = [GraduationCap, BarChart2, BookOpen, Sparkles]
const STEP_COLORS = [C.teal, C.gold, C.plum, C.success]
const STEP_PALE   = [C.paleTeal, C.paleGold, C.palePlum, '#D1EBE0']

export default function OnboardingClient({
  initialName, initialYear, initialGpa, initialSat, initialAct, initialMajors,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const totalSteps = 4

  const [name, setName]   = useState(initialName)
  const [year, setYear]   = useState<number | null>(initialYear)
  const [gpa,  setGpa]    = useState(initialGpa  !== null ? String(initialGpa)  : '')
  const [sat,  setSat]    = useState(initialSat  !== null ? String(initialSat)  : '')
  const [act,  setAct]    = useState(initialAct  !== null ? String(initialAct)  : '')
  const [majors,      setMajors]      = useState<string[]>(initialMajors)
  const [customMajor, setCustomMajor] = useState('')
  const [saving, setSaving] = useState(false)

  const StepIcon  = STEP_ICONS[step - 1]
  const stepColor = STEP_COLORS[step - 1]
  const stepPale  = STEP_PALE[step - 1]

  function toggleMajor(m: string) {
    setMajors(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  function addCustomMajor() {
    const trimmed = customMajor.trim()
    if (!trimmed || majors.includes(trimmed)) { setCustomMajor(''); return }
    setMajors(prev => [...prev, trimmed])
    setCustomMajor('')
  }

  async function saveStep(extra?: Record<string, unknown>) {
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extra ?? {}),
    })
  }

  async function handleNext() {
    setSaving(true)
    if (step === 1) await saveStep({ full_name: name || null, graduation_year: year })
    else if (step === 2) await saveStep({ gpa: gpa ? parseFloat(gpa) : null, sat_score: sat ? parseInt(sat) : null, act_score: act ? parseInt(act) : null })
    else if (step === 3) await saveStep({ intended_majors: majors })
    setSaving(false)
    setStep(s => s + 1)
  }

  async function handleFinish() {
    setSaving(true)
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complete: true }),
    })
    setSaving(false)
    router.push('/dashboard')
  }

  async function handleSkip() {
    if (step < totalSteps) setStep(s => s + 1)
    else await handleFinish()
  }

  return (
    <div>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: C.teal }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2.5" fill="white"/>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 15 }}>
          ApplyTracker
        </span>
      </div>

      {/* Progress pills */}
      <div className="flex gap-1.5 mb-7">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{ background: i < step ? stepColor : C.border }}/>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl p-7"
        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 4px 24px rgba(38,63,73,0.10)' }}>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: stepPale, border: `1px solid ${stepColor}30` }}>
            <StepIcon size={17} style={{ color: stepColor }}/>
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.inkFaint, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step {step} of {totalSteps}
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>
              {step === 1 && 'Welcome — tell us about yourself'}
              {step === 2 && 'Academic scores'}
              {step === 3 && 'Intended majors'}
              {step === 4 && "You're all set"}
            </h2>
          </div>
        </div>

        {/* Step 1: Name + Grad Year */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label style={labelStyle}>Your name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Alex Chen" autoFocus style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>
            <div className="space-y-1.5">
              <label style={labelStyle}>Graduation year</label>
              <div className="flex gap-2 flex-wrap">
                {GRAD_YEARS.map(y => (
                  <button key={y} onClick={() => setYear(y === year ? null : y)}
                    className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
                    style={year === y
                      ? { background: C.teal, color: 'white', border: `1px solid ${C.teal}` }
                      : { background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }
                    }
                    onMouseEnter={e => { if (year !== y) (e.currentTarget as HTMLElement).style.borderColor = C.teal + '55' }}
                    onMouseLeave={e => { if (year !== y) (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Scores */}
        {step === 2 && (
          <div className="space-y-4">
            <p style={{ fontSize: 12, color: C.inkMuted, marginTop: -8 }}>All fields optional — skip if not taken yet.</p>
            <div className="space-y-1.5">
              <label style={labelStyle}>GPA (unweighted)</label>
              <input type="number" step="0.01" min="0" max="4" value={gpa}
                onChange={e => setGpa(e.target.value)} placeholder="e.g. 3.85" autoFocus
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label style={labelStyle}>SAT score</label>
                <input type="number" min="400" max="1600" value={sat}
                  onChange={e => setSat(e.target.value)} placeholder="400–1600"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
              </div>
              <div className="space-y-1.5">
                <label style={labelStyle}>ACT score</label>
                <input type="number" min="1" max="36" value={act}
                  onChange={e => setAct(e.target.value)} placeholder="1–36"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Majors */}
        {step === 3 && (
          <div className="space-y-4">
            <p style={{ fontSize: 12, color: C.inkMuted, marginTop: -8 }}>Select all that interest you, or add your own.</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_MAJORS.map(m => (
                <button key={m} onClick={() => toggleMajor(m)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                  style={majors.includes(m)
                    ? { background: C.paleTeal, color: C.teal, border: `1px solid ${C.teal}40` }
                    : { background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }
                  }>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {majors.filter(m => !POPULAR_MAJORS.includes(m)).map(m => (
                <span key={m} className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: C.paleTeal, color: C.teal, border: `1px solid ${C.teal}40` }}>
                  {m}
                  <button onClick={() => toggleMajor(m)} className="ml-1 opacity-60 hover:opacity-100"><X size={10}/></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={customMajor} onChange={e => setCustomMajor(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomMajor()}
                placeholder="Add another major…" style={{ ...inputStyle, flex: 1 }}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
              <button onClick={addCustomMajor}
                className="text-sm px-4 rounded-lg transition-all"
                style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.teal + '55'; (e.currentTarget as HTMLElement).style.color = C.ink }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.inkMuted }}>
                Add
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
              style={{ background: '#D1EBE0', border: `1px solid ${C.success}30` }}>
              <Sparkles size={22} style={{ color: C.success }}/>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 17 }}>
                {name ? `Welcome, ${name.split(' ')[0]}!` : 'All done!'}
              </p>
              <p style={{ color: C.inkMuted, fontSize: 13, marginTop: 4 }}>
                Your profile is set up. Start tracking your applications.
              </p>
            </div>
            {(year || gpa || sat || act || majors.length > 0) && (
              <div className="rounded-xl p-4 space-y-2 text-left"
                style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
                {year && <div className="flex justify-between text-xs"><span style={{ color: C.inkFaint }}>Graduation</span><span style={{ color: C.inkStrong, fontWeight: 600 }}>{year}</span></div>}
                {gpa  && <div className="flex justify-between text-xs"><span style={{ color: C.inkFaint }}>GPA</span><span style={{ color: C.inkStrong, fontWeight: 600 }}>{gpa}</span></div>}
                {sat  && <div className="flex justify-between text-xs"><span style={{ color: C.inkFaint }}>SAT</span><span style={{ color: C.inkStrong, fontWeight: 600 }}>{sat}</span></div>}
                {act  && <div className="flex justify-between text-xs"><span style={{ color: C.inkFaint }}>ACT</span><span style={{ color: C.inkStrong, fontWeight: 600 }}>{act}</span></div>}
                {majors.length > 0 && (
                  <div className="flex justify-between gap-4 text-xs">
                    <span style={{ color: C.inkFaint, flexShrink: 0 }}>Majors</span>
                    <span style={{ color: C.inkStrong, fontWeight: 600, textAlign: 'right' }}>{majors.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 mt-6">
          {step < totalSteps && (
            <button onClick={handleSkip} className="text-sm px-3 transition-colors"
              style={{ color: C.inkFaint }}
              onMouseEnter={e => (e.currentTarget.style.color = C.inkMuted)}
              onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)}>
              Skip
            </button>
          )}
          <button
            onClick={step < totalSteps ? handleNext : handleFinish}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 text-sm rounded-xl py-2.5 font-semibold transition-all disabled:opacity-50"
            style={{ background: stepColor, color: 'white' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.88'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
            {saving ? 'Saving…' : step === totalSteps
              ? 'Go to Tracker'
              : <><span>Continue</span><ChevronRight size={15}/></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
