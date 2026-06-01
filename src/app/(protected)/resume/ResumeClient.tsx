'use client'

import { useState, useRef } from 'react'
import { ParsedResume } from '@/types/database'
import { Upload, RefreshCw, Loader2, Lock } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface Props {
  initialParsed: ParsedResume | null
  callsUsed: number
  isPro: boolean
}

const sectionStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 16,
  padding: '20px 24px',
  boxShadow: '0 2px 10px rgba(38,63,73,0.07)',
}

const sectionLabelStyle = {
  fontSize: 11,
  fontWeight: 600 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: C.inkFaint,
  marginBottom: 16,
  fontFamily: 'var(--font-sans)',
}

export default function ResumeClient({ initialParsed, callsUsed, isPro }: Props) {
  const { toast } = useToast()
  const [parsed, setParsed] = useState<ParsedResume | null>(initialParsed)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const limitReached = !isPro && callsUsed >= 10

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/resume', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      toast(data.error ?? 'Something went wrong.', 'error')
    } else {
      setParsed(data.parsed)
      toast('Resume parsed successfully')
    }
    setLoading(false)
  }

  return (
    <div style={{ color: C.ink }}>
      {/* Title row */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
            AI Resume
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
            Upload your resume — AI extracts and displays your profile.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: C.inkFaint }}>
            {isPro ? 'Pro · unlimited' : `${callsUsed}/10 this month`}
          </span>
          <button
            onClick={() => !limitReached && fileRef.current?.click()}
            disabled={loading || limitReached}
            className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-50"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => { if (!loading && !limitReached) (e.currentTarget as HTMLElement).style.background = '#267970' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
            {loading ? <Loader2 size={14} className="animate-spin"/> : parsed ? <RefreshCw size={14}/> : <Upload size={14}/>}
            {loading ? 'Parsing…' : parsed ? 'Re-upload' : 'Upload PDF'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload}/>
        </div>
      </div>

      {/* Limit banner */}
      {limitReached && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: C.paleGold, border: `1px solid ${C.gold}40`, color: '#7A5C1E' }}>
          <Lock size={14}/>
          You&apos;ve reached the 10/month free limit. Upgrade to Pro for unlimited AI resume parsing.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: '#F5DDD9', border: `1px solid ${C.danger}40`, color: C.danger }}>
          {error}
        </div>
      )}

      {/* Empty / Upload area */}
      {!parsed && !loading && (
        <div
          onClick={() => !limitReached && fileRef.current?.click()}
          className="rounded-2xl p-16 text-center transition-all"
          style={{
            border: `2px dashed ${C.border}`,
            background: C.card,
            cursor: limitReached ? 'default' : 'pointer',
          }}
          onMouseEnter={e => { if (!limitReached) (e.currentTarget as HTMLElement).style.borderColor = `rgba(38,63,73,0.28)` }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = C.border}>
          <Upload size={28} style={{ color: C.inkFaint, margin: '0 auto 12px' }}/>
          <p style={{ color: C.inkMuted, fontWeight: 500 }}>Drop your PDF resume here or click to upload</p>
          <p className="text-xs mt-1.5" style={{ color: C.inkFaint }}>PDF only · Max 5MB</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: C.teal }}/>
          <p style={{ color: C.inkMuted, fontWeight: 500 }}>AI is parsing your resume…</p>
          <p className="text-xs mt-1" style={{ color: C.inkFaint }}>This may take a few seconds</p>
        </div>
      )}

      {/* Results */}
      {parsed && !loading && (
        <div className="space-y-4">
          {parsed.education?.length > 0 && (
            <Section title="Education">
              {parsed.education.map((e, i) => (
                <div key={i} className="flex justify-between items-baseline text-sm">
                  <span style={{ color: C.inkStrong, fontFamily: 'var(--font-serif)', fontWeight: 600 }}>{e.school}</span>
                  <span style={{ color: C.inkMuted, fontSize: 12 }}>{e.gpa ? `GPA ${e.gpa}` : ''} {e.graduation ?? ''}</span>
                </div>
              ))}
            </Section>
          )}

          {parsed.activities?.length > 0 && (
            <Section title="Activities">
              {parsed.activities.map((a, i) => (
                <div key={i} className="text-sm pb-3 last:pb-0"
                  style={{ borderBottom: i < parsed.activities.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div className="flex justify-between items-baseline">
                    <span style={{ color: C.inkStrong, fontWeight: 600 }}>{a.name}</span>
                    <span style={{ color: C.inkFaint, fontSize: 11 }}>{a.years}</span>
                  </div>
                  <p style={{ color: C.inkMuted, fontSize: 12, marginTop: 2 }}>{a.role}</p>
                  <p style={{ color: C.inkFaint, fontSize: 12, marginTop: 3 }}>{a.description}</p>
                </div>
              ))}
            </Section>
          )}

          {parsed.awards?.length > 0 && (
            <Section title="Awards & Honors">
              {parsed.awards.map((a, i) => (
                <div key={i} className="flex justify-between items-baseline text-sm">
                  <span style={{ color: C.inkStrong }}>{a.name}</span>
                  <span style={{ color: C.inkFaint, fontSize: 11 }}>{a.level} · {a.year}</span>
                </div>
              ))}
            </Section>
          )}

          {parsed.work_experience?.length > 0 && (
            <Section title="Work Experience">
              {parsed.work_experience.map((w, i) => (
                <div key={i} className="text-sm pb-3 last:pb-0"
                  style={{ borderBottom: i < parsed.work_experience.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div className="flex justify-between items-baseline">
                    <span style={{ color: C.inkStrong, fontWeight: 600 }}>{w.company}</span>
                    <span style={{ color: C.inkFaint, fontSize: 11 }}>{w.period}</span>
                  </div>
                  <p style={{ color: C.inkMuted, fontSize: 12, marginTop: 2 }}>{w.role}</p>
                  <p style={{ color: C.inkFaint, fontSize: 12, marginTop: 3 }}>{w.description}</p>
                </div>
              ))}
            </Section>
          )}

          {parsed.skills?.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {parsed.skills.map((s, i) => (
                  <span key={i} className="text-xs px-3 py-1 rounded-full"
                    style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={sectionStyle}>
      <p style={sectionLabelStyle}>{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
