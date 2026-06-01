import { C } from '@/lib/atlas'

export function PanelTracker() {
  const rows = [
    { name: 'MIT',      round: 'EA', date: 'Nov 1', st: 'In progress', stBg: C.slateLight,          stC: C.slate,   essays: '2 left' },
    { name: 'Stanford', round: 'RD', date: 'Jan 2', st: 'Not started', stBg: 'rgba(38,63,73,0.07)', stC: C.inkMuted, essays: '3 left' },
    { name: 'Yale',     round: 'ED', date: 'Nov 1', st: 'Submitted',   stBg: C.palePlum,            stC: C.plum,    essays: '—' },
  ]
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 12 }}>My Applications</span>
        <span className="px-2 py-0.5 rounded-md font-semibold" style={{ background: C.teal, color: 'white', fontSize: 10 }}>+ Add</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
          <span className="flex-1 font-medium truncate" style={{ color: C.inkStrong, fontSize: 11 }}>{r.name}</span>
          <span className="px-1.5 py-0.5 rounded" style={{ background: C.bgSoft, color: C.inkMuted, fontSize: 9 }}>{r.round}</span>
          <span style={{ color: C.inkFaint, fontSize: 9, minWidth: 34 }}>{r.date}</span>
          <span className="px-2 py-0.5 rounded-full" style={{ background: r.stBg, color: r.stC, fontSize: 9, whiteSpace: 'nowrap' }}>{r.st}</span>
          <span style={{ color: r.essays === '—' ? C.inkFaint : C.ink, fontSize: 9, minWidth: 28, textAlign: 'right' }}>{r.essays}</span>
        </div>
      ))}
    </div>
  )
}

export function PanelResume() {
  const sections = [
    { label: 'Education',  value: 'High School · GPA 3.9 · SAT 1540',                    icon: '🎓' },
    { label: 'Activities', value: 'Science Olympiad Captain · Robotics Club · Math Team',  icon: '⚡' },
    { label: 'Awards',     value: 'USAMO Qualifier · National Merit Finalist',             icon: '🏆' },
    { label: 'Projects',   value: 'ML model for protein folding research',                 icon: '💻' },
    { label: 'Themes',     value: 'STEM leadership · independent research',                icon: '✦' },
  ]
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}`, background: `${C.paleTeal}55` }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.teal }}/>
        <span style={{ color: C.teal, fontWeight: 600, fontSize: 10, fontFamily: 'var(--font-serif)' }}>Parsed Profile</span>
      </div>
      {sections.map((s, i) => (
        <div key={i} className="flex items-start gap-2 px-3 py-1.5" style={{ borderBottom: i < 4 ? `1px solid ${C.border}40` : 'none' }}>
          <span style={{ fontSize: 10, marginTop: 1 }}>{s.icon}</span>
          <div>
            <div style={{ color: C.inkFaint, fontSize: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            <div style={{ color: C.inkStrong, fontSize: 10, lineHeight: 1.4 }}>{s.value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function PanelBio() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#1D2E36', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-1.5 px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {['#DF8B83','#DBB36E','#79BD92'].map(c => <div key={c} className="w-2 h-2 rounded-full" style={{ background: c }}/>)}
        <div className="flex-1 mx-2 rounded-md px-2 py-0.5 text-center" style={{ background: 'rgba(255,255,255,0.07)', fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>
          yourname.applytracker.io
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full" style={{ background: `linear-gradient(135deg,${C.teal},${C.gold})` }}/>
          <div>
            <div style={{ color: '#FFF9ED', fontSize: 10, fontWeight: 600 }}>Alex Chen</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8 }}>Computer Science · Class of 2026</div>
          </div>
        </div>
        <div className="rounded-lg p-2 mb-2" style={{ background: 'rgba(113,185,175,0.12)', border: '1px solid rgba(113,185,175,0.2)' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8, lineHeight: 1.5 }}>
            Passionate about building things that matter. Research intern at Stanford AI Lab, Science Olympiad captain, and aspiring CS student.
          </div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {['ML Research','Robotics','USAMO'].map(t => (
            <span key={t} className="px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', fontSize: 8 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PanelPlanner() {
  const tasks = [
    { school: 'MIT',     task: 'Finish Why MIT essay',   due: '2 days',  done: false, urgent: true  },
    { school: 'Yale',    task: 'Request rec letter',      due: '5 days',  done: false, urgent: false },
    { school: 'Cornell', task: 'Submit common app',       due: '8 days',  done: false, urgent: false },
    { school: 'Brown',   task: 'Fill activities section', due: '14 days', done: true,  urgent: false },
  ]
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.slate }}/>
        <span style={{ color: C.slate, fontWeight: 600, fontSize: 10, fontFamily: 'var(--font-serif)' }}>Today&apos;s Priorities</span>
      </div>
      {tasks.map((t, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2"
          style={{ borderBottom: i < 3 ? `1px solid ${C.border}40` : 'none', opacity: t.done ? 0.45 : 1 }}>
          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ border: `1.5px solid ${t.done ? C.teal : t.urgent ? C.danger : C.inkFaint}`, background: t.done ? C.paleTeal : 'transparent' }}>
            {t.done && (
              <svg width="7" height="7" viewBox="0 0 8 8">
                <path d="M1 4l2 2 4-4" stroke={C.teal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: t.done ? C.inkFaint : C.inkStrong, fontSize: 10, fontWeight: 500, textDecoration: t.done ? 'line-through' : 'none' }}>{t.task}</div>
            <div style={{ color: C.inkFaint, fontSize: 8 }}>{t.school}</div>
          </div>
          <span className="px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{ background: t.urgent ? '#F5DDD9' : C.bgSoft, color: t.urgent ? C.danger : C.inkFaint, fontSize: 8 }}>{t.due}</span>
        </div>
      ))}
    </div>
  )
}
