'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { School, Application, ApplicationStatus } from '@/types/database'
import { statusConfig } from './StatusBadge'
import { getNotificationDate } from '@/lib/rounds'
import { daysUntil, deadlineUrgency, formatDays } from '@/lib/deadline'
import { C } from '@/lib/atlas'

interface Props {
  school: School
  application: Application | null
  onOpen: () => void
  onUpdate: (fields: Partial<{ status: ApplicationStatus; supplemental_essays_done: number }>) => void
}

const allStatuses = Object.keys(statusConfig) as ApplicationStatus[]

function fmtDate(date: string | null) {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDeadline(school: School, appType: string | null | undefined): string {
  if (school.deadline_rolling) return 'Rolling'
  if (appType === 'EA' || appType === 'REA') return fmtDate(school.deadline_ea) ?? '—'
  if (appType === 'ED') return fmtDate(school.deadline_ed) ?? '—'
  if (appType === 'RD') return fmtDate(school.deadline_rd) ?? '—'
  return fmtDate(school.deadline_ea ?? school.deadline_ed ?? school.deadline_rd) ?? '—'
}

export default function SchoolCard({ school, application, onOpen, onUpdate }: Props) {
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? 'not_started')
  const [essaysDone, setEssaysDone] = useState(application?.supplemental_essays_done ?? 0)

  const essaysTotal = school.supplemental_essay_count
  const essayPct = essaysTotal > 0 ? Math.round((essaysDone / essaysTotal) * 100) : 0
  const deadline = getDeadline(school, application?.application_type)
  const rawDeadline = (() => {
    const t = application?.application_type
    if (school.deadline_rolling) return null
    if (t === 'EA' || t === 'REA') return school.deadline_ea
    if (t === 'ED') return school.deadline_ed
    if (t === 'RD') return school.deadline_rd
    return school.deadline_ea ?? school.deadline_ed ?? school.deadline_rd
  })()
  const days = daysUntil(rawDeadline)
  const st = statusConfig[status]

  function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus)
    onUpdate({ status: newStatus })
  }

  function handleEssayDelta(delta: number) {
    const next = Math.min(essaysTotal, Math.max(0, essaysDone + delta))
    if (next === essaysDone) return
    setEssaysDone(next)
    onUpdate({ supplemental_essays_done: next })
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200 cursor-default"
      style={{ background: C.card, border: `1px solid rgba(38,63,73,0.18)`, boxShadow: '0 2px 12px rgba(38,63,73,0.10)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(38,63,73,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = `rgba(38,63,73,0.28)` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(38,63,73,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(38,63,73,0.18)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="flex items-center gap-2 min-w-0 text-left group">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: st.color }}/>
          <h3 className="text-sm font-semibold leading-tight truncate transition-colors"
            style={{ color: C.inkStrong, fontFamily: 'var(--font-serif)' }}
            onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
            onMouseLeave={e => (e.currentTarget.style.color = C.inkStrong)}>
            {school.name}
          </h3>
        </button>
        <select
          value={status}
          onChange={e => handleStatusChange(e.target.value as ApplicationStatus)}
          className="text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer focus:outline-none flex-shrink-0"
          style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}
        >
          {allStatuses.map(s => (
            <option key={s} value={s}>{statusConfig[s].label}</option>
          ))}
        </select>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: C.inkFaint }}>
        {school.acceptance_rate != null && <span>{school.acceptance_rate}% admit</span>}
        <span style={{ color: deadlineUrgency(days) }}>
          Due: {deadline}
          {formatDays(days) && <span className="ml-1 font-medium">· {formatDays(days)}</span>}
        </span>
      </div>

      {/* SAT/ACT */}
      {school.test_policy === 'blind' ? (
        <div className="text-xs" style={{ color: C.inkFaint }}>Test Blind</div>
      ) : (school.sat_25th || school.act_25th) ? (
        <div className="flex gap-3 text-xs" style={{ color: C.inkFaint }}>
          {school.sat_25th && school.sat_75th && (
            <span>SAT {Math.round((school.sat_25th + school.sat_75th) / 2)}{school.test_policy === 'optional' ? ' (opt)' : ''}</span>
          )}
          {school.act_25th && school.act_75th && (
            <span>ACT {Math.round((school.act_25th + school.act_75th) / 2)}{school.test_policy === 'optional' ? ' (opt)' : ''}</span>
          )}
        </div>
      ) : null}

      {/* Essay progress */}
      {essaysTotal > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs" style={{ color: C.inkFaint }}>
            <span>Supplementals</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleEssayDelta(-1)}
                disabled={essaysDone === 0}
                className="w-4 h-4 rounded flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: C.bgSoft, color: C.inkMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = C.border)}
                onMouseLeave={e => (e.currentTarget.style.background = C.bgSoft)}
              >−</button>
              <span style={{ color: essaysDone === essaysTotal ? C.success : C.inkMuted }}>
                {essaysDone}/{essaysTotal}
              </span>
              <button
                onClick={() => handleEssayDelta(1)}
                disabled={essaysDone === essaysTotal}
                className="w-4 h-4 rounded flex items-center justify-center transition-colors disabled:opacity-30"
                style={{ background: C.bgSoft, color: C.inkMuted }}
                onMouseEnter={e => (e.currentTarget.style.background = C.border)}
                onMouseLeave={e => (e.currentTarget.style.background = C.bgSoft)}
              >+</button>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bgSoft }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${essayPct}%`, background: essayPct === 100 ? C.success : C.teal }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {application?.notes && (
        <p className="text-xs truncate" style={{ color: C.inkFaint }}>{application.notes}</p>
      )}

      {/* Portal */}
      {application?.portal_url ? (
        <a
          href={application.portal_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs rounded-xl py-2 transition-all mt-auto"
          style={{ color: C.teal, border: `1px solid ${C.teal}33`, background: C.paleTeal + '55' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.paleTeal; (e.currentTarget as HTMLElement).style.borderColor = C.teal + '66' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.paleTeal + '55'; (e.currentTarget as HTMLElement).style.borderColor = C.teal + '33' }}
        >
          <ExternalLink size={12}/> Open Portal
        </a>
      ) : (
        <button
          onClick={onOpen}
          className="flex items-center justify-center gap-1.5 text-xs rounded-xl py-2 transition-all mt-auto"
          style={{ color: C.inkFaint, border: `1px solid ${C.border}` }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = C.inkMuted; (e.currentTarget as HTMLElement).style.borderColor = `rgba(38,63,73,0.2)` }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.inkFaint; (e.currentTarget as HTMLElement).style.borderColor = C.border }}
        >
          <ExternalLink size={12}/> Add Portal
        </button>
      )}
    </div>
  )
}
