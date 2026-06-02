export const dynamic = 'force-dynamic'

import { Globe, Sparkles, Lock } from 'lucide-react'
import { C } from '@/lib/atlas'

export default function BioPage() {
  return (
    <div style={{ color: C.ink }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, marginBottom: 6 }}>
        Bio Website
      </h1>
      <p className="text-sm mb-8" style={{ color: C.inkMuted }}>
        Generate a personal college application profile page — shareable with admissions officers.
      </p>

      <div className="rounded-2xl p-10 text-center"
        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(38,63,73,0.07)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ background: C.palePlum, border: `1px solid ${C.plum}30` }}>
          <Globe size={24} style={{ color: C.plum }}/>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 18, marginBottom: 8 }}>
          Coming Soon
        </h2>
        <p style={{ color: C.inkMuted, fontSize: 14, maxWidth: 360, margin: '0 auto 20px' }}>
          We&apos;re building a beautiful one-page bio site generator tailored for college applicants. Stay tuned.
        </p>

        <div className="inline-flex flex-col gap-3 text-left mt-2 text-sm">
          {[
            { icon: Sparkles, text: 'AI-generated from your resume & profile' },
            { icon: Globe,    text: 'Custom subdomain — share with anyone' },
            { icon: Lock,     text: 'Toggle visibility on/off anytime' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3" style={{ color: C.inkMuted }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
                <Icon size={13} style={{ color: C.inkFaint }}/>
              </div>
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
