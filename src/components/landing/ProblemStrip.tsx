import { C } from '@/lib/atlas'
import Reveal from './Reveal'

const PROBLEMS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="3" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9h8M7 13h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="17" cy="15" r="3" fill="#BA5A55"/>
        <path d="M16 15h2M17 14v2" stroke="white" strokeWidth="1"/>
      </svg>
    ),
    title: 'Too many deadlines',
    desc: 'EA, ED, RD, UC — every school has its own timeline. Missing one is easier than you think.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="12" y="2" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="2" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="12" y="12" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'Materials scattered everywhere',
    desc: 'Essays in Docs, checklists in WeChat, notes on paper — nothing connected.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'No clear next step',
    desc: 'You know something needs doing — but today, right now, where do you actually start?',
  },
]

export default function ProblemStrip() {
  return (
    <section style={{ background: C.bgSoft, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10">
        {PROBLEMS.map((p, i) => (
          <Reveal key={i} delay={i * 80}>
            <div className="group cursor-default">
              <div className="mb-4 transition-transform duration-300 group-hover:-translate-y-1"
                style={{ color: C.ink }}>{p.icon}</div>
              <h3 className="font-semibold mb-2"
                style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontSize: 15 }}>{p.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: C.inkMuted }}>{p.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
