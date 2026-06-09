'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Check, X, AlertTriangle, FileText, Bell, BadgeCheck, Inbox, Plus, RotateCcw, Trash2, Sparkles, Pencil } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'
import type { PlannerEvent } from '@/lib/reminders'

interface EssayItem {
  id: string; prompt: string; wordLimit: number | null
  required: boolean; group: string | null; sourceYear: string | null; done: boolean
}
interface EssayGroup { schoolId: string; schoolName: string; essays: EssayItem[] }

interface Props {
  events: PlannerEvent[]
  essaysBySchool: EssayGroup[]
  dismissedKeys: string[]
  hasApplications: boolean
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(iso: string): string {
  const d = new Date(iso)
  const hm = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return hm.replace(':00', '')
}
function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
function whenLabel(days: number): string {
  if (days < 0) return 'Past'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days <= 60) return `in ${days} days`
  return `in ${Math.round(days / 30)} months`
}

// Build an ISO timestamp from a local date ('YYYY-MM-DD') + optional time
// ('HH:MM'), constructed in LOCAL time (null time → 23:59) so the day never
// shifts — same convention as the server-side deadline math.
function toLocalIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  let hh = 23, mm = 59
  if (timeStr) {
    const [h, mi] = timeStr.split(':').map(Number)
    if (Number.isFinite(h)) hh = h
    if (Number.isFinite(mi)) mm = mi
  }
  return new Date(y, m - 1, d, hh, mm, 0, 0).toISOString()
}
// ISO → local 'YYYY-MM-DD' / 'HH:MM' for prefilling <input type=date|time>.
function toDateInput(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function toTimeInput(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
// Which per-user override column on the application a school event maps to — the
// same columns the Tracker reads, so an edit here shows up there too.
function overrideField(e: PlannerEvent): string {
  const t = e.round.toUpperCase()
  const ea = t === 'EA' || t === 'REA' || t === 'SCEA'
  const ed = t === 'ED' || t === 'ED1' || t === 'ED2' || t === 'ED0'
  if (e.kind === 'deadline') return ea ? 'deadline_ea' : ed ? 'deadline_ed' : 'deadline_rd'
  return ea ? 'notification_ea' : ed ? 'notification_ed' : 'notification_date'
}
function urgency(days: number): string {
  if (days < 0) return C.inkFaint
  if (days <= 7) return C.danger
  if (days <= 30) return C.gold
  return C.teal
}

const cardStyle: React.CSSProperties = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 16, boxShadow: '0 2px 10px rgba(38,63,73,0.06)',
}

export default function PlannerClient({ events, essaysBySchool, dismissedKeys, hasApplications }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set(dismissedKeys))
  const [showDismissed, setShowDismissed] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('')
  const [saving, setSaving] = useState(false)
  // Inline edit state (one event at a time).
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [progress, setProgress] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    essaysBySchool.forEach(g => g.essays.forEach(e => { m[e.id] = e.done }))
    return m
  })

  // After create/edit we re-pull the server-computed events (canonical state).
  const allEvents = useMemo(
    () => [...events].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    [events],
  )

  const hasVerifyData = allEvents.some(e => e.sourceYear) || essaysBySchool.some(g => g.essays.some(e => e.sourceYear))

  const upcoming = useMemo(
    () => allEvents.filter(e => e.kind === 'deadline' && e.daysUntil >= 0 && e.daysUntil <= 60 && !dismissed.has(e.key)),
    [allEvents, dismissed],
  )
  // Dismissed-but-still-upcoming events (derived or custom), offered for restore.
  const dismissedUpcoming = useMemo(
    () => allEvents.filter(e => e.kind === 'deadline' && e.daysUntil >= 0 && e.daysUntil <= 60 && dismissed.has(e.key)),
    [allEvents, dismissed],
  )

  const timelineByMonth = useMemo(() => {
    const groups: { month: string; items: PlannerEvent[] }[] = []
    for (const e of allEvents) {
      const mk = monthKey(e.dueAt)
      let g = groups.find(x => x.month === mk)
      if (!g) { g = { month: mk, items: [] }; groups.push(g) }
      g.items.push(e)
    }
    return groups
  }, [allEvents])

  // Dismiss is soft + restorable for BOTH derived and custom events.
  async function dismissEvent(e: PlannerEvent) {
    setDismissed(prev => new Set(prev).add(e.key))
    try {
      const body = e.custom
        ? { action: 'set_custom_status', id: e.id, status: 'dismissed' }
        : {
            school_id: e.schoolId, round: e.round, kind: e.kind,
            title: `${e.schoolName} — ${e.round} ${e.kind}`, due_at: e.dueAt, status: 'dismissed',
          }
      const res = await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('save failed')
      toast(e.custom ? `Removed ${e.schoolName}` : `Dismissed ${e.schoolName} · ${e.round}`, 'success')
    } catch {
      // Roll back the optimistic removal so the UI matches what's persisted.
      setDismissed(prev => { const n = new Set(prev); n.delete(e.key); return n })
      toast('Could not remove', 'error')
    }
  }

  async function restoreEvent(e: PlannerEvent) {
    setDismissed(prev => { const n = new Set(prev); n.delete(e.key); return n })
    try {
      const body = e.custom
        ? { action: 'set_custom_status', id: e.id, status: 'active' }
        : { action: 'restore', school_id: e.schoolId, round: e.round, kind: e.kind }
      const res = await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('restore failed')
      toast(e.custom ? `Restored ${e.schoolName}` : `Restored ${e.schoolName} · ${e.round}`, 'success')
    } catch {
      setDismissed(prev => new Set(prev).add(e.key))
      toast('Could not restore', 'error')
    }
  }

  async function addCustom() {
    const name = formName.trim()
    if (!name || !formDate) { toast('Add a name and a date', 'error'); return }
    setSaving(true)
    const dueAt = toLocalIso(formDate, formTime)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_custom', title: name, due_at: dueAt }),
      })
      if (!res.ok) throw new Error('create failed')
      setFormName(''); setFormDate(''); setFormTime(''); setAdding(false)
      toast('Event added', 'success')
      router.refresh()
    } catch {
      toast('Could not add event', 'error')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(e: PlannerEvent) {
    setAdding(false)
    setEditingKey(e.key)
    setEditName(e.custom ? e.schoolName : '')
    setEditDate(toDateInput(e.dueAt))
    setEditTime(e.custom ? toTimeInput(e.dueAt) : '')
  }

  async function saveEdit(e: PlannerEvent) {
    if (!editDate) { toast('Pick a date', 'error'); return }
    if (e.custom && !editName.trim()) { toast('Add a name', 'error'); return }
    setSavingEdit(true)
    try {
      let res: Response
      if (e.custom) {
        res = await fetch('/api/reminders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_custom', id: e.id, title: editName.trim(), due_at: toLocalIso(editDate, editTime) }),
        })
      } else {
        // School event → write the per-user override the Tracker also reads.
        res = await fetch('/api/applications', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school_id: e.schoolId, [overrideField(e)]: editDate }),
        })
      }
      if (!res.ok) throw new Error('save failed')
      setEditingKey(null)
      toast(e.custom ? 'Event updated' : 'Saved — also updated in Tracker', 'success')
      router.refresh()
    } catch {
      toast('Could not save', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  async function toggleEssay(id: string) {
    const next = !progress[id]
    setProgress(p => ({ ...p, [id]: next }))
    const res = await fetch('/api/essay-progress', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_essay_id: id, done: next }),
    })
    if (!res.ok) { setProgress(p => ({ ...p, [id]: !next })); toast('Could not save', 'error') }
  }

  // Inline edit form for one event. A plain function (not a component) so the
  // inputs keep focus across keystrokes.
  const editInputStyle: React.CSSProperties = {
    background: C.card, border: `1px solid ${C.border}`, color: C.inkStrong,
  }
  function renderEditor(e: PlannerEvent) {
    const canSave = !!editDate && (!e.custom || !!editName.trim()) && !savingEdit
    return (
      <div key={e.key} className="rounded-xl p-3.5 space-y-2.5" style={{ background: C.bgSoft, border: `1px solid ${C.teal}66` }}>
        {e.custom && (
          <input
            type="text" value={editName} maxLength={120} autoFocus
            onChange={ev => setEditName(ev.target.value)}
            placeholder="Event name"
            className="w-full text-sm rounded-lg px-3 py-2 outline-none" style={editInputStyle}
          />
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <input type="date" value={editDate} onChange={ev => setEditDate(ev.target.value)}
            className="text-sm rounded-lg px-3 py-2 outline-none" style={editInputStyle}/>
          {e.custom && (
            <input type="time" value={editTime} onChange={ev => setEditTime(ev.target.value)}
              title="Optional — defaults to 11:59 PM"
              className="text-sm rounded-lg px-3 py-2 outline-none" style={editInputStyle}/>
          )}
          <div className="ml-auto flex gap-2">
            <button onClick={() => setEditingKey(null)}
              className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: C.inkMuted, background: C.card, border: `1px solid ${C.border}` }}>
              Cancel
            </button>
            <button onClick={() => saveEdit(e)} disabled={!canSave}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg transition-opacity"
              style={{ background: C.teal, color: 'white', opacity: canSave ? 1 : 0.5 }}>
              <Check size={14}/> {savingEdit ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        {!e.custom && (
          <p className="text-xs" style={{ color: C.inkFaint }}>
            {e.schoolName} · {e.round} {e.kind === 'decision' ? 'decision' : 'deadline'} — this date also updates in your Tracker.
          </p>
        )}
      </div>
    )
  }

  return (
    <div style={{ color: C.ink }}>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
          Planner
        </h1>
        <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
          Every deadline, decision date, and essay across your schools — on one timeline.
        </p>
      </div>

      {hasVerifyData && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm flex items-start gap-2"
          style={{ background: C.paleGold, border: `1px solid ${C.gold}40`, color: C.inkStrong }}>
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" style={{ color: C.gold }}/>
          <span>Dates and prompts are pulled from official sources but may be from a prior cycle.
          Always <strong>verify on the school&rsquo;s admissions page</strong> before relying on them.</span>
        </div>
      )}

      {!hasApplications && allEvents.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ ...cardStyle, borderStyle: 'dashed' }}>
          <Inbox size={26} style={{ color: C.inkFaint, margin: '0 auto 10px' }}/>
          <p style={{ color: C.inkMuted }}>Add schools to your <a href="/tracker" className="underline" style={{ color: C.teal }}>Tracker</a> and your planner builds itself here.</p>
          <button onClick={() => setAdding(true)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg"
            style={{ background: C.paleTeal, color: C.teal }}>
            <Plus size={14}/> Add a custom event
          </button>
        </div>
      )}

      {(hasApplications || allEvents.length > 0) && (
        <div className="space-y-6">
          {/* Upcoming deadlines */}
          <section style={{ ...cardStyle, padding: 20 }}>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: C.teal }}/>
                <h2 style={{ fontWeight: 600, color: C.inkStrong, fontSize: 15 }}>Upcoming deadlines</h2>
              </div>
              <button onClick={() => setAdding(a => !a)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ background: adding ? C.bgSoft : C.paleTeal, color: adding ? C.inkMuted : C.teal }}>
                {adding ? <X size={13}/> : <Plus size={13}/>}{adding ? 'Cancel' : 'Add event'}
              </button>
            </div>

            {adding && (
              <div className="rounded-xl p-3.5 mb-4 space-y-2.5" style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
                <input
                  type="text" value={formName} maxLength={120} autoFocus
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Event name (e.g. CSS Profile due, FAFSA, interview)"
                  className="w-full text-sm rounded-lg px-3 py-2 outline-none"
                  style={{ background: C.card, border: `1px solid ${C.border}`, color: C.inkStrong }}
                />
                <div className="flex flex-wrap gap-2">
                  <input
                    type="date" value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="text-sm rounded-lg px-3 py-2 outline-none"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.inkStrong }}
                  />
                  <input
                    type="time" value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    title="Optional — defaults to 11:59 PM"
                    className="text-sm rounded-lg px-3 py-2 outline-none"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.inkStrong }}
                  />
                  <button onClick={addCustom} disabled={saving || !formName.trim() || !formDate}
                    className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg transition-opacity"
                    style={{ background: C.teal, color: 'white', opacity: saving || !formName.trim() || !formDate ? 0.5 : 1 }}>
                    <Check size={14}/> {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="text-xs" style={{ color: C.inkFaint }}>Time is optional — defaults to 11:59 PM. Custom events live only on your planner.</p>
              </div>
            )}

            {upcoming.length === 0 ? (
              <p className="text-sm" style={{ color: C.inkFaint }}>Nothing due in the next 60 days. 🎉</p>
            ) : (
              <div className="space-y-2.5">
                {upcoming.map(e => editingKey === e.key ? renderEditor(e) : (
                  <div key={e.key} className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                    style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
                    <div className="w-1.5 h-9 rounded-full flex-shrink-0" style={{ background: urgency(e.daysUntil) }}/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5" style={{ color: C.inkStrong }}>
                        {e.custom && <Sparkles size={12} style={{ color: C.teal, flexShrink: 0 }}/>}
                        {e.schoolName}
                        {!e.custom && <span style={{ color: C.inkFaint, fontWeight: 400 }}>· {e.round}</span>}
                      </p>
                      <p className="text-xs" style={{ color: C.inkMuted }}>
                        {fmtDate(e.dueAt)}, {fmtTime(e.dueAt)} {e.custom ? '· custom' : e.sourceYear ? `· ${e.sourceYear}` : '· your entry'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold flex-shrink-0" style={{ color: urgency(e.daysUntil) }}>
                      {whenLabel(e.daysUntil)}
                    </span>
                    <button onClick={() => startEdit(e)} title="Edit"
                      className="flex-shrink-0 p-1 rounded-md transition-colors" style={{ color: C.inkFaint }}>
                      <Pencil size={13}/>
                    </button>
                    {e.custom ? (
                      <button onClick={() => dismissEvent(e)} title="Remove event"
                        className="flex-shrink-0 p-1 rounded-md transition-colors" style={{ color: C.inkFaint }}>
                        <Trash2 size={14}/>
                      </button>
                    ) : (
                      <button onClick={() => dismissEvent(e)} title="Dismiss"
                        className="flex-shrink-0 p-1 rounded-md transition-colors" style={{ color: C.inkFaint }}>
                        <X size={14}/>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Restore dismissed events */}
            {dismissedUpcoming.length > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: `1px dashed ${C.border}` }}>
                <button onClick={() => setShowDismissed(s => !s)}
                  className="text-xs font-medium flex items-center gap-1.5" style={{ color: C.inkMuted }}>
                  <RotateCcw size={12}/> {showDismissed ? 'Hide' : 'Show'} {dismissedUpcoming.length} dismissed
                </button>
                {showDismissed && (
                  <div className="space-y-1.5 mt-2.5">
                    {dismissedUpcoming.map(e => (
                      <div key={e.key} className="flex items-center gap-3 rounded-lg px-3 py-2"
                        style={{ background: C.bgSoft, border: `1px dashed ${C.border}` }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate flex items-center gap-1.5" style={{ color: C.inkMuted, textDecoration: 'line-through' }}>
                            {e.custom && <Sparkles size={11} style={{ color: C.teal, flexShrink: 0 }}/>}
                            {e.schoolName}
                            {!e.custom && <span style={{ color: C.inkFaint }}>· {e.round}</span>}
                          </p>
                          <p className="text-xs" style={{ color: C.inkFaint }}>{fmtDate(e.dueAt)}, {fmtTime(e.dueAt)}</p>
                        </div>
                        <button onClick={() => restoreEvent(e)}
                          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                          style={{ background: C.paleTeal, color: C.teal }}>
                          <RotateCcw size={12}/> Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Timeline */}
          <section style={{ ...cardStyle, padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <CalendarClock size={15} style={{ color: C.teal }}/>
              <h2 style={{ fontWeight: 600, color: C.inkStrong, fontSize: 15 }}>Full timeline</h2>
            </div>
            {allEvents.length === 0 ? (
              <p className="text-sm" style={{ color: C.inkFaint }}>
                No dated rounds yet. Set deadlines in the Tracker, or they&rsquo;ll appear once official data is imported.
              </p>
            ) : (
              <div className="space-y-5">
                {timelineByMonth.map(group => (
                  <div key={group.month}>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.inkFaint }}>{group.month}</p>
                    <div className="space-y-1.5">
                      {group.items.map(e => editingKey === e.key ? renderEditor(e) : (
                        <div key={e.key} className="group flex items-center gap-3 text-sm">
                          <span className="w-14 flex-shrink-0 text-xs" style={{ color: C.inkMuted }}>{fmtDate(e.dueAt).replace(/, \d{4}$/, '')}</span>
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: e.custom ? C.teal : e.kind === 'deadline' ? C.gold : C.plum }}/>
                          <span className="flex-1 min-w-0 truncate flex items-center gap-1.5" style={{ color: C.inkStrong }}>
                            {e.custom && <Sparkles size={11} style={{ color: C.teal, flexShrink: 0 }}/>}
                            {e.schoolName}
                            {!e.custom && <span style={{ color: C.inkFaint }}>· {e.round} {e.kind === 'decision' ? 'decision' : 'deadline'}</span>}
                          </span>
                          {e.custom
                            ? <span className="text-xs flex-shrink-0" style={{ color: C.inkFaint }}>custom</span>
                            : e.sourceYear
                            ? <span className="text-xs flex items-center gap-1 flex-shrink-0" style={{ color: C.teal }}><BadgeCheck size={11}/>{e.sourceYear}</span>
                            : <span className="text-xs flex-shrink-0" style={{ color: C.inkFaint }}>your entry</span>}
                          <button onClick={() => startEdit(e)} title="Edit"
                            className="flex-shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: C.inkFaint }}>
                            <Pencil size={12}/>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Essay checklist */}
          <section style={{ ...cardStyle, padding: 20 }}>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={15} style={{ color: C.teal }}/>
              <h2 style={{ fontWeight: 600, color: C.inkStrong, fontSize: 15 }}>Essay checklist</h2>
            </div>
            {essaysBySchool.length === 0 ? (
              <p className="text-sm" style={{ color: C.inkFaint }}>
                No essay prompts yet — they&rsquo;ll show here once official supplement data is imported.
              </p>
            ) : (
              <div className="space-y-5">
                {essaysBySchool.map(g => {
                  const done = g.essays.filter(e => progress[e.id]).length
                  return (
                    <div key={g.schoolId}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium" style={{ color: C.inkStrong }}>{g.schoolName}</p>
                        <span className="text-xs" style={{ color: C.inkFaint }}>{done}/{g.essays.length} done</span>
                      </div>
                      <div className="space-y-1.5">
                        {g.essays.map(e => (
                          <button key={e.id} onClick={() => toggleEssay(e.id)}
                            className="w-full flex items-start gap-2.5 text-left rounded-lg px-3 py-2 transition-colors"
                            style={{ background: progress[e.id] ? C.paleTeal : C.bgSoft, border: `1px solid ${C.border}` }}>
                            <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center"
                              style={{ background: progress[e.id] ? C.teal : 'transparent', border: `1.5px solid ${progress[e.id] ? C.teal : C.inkFaint}` }}>
                              {progress[e.id] && <Check size={11} color="white" strokeWidth={3}/>}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="text-sm block" style={{ color: C.ink, textDecoration: progress[e.id] ? 'line-through' : 'none', opacity: progress[e.id] ? 0.6 : 1 }}>
                                {e.prompt}
                              </span>
                              <span className="text-xs" style={{ color: C.inkFaint }}>
                                {e.required ? 'Required' : 'Optional'}
                                {e.wordLimit ? ` · ${e.wordLimit} words` : ''}
                                {e.group ? ` · ${e.group}` : ''}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
