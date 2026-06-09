'use client'

import { useState } from 'react'
import { X, ExternalLink, Check } from 'lucide-react'
import { School, Application, ApplicationStatus, ApplicationType, SchoolEssay } from '@/types/database'
import { getAvailableRounds } from '@/lib/rounds'
import { statusConfig } from './StatusBadge'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface Props {
  school: School
  application: Application | null
  essays: SchoolEssay[]
  essayProgress: Record<string, boolean>
  onEssayToggle: (essayId: string, done: boolean) => void
  onClose: () => void
  onUpdate: () => void
  onRemove: () => void
}

const ROUND_LABELS: Record<ApplicationType, string> = {
  EA: 'EA — Early Action',
  REA: 'REA — Restrictive EA',
  ED: 'ED — Early Decision',
  RD: 'RD — Regular Decision',
  Rolling: 'Rolling',
}
const statuses = Object.keys(statusConfig) as ApplicationStatus[]

function fmt(date: string | null) {
  if (!date) return '—'
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const inputStyle = {
  width: '100%',
  background: C.bgSoft,
  border: `1px solid ${C.border}`,
  color: C.ink,
  fontSize: 13,
  borderRadius: 10,
  padding: '8px 12px',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
} as const

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  color: C.inkFaint,
  fontFamily: 'var(--font-sans)',
}

const statCellStyle = {
  background: C.bgSoft,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: '10px 12px',
}

export default function SchoolDrawer({ school, application, essays, essayProgress, onEssayToggle, onClose, onUpdate, onRemove }: Props) {
  const { toast } = useToast()
  const [status, setStatus]         = useState<ApplicationStatus>(application?.status ?? 'not_started')
  const [appType, setAppType]       = useState<ApplicationType | ''>(application?.application_type ?? '')
  const [major, setMajor]           = useState(application?.intended_major ?? '')
  const [notes, setNotes]           = useState(application?.notes ?? '')
  const [portalUrl, setPortalUrl]   = useState(application?.portal_url ?? '')
  const [localProgress, setLocalProgress] = useState<Record<string, boolean>>(essayProgress)
  const [saving, setSaving]         = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving]     = useState(false)

  const essaysDone = essays.filter(e => localProgress[e.id]).length
  const essaysTotal = essays.length

  // Edits seed from the user's personal override when present, else the school's
  // official value. Saving writes to the user's application row, never the global
  // schools table.
  const [deadlineEa, setDeadlineEa]             = useState(application?.deadline_ea ?? school.deadline_ea ?? '')
  const [deadlineEd, setDeadlineEd]             = useState(application?.deadline_ed ?? school.deadline_ed ?? '')
  const [deadlineRd, setDeadlineRd]             = useState(application?.deadline_rd ?? school.deadline_rd ?? '')
  const [notificationDate, setNotificationDate] = useState(application?.notification_date ?? school.notification_date ?? '')
  const [notificationEa, setNotificationEa]     = useState(application?.notification_ea ?? school.notification_ea ?? '')
  const [notificationEd, setNotificationEd]     = useState(application?.notification_ed ?? school.notification_ed ?? '')
  async function toggleEssay(essayId: string) {
    const next = !localProgress[essayId]
    setLocalProgress(p => ({ ...p, [essayId]: next }))
    onEssayToggle(essayId, next)
    await fetch('/api/essay-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_essay_id: essayId, done: next }),
    })
  }

  const availableRounds = getAvailableRounds(school)
  const hasREA = availableRounds.includes('REA'), hasEA = availableRounds.includes('EA')
  const hasED  = availableRounds.includes('ED'),  hasRD = availableRounds.includes('RD')
  const hasRolling = availableRounds.includes('Rolling')
  const deadlineCols = [(hasREA || hasEA), hasED, (hasRD || hasRolling)].filter(Boolean).length
  const gridCls = deadlineCols === 3 ? 'grid-cols-3' : deadlineCols === 2 ? 'grid-cols-2' : 'grid-cols-1'
  const st = statusConfig[status]

  async function save() {
    setSaving(true)
    // Everything saves to the user's OWN application row — including the deadline
    // and notification overrides. The global schools table is never written here.
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: school.id, status,
        application_type: appType || null,
        intended_major: major || null,
        notes: notes || null,
        portal_url: portalUrl || null,
        supplemental_essays_done: essaysDone,
        deadline_ea: deadlineEa, deadline_ed: deadlineEd, deadline_rd: deadlineRd,
        notification_date: notificationDate, notification_ea: notificationEa, notification_ed: notificationEd,
      }),
    })
    setSaving(false)
    toast('Changes saved')
    onUpdate()
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(38,63,73,0.35)' }} onClick={onClose}/>

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col overflow-y-auto"
        style={{ background: C.card, borderLeft: `1px solid ${C.border}`, boxShadow: '-8px 0 32px rgba(38,63,73,0.12)' }}>

        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 17, lineHeight: 1.3 }}>
              {school.name}
            </h2>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: st.bg, color: st.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }}/>
                {st.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="transition-colors mt-1"
            style={{ color: C.inkFaint }}
            onMouseEnter={e => (e.currentTarget.style.color = C.ink)}
            onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)}>
            <X size={20}/>
          </button>
        </div>

        {/* School stats */}
        <div className="p-6" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p style={{ ...labelStyle, marginBottom: 12 }}>School Info</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div style={statCellStyle}>
              <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 4 }}>Acceptance Rate</p>
              <p style={{ color: C.inkStrong, fontWeight: 600, fontSize: 13 }}>
                {school.acceptance_rate ? `${school.acceptance_rate}%` : '—'}
              </p>
            </div>
            <div style={statCellStyle}>
              <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 4 }}>Supplementals</p>
              <p style={{ color: essaysDone === essaysTotal && essaysTotal > 0 ? C.success : C.inkStrong, fontWeight: 600, fontSize: 13 }}>
                {essaysTotal > 0 ? `${essaysDone} / ${essaysTotal}` : '—'}
              </p>
            </div>
            <div style={statCellStyle}>
              <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 4 }}>SAT Median</p>
              <p style={{ color: C.inkStrong, fontWeight: 600, fontSize: 13 }}>
                {school.test_policy === 'blind' ? 'Test Blind'
                  : school.sat_25th && school.sat_75th
                  ? `${Math.round((school.sat_25th + school.sat_75th) / 2)}${school.test_policy === 'optional' ? ' (opt)' : ''}`
                  : '—'}
              </p>
            </div>
            <div style={statCellStyle}>
              <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 4 }}>ACT Median</p>
              <p style={{ color: C.inkStrong, fontWeight: 600, fontSize: 13 }}>
                {school.test_policy === 'blind' ? 'Test Blind'
                  : school.act_25th && school.act_75th
                  ? `${Math.round((school.act_25th + school.act_75th) / 2)}${school.test_policy === 'optional' ? ' (opt)' : ''}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Deadlines */}
          <div className={`grid gap-3 mb-3 ${gridCls}`}>
            {(hasREA || hasEA) && (
              <div style={statCellStyle}>
                <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6 }}>{hasREA ? 'REA' : 'EA'} Deadline</p>
                <input type="date" value={deadlineEa} onChange={e => setDeadlineEa(e.target.value)}
                  style={{ background: 'transparent', color: C.ink, fontSize: 12, fontWeight: 500, outline: 'none', width: '100%' }}/>
              </div>
            )}
            {hasED && (
              <div style={statCellStyle}>
                <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6 }}>ED Deadline</p>
                <input type="date" value={deadlineEd} onChange={e => setDeadlineEd(e.target.value)}
                  style={{ background: 'transparent', color: C.ink, fontSize: 12, fontWeight: 500, outline: 'none', width: '100%' }}/>
              </div>
            )}
            {(hasRD || hasRolling) && (
              <div style={statCellStyle}>
                <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6 }}>{hasRolling && !hasRD ? 'Rolling' : 'RD Deadline'}</p>
                {hasRolling && !hasRD
                  ? <p style={{ color: C.ink, fontSize: 12, fontWeight: 500 }}>Open</p>
                  : <input type="date" value={deadlineRd} onChange={e => setDeadlineRd(e.target.value)}
                      style={{ background: 'transparent', color: C.ink, fontSize: 12, fontWeight: 500, outline: 'none', width: '100%' }}/>
                }
              </div>
            )}
          </div>

          {/* Notification dates */}
          <div className={`grid gap-3 mb-3 ${gridCls}`}>
            {(hasREA || hasEA) && (
              <div style={statCellStyle}>
                <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6 }}>{hasREA ? 'REA' : 'EA'} Decision</p>
                <input type="date" value={notificationEa} onChange={e => setNotificationEa(e.target.value)}
                  style={{ background: 'transparent', color: C.ink, fontSize: 12, fontWeight: 500, outline: 'none', width: '100%' }}/>
              </div>
            )}
            {hasED && (
              <div style={statCellStyle}>
                <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6 }}>ED Decision</p>
                <input type="date" value={notificationEd} onChange={e => setNotificationEd(e.target.value)}
                  style={{ background: 'transparent', color: C.ink, fontSize: 12, fontWeight: 500, outline: 'none', width: '100%' }}/>
              </div>
            )}
            {(hasRD || hasRolling) && (
              <div style={statCellStyle}>
                <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 6 }}>RD Decision</p>
                <input type="date" value={notificationDate} onChange={e => setNotificationDate(e.target.value)}
                  style={{ background: 'transparent', color: C.ink, fontSize: 12, fontWeight: 500, outline: 'none', width: '100%' }}/>
              </div>
            )}
          </div>

          {school.popular_majors.length > 0 && (
            <div style={{ ...statCellStyle }}>
              <p style={{ color: C.inkFaint, fontSize: 11, marginBottom: 8 }}>Popular Majors</p>
              <div className="flex flex-wrap gap-1.5">
                {school.popular_majors.map(m => (
                  <span key={m} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>{m}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* My application */}
        <div className="p-6 space-y-4 flex-1">
          <p style={labelStyle}>My Application</p>

          <div className="space-y-1">
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)}
              style={{ ...inputStyle, color: st.color, background: st.bg, border: `1px solid ${st.color}40` }}>
              {statuses.map(s => <option key={s} value={s}>{statusConfig[s].label}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label style={labelStyle}>Application Round</label>
            <select value={appType} onChange={e => setAppType(e.target.value as ApplicationType | '')}
              style={inputStyle}>
              <option value="">— Select round —</option>
              {getAvailableRounds(school).map(t => <option key={t} value={t}>{ROUND_LABELS[t]}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label style={labelStyle}>Intended Major</label>
            <input type="text" value={major} onChange={e => setMajor(e.target.value)}
              placeholder="e.g. Computer Science"
              style={{ ...inputStyle }}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
          </div>

          {essays.length > 0 && (
            <div className="space-y-2">
              <label style={labelStyle}>Supplemental Essays ({essaysDone}/{essaysTotal})</label>
              <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: C.bgSoft }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: essaysTotal > 0 ? `${(essaysDone / essaysTotal) * 100}%` : '0%', background: essaysDone === essaysTotal ? C.success : C.teal }}/>
              </div>
              <div className="space-y-2">
                {essays.map(e => (
                  <button key={e.id} onClick={() => toggleEssay(e.id)}
                    className="w-full flex items-start gap-3 text-left rounded-xl p-3 transition-colors"
                    style={{ background: localProgress[e.id] ? C.paleTeal : C.bgSoft, border: `1px solid ${localProgress[e.id] ? C.teal + '50' : C.border}` }}>
                    <div className="flex-shrink-0 w-4 h-4 mt-0.5 rounded flex items-center justify-center transition-colors"
                      style={{ background: localProgress[e.id] ? C.teal : 'transparent', border: `1.5px solid ${localProgress[e.id] ? C.teal : C.inkFaint}` }}>
                      {localProgress[e.id] && <Check size={10} color="white" strokeWidth={3}/>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs leading-snug"
                        style={{ color: localProgress[e.id] ? C.inkFaint : C.ink, textDecoration: localProgress[e.id] ? 'line-through' : 'none', opacity: localProgress[e.id] ? 0.7 : 1 }}>
                        {e.essay_prompt}
                      </p>
                      {(e.word_limit || e.essay_group) && (
                        <p className="text-xs mt-1" style={{ color: C.inkFaint }}>
                          {e.essay_group && <span>{e.essay_group}</span>}
                          {e.essay_group && e.word_limit && <span> · </span>}
                          {e.word_limit && <span>{e.word_limit}w</span>}
                          {!e.required && <span style={{ color: C.inkFaint }}> · optional</span>}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label style={labelStyle}>Application Portal URL</label>
            <div className="flex items-center gap-2">
              <input type="url" value={portalUrl} onChange={e => setPortalUrl(e.target.value)}
                placeholder="https://apply.school.edu/..."
                style={{ ...inputStyle }}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
              {portalUrl && (
                <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                  className="p-2 flex-shrink-0 transition-colors"
                  style={{ color: C.teal }}>
                  <ExternalLink size={16}/>
                </a>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label style={labelStyle}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Anything to remember..." rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
              onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={save} disabled={saving || removing}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#267970')}
            onMouseLeave={e => (e.currentTarget.style.background = C.teal)}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          {confirmRemove ? (
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setRemoving(true)
                  await fetch(`/api/applications?school_id=${school.id}`, { method: 'DELETE' })
                  onRemove()
                }}
                disabled={removing}
                className="flex-1 text-sm rounded-xl py-2.5 font-medium transition-colors disabled:opacity-50"
                style={{ background: '#F5DDD9', color: C.danger }}>
                {removing ? 'Removing…' : 'Yes, remove'}
              </button>
              <button onClick={() => setConfirmRemove(false)}
                className="flex-1 text-sm rounded-xl py-2.5 transition-colors"
                style={{ color: C.inkMuted, border: `1px solid ${C.border}` }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmRemove(true)}
              className="w-full text-sm py-1.5 transition-colors"
              style={{ color: C.inkFaint }}
              onMouseEnter={e => (e.currentTarget.style.color = C.danger)}
              onMouseLeave={e => (e.currentTarget.style.color = C.inkFaint)}>
              Remove from list
            </button>
          )}
        </div>
      </div>
    </>
  )
}
