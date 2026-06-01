'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Search, Plus, Loader2, Check } from 'lucide-react'
import { ApplicationType, ApplicationStatus } from '@/types/database'
import { getAvailableRounds } from '@/lib/rounds'
import { statusConfig } from './StatusBadge'
import { C } from '@/lib/atlas'

interface SchoolResult {
  id: string
  name: string
  acceptance_rate: number | null
  sat_25th: number | null
  sat_75th: number | null
  rounds_offered: string[] | null
  deadline_ea: string | null
  deadline_ed: string | null
  deadline_rolling: boolean
}

interface Props {
  existingSchoolIds: Set<string>
  onAdd: (schoolId: string) => Promise<void>
  onClose: () => void
}

const ROUND_LABELS: Record<ApplicationType, string> = {
  EA:      'EA — Early Action',
  REA:     'REA — Restrictive EA',
  ED:      'ED — Early Decision',
  RD:      'RD — Regular Decision',
  Rolling: 'Rolling',
}

const allStatuses = Object.keys(statusConfig) as ApplicationStatus[]

const inputStyle = {
  width: '100%',
  background: C.bgSoft,
  border: `1px solid ${C.border}`,
  color: C.ink,
  fontSize: 13,
  borderRadius: 10,
  padding: '8px 12px',
  outline: 'none',
} as const

/* ── Quick-setup sheet ──────────────────────────────── */
function QuickSetupSheet({
  school, onSave, onSkip,
}: {
  school: SchoolResult
  onSave: (fields: { application_type: ApplicationType | null; status: ApplicationStatus; intended_major: string | null; portal_url: string | null; notes: string | null }) => Promise<void>
  onSkip: () => void
}) {
  const availableRounds = getAvailableRounds(school)
  const [round, setRound]       = useState<ApplicationType | null>(availableRounds.length === 1 ? availableRounds[0] : null)
  const [status, setStatus]     = useState<ApplicationStatus>('not_started')
  const [major, setMajor]       = useState('')
  const [portalUrl, setPortalUrl] = useState('')
  const [notes, setNotes]       = useState('')
  const [saving, setSaving]     = useState(false)
  const st = statusConfig[status]

  async function handleSave() {
    setSaving(true)
    await onSave({ application_type: round, status, intended_major: major || null, portal_url: portalUrl || null, notes: notes || null })
    setSaving(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(38,63,73,0.45)' }} onClick={onSkip}/>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-sm flex flex-col rounded-2xl overflow-hidden"
          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(38,63,73,0.2)' }}>
          <div className="flex items-start justify-between p-5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div>
              <p className="text-xs mb-0.5" style={{ color: C.inkFaint }}>Added to tracker</p>
              <h3 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 15 }}>{school.name}</h3>
            </div>
            <button onClick={onSkip} className="transition-colors mt-0.5" style={{ color: C.inkFaint }}>
              <X size={16}/>
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto max-h-[65vh]">
            <div className="space-y-2">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.inkFaint }}>Application Round</p>
              <div className="flex flex-wrap gap-2">
                {availableRounds.map(r => (
                  <button key={r} onClick={() => setRound(r === round ? null : r)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                    style={round === r
                      ? { background: C.teal, color: 'white', border: `1px solid ${C.teal}` }
                      : { background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }
                    }
                    onMouseEnter={e => { if (round !== r) (e.currentTarget as HTMLElement).style.borderColor = C.teal + '55' }}
                    onMouseLeave={e => { if (round !== r) (e.currentTarget as HTMLElement).style.borderColor = C.border }}>
                    {ROUND_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.inkFaint }}>Status</p>
              <select value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}
                style={{ ...inputStyle, color: st.color, background: st.bg, border: `1px solid ${st.color}40` }}>
                {allStatuses.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.inkFaint }}>Intended Major</p>
              <input type="text" value={major} onChange={e => setMajor(e.target.value)}
                placeholder="e.g. Computer Science" style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>

            <div className="space-y-1.5">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.inkFaint }}>Portal URL</p>
              <input type="url" value={portalUrl} onChange={e => setPortalUrl(e.target.value)}
                placeholder="https://apply.school.edu/..." style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>

            <div className="space-y-1.5">
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.inkFaint }}>Notes</p>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Anything to remember..." rows={2}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>
          </div>

          <div className="p-5 flex gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <button onClick={onSkip}
              className="flex-1 text-sm rounded-xl py-2.5 transition-colors"
              style={{ color: C.inkMuted, border: `1px solid ${C.border}` }}>
              Skip
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 text-sm rounded-xl py-2.5 font-semibold transition-all disabled:opacity-50"
              style={{ background: C.teal, color: 'white' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#267970')}
              onMouseLeave={e => (e.currentTarget.style.background = C.teal)}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Main modal ─────────────────────────────────────── */
export default function AddSchoolModal({ existingSchoolIds, onAdd, onClose }: Props) {
  const [query, setQuery]         = useState('')
  const [results, setResults]     = useState<SchoolResult[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding]       = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const [quickSetupSchool, setQuickSetupSchool] = useState<SchoolResult | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const res = await fetch(`/api/schools?q=${encodeURIComponent(query)}`)
      if (res.ok) setResults(await res.json())
      setSearching(false)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  async function handleAdd(school: SchoolResult) {
    setAdding(school.id)
    await onAdd(school.id)
    setAdding(null)
    setQuickSetupSchool(school)
  }

  async function handleQuickSave(fields: { application_type: ApplicationType | null; status: ApplicationStatus; intended_major: string | null; portal_url: string | null; notes: string | null }) {
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: quickSetupSchool!.id, ...fields }),
    })
    setConfirmed(prev => new Set(prev).add(quickSetupSchool!.id))
    setQuickSetupSchool(null)
  }

  function handleQuickSkip() {
    if (quickSetupSchool) {
      setConfirmed(prev => new Set(prev).add(quickSetupSchool.id))
      setQuickSetupSchool(null)
    }
  }

  const isAdded = (id: string) => existingSchoolIds.has(id) || confirmed.has(id)

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(38,63,73,0.35)' }} onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg flex flex-col rounded-2xl overflow-hidden max-h-[80vh]"
          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 20px 60px rgba(38,63,73,0.18)' }}>

          {/* Header */}
          <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${C.border}` }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 16 }}>Add a School</h2>
            <button onClick={onClose} className="transition-colors" style={{ color: C.inkFaint }}
              onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
              onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)}>
              <X size={18}/>
            </button>
          </div>

          {/* Search */}
          <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }}/>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search 1,600+ US universities…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}
              />
              {searching && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: C.inkFaint }}/>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto flex-1">
            {query.length < 2 && (
              <p className="text-sm text-center py-10" style={{ color: C.inkFaint }}>
                Type at least 2 characters to search
              </p>
            )}
            {query.length >= 2 && !searching && results.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: C.inkFaint }}>
                No schools found for &ldquo;{query}&rdquo;
              </p>
            )}
            {results.map(school => {
              const added = isAdded(school.id)
              return (
                <div key={school.id}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bgSoft}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: C.inkStrong, fontFamily: 'var(--font-serif)' }}>{school.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.inkFaint }}>
                      {school.acceptance_rate != null ? `${school.acceptance_rate}% admit` : 'Acceptance rate N/A'}
                      {school.sat_25th && school.sat_75th && ` · SAT ${school.sat_25th}–${school.sat_75th}`}
                    </p>
                  </div>
                  <button
                    onClick={() => !added && adding !== school.id && handleAdd(school)}
                    disabled={added || adding === school.id}
                    className="ml-4 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0"
                    style={added
                      ? { background: C.bgSoft, color: C.inkFaint, cursor: 'default' }
                      : adding === school.id
                      ? { background: C.paleTeal, color: C.teal }
                      : { background: C.teal, color: 'white' }
                    }
                    onMouseEnter={e => { if (!added && adding !== school.id) (e.currentTarget as HTMLElement).style.background = '#267970' }}
                    onMouseLeave={e => { if (!added && adding !== school.id) (e.currentTarget as HTMLElement).style.background = C.teal }}>
                    {added
                      ? <><Check size={12}/> Added</>
                      : adding === school.id
                      ? <Loader2 size={12} className="animate-spin"/>
                      : <><Plus size={12}/> Add</>
                    }
                  </button>
                </div>
              )
            })}
          </div>

          {confirmed.size > 0 && (
            <div className="p-4" style={{ borderTop: `1px solid ${C.border}` }}>
              <button onClick={onClose}
                className="w-full text-sm py-2.5 rounded-xl font-medium transition-all"
                style={{ background: C.paleTeal, color: C.teal }}
                onMouseEnter={e => (e.currentTarget.style.background = C.paleTeal.replace('D7', 'C0'))}
                onMouseLeave={e => (e.currentTarget.style.background = C.paleTeal)}>
                Done — {confirmed.size} school{confirmed.size !== 1 ? 's' : ''} added ✓
              </button>
            </div>
          )}
        </div>
      </div>

      {quickSetupSchool && (
        <QuickSetupSheet school={quickSetupSchool} onSave={handleQuickSave} onSkip={handleQuickSkip}/>
      )}
    </>
  )
}
