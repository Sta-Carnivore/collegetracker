'use client'

import { useState } from 'react'
import { Application, School, ApplicationStatus } from '@/types/database'
import StatusBadge from './StatusBadge'

interface SchoolCardProps {
  school: School
  application: Application | null
  onUpdate: () => void
}

const statusOrder: ApplicationStatus[] = [
  'not_started', 'in_progress', 'submitted', 'waiting',
  'deferred', 'accepted', 'rejected', 'waitlisted',
]

export default function SchoolCard({ school, application, onUpdate }: SchoolCardProps) {
  const [loading, setLoading] = useState(false)

  const status = application?.status ?? 'not_started'
  const essaysDone = application?.supplemental_essays_done ?? 0
  const essaysTotal = school.supplemental_essay_count
  const essayPct = essaysTotal > 0 ? Math.round((essaysDone / essaysTotal) * 100) : 0

  const deadline = school.deadline_rd
    ? new Date(school.deadline_rd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : school.deadline_rolling ? 'Rolling' : '—'

  async function updateStatus(newStatus: ApplicationStatus) {
    setLoading(true)
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: school.id, status: newStatus }),
    })
    setLoading(false)
    onUpdate()
  }

  async function updateEssaysDone(delta: number) {
    const next = Math.max(0, Math.min(essaysTotal, essaysDone + delta))
    await fetch('/api/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_id: school.id, supplemental_essays_done: next }),
    })
    onUpdate()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-base leading-tight">{school.name}</h3>
          <p className="text-gray-500 text-xs mt-1">
            Acceptance: {school.acceptance_rate ? `${school.acceptance_rate}%` : '—'}
            {' · '}
            RD Deadline: {deadline}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-xs text-gray-400">
        {school.sat_25th && school.sat_75th && (
          <span>SAT {school.sat_25th}–{school.sat_75th}</span>
        )}
        {school.act_25th && school.act_75th && (
          <span>ACT {school.act_25th}–{school.act_75th}</span>
        )}
        {school.popular_majors.length > 0 && (
          <span className="truncate">{school.popular_majors.slice(0, 2).join(', ')}</span>
        )}
      </div>

      {/* Supplemental progress */}
      {essaysTotal > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Supplementals</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateEssaysDone(-1)}
                disabled={essaysDone === 0}
                className="w-5 h-5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 flex items-center justify-center"
              >−</button>
              <span>{essaysDone}/{essaysTotal}</span>
              <button
                onClick={() => updateEssaysDone(1)}
                disabled={essaysDone === essaysTotal}
                className="w-5 h-5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 flex items-center justify-center"
              >+</button>
            </div>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${essayPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Status selector */}
      <select
        value={status}
        onChange={(e) => updateStatus(e.target.value as ApplicationStatus)}
        disabled={loading}
        className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
      >
        {statusOrder.map((s) => (
          <option key={s} value={s}>{s.replace('_', ' ')}</option>
        ))}
      </select>
    </div>
  )
}
