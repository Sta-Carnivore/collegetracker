'use client'
import { C } from '@/lib/atlas'
import Reveal from './Reveal'

const BIO_TEMPLATES = [
  {
    name: 'Academic / Research',
    desc: 'For science, research, and academic achievers.',
    accent: C.teal,
    bg: C.paleTeal,
    preview: (
      <div className="p-3 rounded-xl" style={{ background: C.card }}>
        <div className="text-xs font-semibold mb-2" style={{ color: C.teal, fontFamily: 'var(--font-serif)' }}>Research Portfolio</div>
        <div className="h-1.5 rounded w-3/4 mb-1.5" style={{ background: C.teal, opacity: 0.3 }}/>
        <div className="h-1 rounded w-1/2 mb-3" style={{ background: C.border }}/>
        <div className="flex gap-1.5">
          <div className="h-7 flex-1 rounded-lg" style={{ background: C.paleTeal }}/>
          <div className="h-7 flex-1 rounded-lg" style={{ background: C.bgSoft }}/>
        </div>
      </div>
    ),
  },
  {
    name: 'Builder / Project',
    desc: 'For engineers, CS students, and makers.',
    accent: C.slate,
    bg: C.slateLight,
    preview: (
      <div className="p-3 rounded-xl" style={{ background: '#F0F5F8' }}>
        <div className="flex gap-1 mb-2.5">
          {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full" style={{ background: C.slate, opacity: i === 1 ? 1 : 0.25 }}/>)}
        </div>
        <div className="h-1.5 rounded w-2/3 mb-1.5" style={{ background: C.slate, opacity: 0.35 }}/>
        <div className="h-1 rounded w-full mb-2.5" style={{ background: C.border }}/>
        <div className="grid grid-cols-2 gap-1.5">
          <div className="h-5 rounded-lg" style={{ background: C.slateLight }}/>
          <div className="h-5 rounded-lg" style={{ background: C.slateLight }}/>
        </div>
      </div>
    ),
  },
  {
    name: 'Creative / Hybrid',
    desc: 'For arts, humanities, and multidisciplinary students.',
    accent: C.plum,
    bg: C.palePlum,
    preview: (
      <div className="p-3 rounded-xl" style={{ background: '#FAF8FC' }}>
        <div className="flex justify-between items-center mb-2.5">
          <div className="h-1.5 rounded w-1/2" style={{ background: C.plum, opacity: 0.35 }}/>
          <div className="w-5 h-5 rounded-full" style={{ background: C.palePlum, border: `1.5px solid ${C.plum}` }}/>
        </div>
        <div className="h-10 rounded-xl mb-1.5" style={{ background: `linear-gradient(135deg,${C.palePlum},${C.paleGold})` }}/>
        <div className="h-1 rounded w-2/3" style={{ background: C.border }}/>
      </div>
    ),
  },
]

export default function BioSection() {
  return (
    <section style={{ background: C.bgSoft, borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-20">
        <Reveal>
          <div className="text-center mb-12">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.6rem,2.5vw,2.2rem)', color: C.inkStrong, fontWeight: 600 }}>
              A Bio website that feels like you.
            </h2>
            <p className="mt-2 text-sm" style={{ color: C.inkMuted }}>Three templates. AI writes the copy from your profile. Publish in minutes.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {BIO_TEMPLATES.map((t, i) => (
            <Reveal key={t.name} delay={i * 80}>
              <div className="rounded-2xl overflow-hidden cursor-default"
                style={{ background: C.card, border: `1.5px solid ${C.border}`, boxShadow: '0 2px 12px rgba(38,63,73,0.06)', transition: 'all 0.3s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 36px rgba(38,63,73,0.12)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(38,63,73,0.06)' }}>
                <div className="p-4" style={{ background: `${t.bg}66` }}>{t.preview}</div>
                <div className="px-4 py-4">
                  <div className="text-xs font-semibold mb-0.5" style={{ color: t.accent }}>{t.name}</div>
                  <div className="text-xs leading-relaxed" style={{ color: C.inkMuted }}>{t.desc}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
