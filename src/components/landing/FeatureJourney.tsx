'use client'
import { C } from '@/lib/atlas'
import Reveal from './Reveal'
import { PanelTracker, PanelResume, PanelBio, PanelPlanner } from './FeaturePanels'

const FEATURES = [
  { n: '01', title: 'Organize your schools.',                    desc: 'Add from 1,600+ US universities. Track rounds, deadlines, essay counts, and status — in list or card view.',       color: C.gold,  accent: C.paleGold,  bg: '#FBF5E6', Panel: PanelTracker },
  { n: '02', title: 'Turn your Resume into a structured profile.', desc: 'Upload a PDF or DOCX. AI extracts activities, awards, projects, and academics into clean, editable sections.',     color: C.teal,  accent: C.paleTeal,  bg: '#EEF8F6', Panel: PanelResume  },
  { n: '03', title: 'Generate a personal Bio website.',           desc: 'Choose Academic, Builder, or Creative. AI writes the copy from your profile. Publish in minutes.',                 color: C.plum,  accent: C.palePlum,  bg: '#F5F2FA', Panel: PanelBio     },
  { n: '04', title: 'Know what to do next.',                      desc: 'The Planner reads your deadlines, essay progress, and checklist to surface exactly what needs your attention today.', color: C.slate, accent: C.slateLight, bg: '#EFF5F8', Panel: PanelPlanner },
]

export default function FeatureJourney() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 md:px-10 py-24">
      <Reveal>
        <div className="text-center mb-20">
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.9rem,3vw,2.7rem)', color: C.inkStrong, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Your application, step by step.
          </h2>
          <p className="mt-3 text-sm" style={{ color: C.inkMuted }}>Four tools. Every stage of the season.</p>
        </div>
      </Reveal>

      <div className="relative">
        <div className="absolute left-1/2 top-8 bottom-8 w-px hidden lg:block"
          style={{ background: `linear-gradient(to bottom,transparent,${C.gold}50 20%,${C.teal}50 80%,transparent)`, transform: 'translateX(-50%)' }}/>

        <div className="space-y-20">
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className={`flex items-center gap-10 lg:gap-16 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''} flex-col lg:flex-row`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 relative z-10"
                      style={{ background: f.accent, color: f.color, border: `2px solid ${f.color}`, fontFamily: 'var(--font-serif)' }}>
                      {f.n}
                    </div>
                    <div className="h-px flex-1" style={{ background: `${f.color}35` }}/>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.15rem,2vw,1.5rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.3, marginBottom: '0.75rem' }}>
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.inkMuted, maxWidth: '40ch' }}>{f.desc}</p>
                </div>

                <div className="flex-1 w-full">
                  <div className="rounded-2xl p-5 transition-all duration-300"
                    style={{ background: f.bg, border: `1.5px solid ${f.color}22` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 14px 36px ${f.color}18` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                    <f.Panel />
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
