'use client'

import { useState } from 'react'
import { ExternalLink, GripVertical } from 'lucide-react'
import { School, Application, ApplicationStatus, ApplicationType } from '@/types/database'
import { statusConfig } from './StatusBadge'
import { getEffectiveDeadline } from '@/lib/rounds'
import { daysUntil, deadlineUrgency, formatDays } from '@/lib/deadline'
import { C } from '@/lib/atlas'

interface DragProps {
  draggable: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}

interface Props {
  school: School
  application: Application | null
  onOpen: () => void
  onUpdate: (fields: Partial<{ status: ApplicationStatus; application_type: ApplicationType | null }>) => void
  dragProps?: DragProps
}

const allStatuses = Object.keys(statusConfig) as ApplicationStatus[]

function fmtDate(date: string | null) {
  if (!date) return null
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const ROUND_OPTS = ['EA', 'REA', 'ED', 'RD', 'Rolling'] as const

export default function SchoolCard({ school, application, onOpen, onUpdate, dragProps }: Props) {
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? 'not_started')
  const [appType, setAppType] = useState<ApplicationType | null>(application?.application_type ?? null)

  const essaysDone = application?.supplemental_essays_done ?? 0
  const essaysTotal = application?.supplemental_essays_total ?? school.supplemental_essay_count
  const essayPct = essaysTotal > 0 ? Math.round((essaysDone / essaysTotal) * 100) : 0
  const rawDeadline = school.deadline_rolling ? null : getEffectiveDeadline(school, application, appType)
  const deadline = school.deadline_rolling ? 'Rolling' : (fmtDate(rawDeadline) ?? '—')
  const days = daysUntil(rawDeadline)
  const st = statusConfig[status]

  function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus)
    onUpdate({ status: newStatus })
  }

  function handleRoundChange(val: string) {
    const newType = val === '' ? null : val as ApplicationType
    setAppType(newType)
    onUpdate({ application_type: newType })
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200"
      draggable={dragProps?.draggable ?? false}
      onDragStart={dragProps?.onDragStart}
      onDragEnd={dragProps?.onDragEnd}
      style={{
        background: C.card,
        border: `1px solid rgba(38,63,73,0.18)`,
        boxShadow: '0 2px 12px rgba(38,63,73,0.10)',
        opacity: dragProps?.isDragging ? 0.35 : 1,
        cursor: dragProps?.draggable ? 'grab' : 'default',
        transition: 'opacity 0.15s, box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { if (!dragProps?.isDragging) { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(38,63,73,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = `rgba(38,63,73,0.28)` } }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(38,63,73,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(38,63,73,0.18)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        {dragProps?.draggable && (
          <GripVertical size={14} className="flex-shrink-0 mt-0.5 -ml-1"
            style={{ color: C.inkFaint, cursor: 'grab' }}/>
        )}
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

      {/* Round selector — pill buttons so drag still works */}
      {!school.name.startsWith('University of California-') && (
        <div className="flex gap-1 flex-wrap">
          {ROUND_OPTS.map(r => (
            <button
              key={r}
              onClick={e => { e.stopPropagation(); handleRoundChange(appType === r ? '' : r) }}
              className="text-xs px-2 py-0.5 rounded-full transition-all"
              style={appType === r
                ? { background: C.teal, color: 'white', border: `1px solid ${C.teal}` }
                : { background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}
            >
              {r}
            </button>
          ))}
        </div>
      )}

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

      {/* Essay progress — read-only; edit via drawer */}
      {essaysTotal > 0 && (
        <button onClick={onOpen} className="w-full space-y-1.5 text-left">
          <div className="flex justify-between items-center text-xs" style={{ color: C.inkFaint }}>
            <span>Supplementals</span>
            <span style={{ color: essaysDone === essaysTotal ? C.success : C.inkMuted }}>
              {essaysDone}/{essaysTotal}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.bgSoft }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${essayPct}%`, background: essayPct === 100 ? C.success : C.teal }}
            />
          </div>
        </button>
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
