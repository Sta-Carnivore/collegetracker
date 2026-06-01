import { C } from '@/lib/atlas'
import Reveal from './Reveal'
import TrackerPreview from './TrackerPreview'

export default function TrackerSection() {
  return (
    <section style={{ background: C.bgSoft, borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-20">
        <Reveal>
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,2.5vw,2.2rem)', color: C.inkStrong, fontWeight: 600 }}>
              The tracker that makes it clear.
            </h2>
            <p className="mt-2 text-sm" style={{ color: C.inkMuted }}>
              One table. Every school, deadline, and status.{' '}
              <span style={{ color: C.teal }}>Click the status chips to explore.</span>
            </p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <TrackerPreview />
        </Reveal>
      </div>
    </section>
  )
}
