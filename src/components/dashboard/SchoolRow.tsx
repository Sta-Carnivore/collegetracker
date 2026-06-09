'use client'

import { useState } from 'react'
import { ExternalLink, GripVertical } from 'lucide-react'
import { School, Application, ApplicationStatus } from '@/types/database'
import { statusConfig } from './StatusBadge'
import { getEffectiveDeadline, getEffectiveNotification } from '@/lib/rounds'
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
  onUpdate: (fields: Partial<{ status: ApplicationStatus }>) => void
  dragProps?: DragProps
}

const allStatuses = Object.keys(statusConfig) as ApplicationStatus[]

function fmt(date: string | null) {
  if (!date) return '—'
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SchoolRow({ school, application, onOpen, onUpdate, dragProps }: Props) {
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? 'not_started')

  const appType = application?.application_type ?? null
  const essaysDone = application?.supplemental_essays_done ?? 0
  const essaysTotal = application?.supplemental_essays_total ?? school.supplemental_essay_count
  const rawDeadline = school.deadline_rolling ? null : getEffectiveDeadline(school, application, appType)
  const dlStr = school.deadline_rolling ? 'Rolling' : fmt(rawDeadline)
  const days = daysUntil(rawDeadline)
  const st = statusConfig[status]

  function handleStatusChange(newStatus: ApplicationStatus) {
    setStatus(newStatus)
    onUpdate({ status: newStatus })
  }

  return (
    <tr
      className="group transition-colors"
      draggable={dragProps?.draggable ?? false}
      onDragStart={dragProps?.onDragStart}
      onDragEnd={dragProps?.onDragEnd}
      style={{
        borderBottom: `1px solid ${C.border}`,
        opacity: dragProps?.isDragging ? 0.35 : 1,
        cursor: dragProps?.draggable ? 'grab' : 'default',
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={e => { if (!dragProps?.isDragging) (e.currentTarget as HTMLElement).style.background = C.bgSoft }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <td className="py-3 pl-3 pr-1 w-4">
        {dragProps?.draggable && (
          <GripVertical size={13} style={{ color: C.inkFaint, cursor: 'grab' }}/>
        )}
      </td>
      <td className="py-3 pl-1 pr-2">
        <button
          onClick={onOpen}
          className="text-sm font-medium text-left transition-colors"
          style={{ color: C.inkStrong, fontFamily: 'var(--font-serif)' }}
          onMouseEnter={e => (e.currentTarget.style.color = C.teal)}
          onMouseLeave={e => (e.currentTarget.style.color = C.inkStrong)}
        >
          {school.name}
        </button>
      </td>
      <td className="py-3 px-2 text-sm whitespace-nowrap">
        <span style={{ color: C.inkMuted }}>{dlStr}</span>
        {formatDays(days) && (
          <span className="ml-2 text-xs font-medium" style={{ color: deadlineUrgency(days) }}>
            {formatDays(days)}
          </span>
        )}
      </td>
      <td className="py-3 px-2 text-sm whitespace-nowrap" style={{ color: C.inkFaint }}>
        {fmt(getEffectiveNotification(school, application, appType))}
      </td>
      <td className="py-3 px-2">
        <select
          value={status}
          onChange={e => handleStatusChange(e.target.value as ApplicationStatus)}
          className="text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer focus:outline-none"
          style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40` }}
        >
          {allStatuses.map(s => (
            <option key={s} value={s}>{statusConfig[s].label}</option>
          ))}
        </select>
      </td>
      <td className="py-3 px-2">
        <button onClick={onOpen} className="text-left">
          {essaysTotal > 0 ? (
            <span className="text-sm tabular-nums" style={{ color: essaysDone === essaysTotal ? C.success : C.inkMuted }}>
              {essaysDone}/{essaysTotal}
            </span>
          ) : (
            <span className="text-sm" style={{ color: C.inkFaint }}>—</span>
          )}
        </button>
      </td>
      <td className="py-3 px-2">
        {application?.portal_url ? (
          <a
            href={application.portal_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap"
            style={{ color: C.teal, background: C.paleTeal + '66', border: `1px solid ${C.teal}33` }}
          >
            <ExternalLink size={11}/> Portal
          </a>
        ) : (
          <button
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
            style={{ color: C.inkFaint, border: `1px solid ${C.border}` }}
          >
            <ExternalLink size={11}/> Add Portal
          </button>
        )}
      </td>
      <td className="py-3 pl-2 pr-4">
        <button
          onClick={onOpen}
          className="text-xs opacity-0 group-hover:opacity-100 transition-all"
          style={{ color: C.teal }}
        >
          Edit →
        </button>
      </td>
    </tr>
  )
}
