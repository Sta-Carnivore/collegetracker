import { C } from '@/lib/atlas'
import Reveal from './Reveal'

export default function PlannerSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-20">
      <Reveal>
        <div className="text-center mb-10">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,2.5vw,2.2rem)', color: C.inkStrong, fontWeight: 600 }}>
            Always know what to do next.
          </h2>
          <p className="mt-2 text-sm" style={{ color: C.inkMuted }}>The Planner surfaces your highest-priority task every day.</p>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 rounded-2xl p-6"
            style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(38,63,73,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.inkFaint }}>Today&apos;s Priority</p>
            <p className="text-sm font-semibold mb-1" style={{ color: C.inkStrong }}>Draft MIT Essay 1 — &ldquo;Why MIT?&rdquo;</p>
            <p className="text-xs mb-4" style={{ color: C.inkMuted }}>Deadline in 4 days · 2 essays remaining</p>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.teal, color: 'white' }}>Open essay</button>
              <button className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>Mark done</button>
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(38,63,73,0.07)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.inkFaint }}>High Risk</p>
            {[
              { school: 'MIT',  days: '4 days',  color: C.danger  },
              { school: 'Yale', days: '12 days', color: '#9A7030' },
            ].map(item => (
              <div key={item.school} className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: C.inkStrong }}>{item.school}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: `${item.color}18`, color: item.color }}>{item.days}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  )
}
