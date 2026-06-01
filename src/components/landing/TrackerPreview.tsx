'use client'
import { useState } from 'react'
import { C } from '@/lib/atlas'

type Status = 'not_started' | 'in_progress' | 'submitted' | 'waitlisted' | 'accepted' | 'rejected'
type ViewMode = 'list' | 'icons'

const STATUS_CYCLE: Status[] = ['not_started', 'in_progress', 'submitted', 'waitlisted', 'accepted', 'rejected']

const STATUS_STYLE: Record<Status, { label: string; bg: string; color: string }> = {
  not_started: { label: 'Not started', bg: 'rgba(38,63,73,0.07)', color: C.inkMuted },
  in_progress:  { label: 'In progress', bg: C.slateLight,          color: C.slate    },
  submitted:    { label: 'Submitted',   bg: C.palePlum,            color: C.plum     },
  waitlisted:   { label: 'Waitlisted',  bg: C.paleGold,            color: '#9A7030'  },
  accepted:     { label: 'Accepted ✓',  bg: '#D1EBE0',             color: C.success  },
  rejected:     { label: 'Rejected',    bg: '#F5DDD9',             color: C.danger   },
}

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  High:   { bg: '#F5DDD9',  color: C.danger  },
  Medium: { bg: C.paleGold, color: '#9A7030' },
  Low:    { bg: C.paleTeal, color: C.teal    },
}

const INIT_SCHOOLS = [
  { name: 'MIT',         round: 'EA', deadline: 'Nov 1',  status: 'in_progress' as Status, essays: 2, risk: 'High'   },
  { name: 'Stanford',    round: 'RD', deadline: 'Jan 2',  status: 'not_started'  as Status, essays: 3, risk: 'Medium' },
  { name: 'UC Berkeley', round: 'UC', deadline: 'Nov 30', status: 'submitted'    as Status, essays: 0, risk: 'Low'    },
]

export default function TrackerPreview() {
  const [schools, setSchools] = useState(INIT_SCHOOLS)
  const [view, setView] = useState<ViewMode>('list')
  const [hint, setHint] = useState(true)

  function cycleStatus(i: number) {
    setHint(false)
    setSchools(prev => prev.map((s, idx) => {
      if (idx !== i) return s
      const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(s.status) + 1) % STATUS_CYCLE.length]
      return { ...s, status: next }
    }))
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 4px 28px rgba(38,63,73,0.09)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 14 }}>My Applications</span>
          {hint && (
            <span className="text-xs px-2 py-0.5 rounded-full animate-pulse"
              style={{ background: C.paleGold, color: '#9A7030', fontSize: 10 }}>
              Click status to change →
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            {(['list', 'icons'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 text-xs font-medium transition-colors duration-150"
                style={{ background: view === v ? C.ink : 'transparent', color: view === v ? C.bgSoft : C.inkFaint }}>
                {v === 'list' ? 'List' : 'Icons'}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#267970')}
            onMouseLeave={e => (e.currentTarget.style.background = C.teal)}>
            + Add school
          </button>
        </div>
      </div>

      {view === 'list' && (
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['School','Round','Deadline','Status','Essays','Risk'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: C.inkFaint, fontSize: 10 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {schools.map((s, i) => {
              const st = STATUS_STYLE[s.status]
              const rk = RISK_STYLE[s.risk]
              return (
                <tr key={i} className="transition-colors duration-150"
                  style={{ borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = C.bgSoft}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-medium" style={{ color: C.inkStrong }}>{s.name}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                      style={{ background: C.bgSoft, color: C.inkMuted }}>{s.round}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: C.inkMuted }}>{s.deadline}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => cycleStatus(i)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer"
                      style={{ background: st.bg, color: st.color }}
                      title="Click to change status">
                      {st.label}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium"
                    style={{ color: s.essays > 0 ? C.ink : C.inkFaint }}>
                    {s.essays > 0 ? `${s.essays} left` : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: rk.bg, color: rk.color }}>{s.risk}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {view === 'icons' && (
        <div className="grid grid-cols-3 gap-4 p-5">
          {schools.map((s, i) => {
            const st = STATUS_STYLE[s.status]
            const rk = RISK_STYLE[s.risk]
            return (
              <div key={i} className="rounded-xl p-4 transition-all duration-200"
                style={{ background: C.bgSoft, border: `1.5px solid ${C.border}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(38,63,73,0.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div className="font-semibold text-sm mb-1" style={{ color: C.inkStrong }}>{s.name}</div>
                <div className="text-xs mb-2" style={{ color: C.inkFaint }}>{s.round} · {s.deadline}</div>
                <button onClick={() => cycleStatus(i)}
                  className="text-xs px-2 py-0.5 rounded-full font-medium w-full text-center transition-all duration-150"
                  style={{ background: st.bg, color: st.color }}>{st.label}</button>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs" style={{ color: s.essays > 0 ? C.ink : C.inkFaint }}>
                    {s.essays > 0 ? `${s.essays} essays` : '✓ done'}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: rk.bg, color: rk.color, fontSize: 9 }}>{s.risk}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
