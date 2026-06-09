'use client'

import { useState, useRef } from 'react'
import { ParsedResume } from '@/types/database'
import { Upload, RefreshCw, Loader2, Lock, Copy, Check, AlertCircle, TrendingUp, LayoutTemplate, Target, X } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface Props {
  initialParsed: ParsedResume | null
  callsUsed: number
  isPro: boolean
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** patterns first, then *italic*
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g)
  if (boldParts.length === 1) return text
  return (
    <>
      {boldParts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: 600, color: C.inkStrong }}>{part.slice(2, -2)}</strong>
        }
        return part || null
      })}
    </>
  )
}

function renderMarkdown(md: string) {
  const lines = md.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      elements.push(
        <p key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: C.inkStrong, marginBottom: 2, lineHeight: 1.25 }}>
          {renderInline(line.slice(2))}
        </p>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ marginTop: 22, marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: C.teal, fontFamily: 'var(--font-sans)' }}>
            {line.slice(3)}
          </p>
          <div style={{ height: 1, background: `${C.teal}50`, marginTop: 5 }}/>
        </div>
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <p key={i} style={{ fontSize: 13, fontWeight: 600, color: C.inkStrong, marginTop: 10, marginBottom: 2 }}>
          {renderInline(line.slice(4))}
        </p>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex gap-2" style={{ marginTop: 4 }}>
          <span style={{ color: C.inkFaint, flexShrink: 0, marginTop: 2, fontSize: 11 }}>·</span>
          <p style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.6 }}>{renderInline(line.slice(2))}</p>
        </div>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: 6 }}/>)
    } else {
      elements.push(
        <p key={i} style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.6 }}>{renderInline(line)}</p>
      )
    }
    i++
  }
  return elements
}

export default function ResumeClient({ initialParsed, callsUsed, isPro }: Props) {
  const { toast } = useToast()
  const [parsed, setParsed] = useState<ParsedResume | null>(initialParsed)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  // Track locally so the count updates immediately after an upload (the server
  // increments the counter after the response, so the page prop is one behind).
  const [used, setUsed] = useState(callsUsed)
  const fileRef = useRef<HTMLInputElement>(null)

  const monthlyLimit = isPro ? 20 : 3
  const limitReached = used >= monthlyLimit

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/resume', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        toast(data.error ?? 'Something went wrong.', 'error')
      } else {
        setParsed(data.parsed)
        setUsed(u => u + 1)
        toast('Analysis complete')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError('Server error: ' + msg)
      toast('Server error', 'error')
    }
    setLoading(false)
    // Reset input so same file can be re-uploaded
    e.target.value = ''
  }

  function toPlainText(md: string): string {
    return md
      .split('\n')
      .map(line => {
        if (line.startsWith('### ')) return line.slice(4)
        if (line.startsWith('## ')) return line.slice(3).toUpperCase()
        if (line.startsWith('# ')) return line.slice(2)
        if (line.startsWith('- ') || line.startsWith('* ')) return '  ' + line.slice(2)
        return line
      })
      .join('\n')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
  }

  async function handleCopy() {
    if (!parsed?.reformatted) return
    await navigator.clipboard.writeText(toPlainText(parsed.reformatted))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const gaps = parsed?.gaps ?? []
  const reformatted = parsed?.reformatted ?? ''

  return (
    <div style={{ color: C.ink }}>
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
            Resume Analysis
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
            Upload your resume — get a gap analysis and a clean reformat.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: C.inkFaint }}>
            {`${used}/${monthlyLimit} this month`}{isPro ? ' · Pro' : ''}
          </span>
          <button
            onClick={() => !limitReached && fileRef.current?.click()}
            disabled={loading || limitReached}
            className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-50"
            style={{ background: C.teal, color: 'white' }}
            onMouseEnter={e => { if (!loading && !limitReached) (e.currentTarget as HTMLElement).style.background = '#267970' }}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
            {loading ? <Loader2 size={14} className="animate-spin"/> : parsed ? <RefreshCw size={14}/> : <Upload size={14}/>}
            {loading ? 'Analyzing…' : parsed ? 'Re-upload' : 'Upload Resume'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleUpload}/>
        </div>
      </div>

      {/* Limit banner */}
      {limitReached && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: C.paleGold, border: `1px solid ${C.gold}40`, color: '#7A5C1E' }}>
          <Lock size={14}/>
          {isPro
            ? `You've used all ${monthlyLimit} resume analyses this month. Your limit resets next month.`
            : `You've reached the ${monthlyLimit}/month free limit. Upgrade to Pro for 20/month.`}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: '#F5DDD9', border: `1px solid ${C.danger}40`, color: C.danger }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {!parsed && !loading && (
        <div className="space-y-5">
          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: TrendingUp,
                color: C.danger,
                pale: '#F5DDD9',
                title: 'Gap Analysis',
                desc: 'Ranked list of what your profile is missing — calibrated to your academic level and target schools.',
              },
              {
                icon: Target,
                color: C.teal,
                pale: C.paleTeal,
                title: 'Priority Order',
                desc: 'Scores first, then leadership, then competitions. Concrete next steps, not vague suggestions.',
              },
              {
                icon: LayoutTemplate,
                color: C.plum,
                pale: C.palePlum,
                title: 'Clean Reformat',
                desc: 'Your existing resume restructured into a professional layout. Copy as plain text instantly.',
              },
            ].map(({ icon: Icon, color, pale, title, desc }) => (
              <div key={title} className="rounded-2xl p-5"
                style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(38,63,73,0.06)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: pale, border: `1px solid ${color}25` }}>
                  <Icon size={15} style={{ color }}/>
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: C.inkStrong }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: C.inkMuted }}>{desc}</p>
              </div>
            ))}
          </div>

          {/* Example gap preview */}
          <div className="rounded-2xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(38,63,73,0.06)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.inkFaint, marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
              Example Output
            </p>
            <div className="space-y-2.5">
              {[
                { n: '01', what: 'SAT Score Gap', how: 'Current 1240 is below UT Austin CS 25th (1310). Retake in Oct — Khan Academy adaptive 20 min/day for 6 weeks targets +80 points.' },
                { n: '02', what: 'Robotics Leadership', how: 'Transition from member to team captain or sub-team lead. Propose to your coach before September; most FTC teams restructure roles at season start.' },
                { n: '03', what: 'CS Competition', how: 'Register for USACO Bronze by Dec — free, self-paced, and directly signals CS aptitude. Start with USACO Guide\'s Bronze section.' },
              ].map(({ n, what, how }) => (
                <div key={n} className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
                  <span className="text-xs font-bold tabular-nums flex-shrink-0 mt-0.5" style={{ color: C.inkFaint }}>{n}</span>
                  <div>
                    <p className="text-xs font-semibold mb-0.5" style={{ color: C.inkStrong }}>{what}</p>
                    <p className="text-xs leading-relaxed" style={{ color: C.inkMuted }}>{how}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload drop zone */}
          <div
            onClick={() => !limitReached && fileRef.current?.click()}
            className="rounded-2xl p-10 text-center transition-all"
            style={{
              border: `2px dashed ${C.border}`,
              background: C.bgSoft,
              cursor: limitReached ? 'default' : 'pointer',
            }}
            onMouseEnter={e => { if (!limitReached) { (e.currentTarget as HTMLElement).style.borderColor = C.teal + '80'; (e.currentTarget as HTMLElement).style.background = C.paleTeal + '60' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.background = C.bgSoft }}>
            <Upload size={22} style={{ color: C.teal, margin: '0 auto 10px' }}/>
            <p className="text-sm font-semibold" style={{ color: C.inkStrong }}>Upload your resume to get started</p>
            <p className="text-xs mt-1" style={{ color: C.inkFaint }}>PDF or Word (.docx) · Max 5MB</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: C.teal }}/>
          <p style={{ color: C.inkMuted, fontWeight: 500 }}>Analyzing your resume…</p>
          <p className="text-xs mt-1" style={{ color: C.inkFaint }}>This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {parsed && !loading && (
        <div className="space-y-6">

          {/* Gap Analysis */}
          {gaps.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={14} style={{ color: C.danger }}/>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.danger, fontFamily: 'var(--font-sans)' }}>
                  What&apos;s Missing
                </span>
              </div>
              <div className="space-y-2">
                {gaps.map((gap, i) => (
                  <div key={i} className="rounded-xl px-4 py-3.5"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 6px rgba(38,63,73,0.06)' }}>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 text-xs font-bold tabular-nums mt-0.5"
                        style={{ color: C.inkFaint }}>{String(i + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: C.inkStrong }}>{gap.what}</p>
                        <p className="text-sm" style={{ color: C.inkMuted, lineHeight: 1.6 }}>{gap.how}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reformatted Resume */}
          {reformatted && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.inkFaint, fontFamily: 'var(--font-sans)' }}>
                  Your Resume — Reformatted
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-all"
                  style={{
                    background: copied ? '#D1EBE0' : C.bgSoft,
                    color: copied ? C.success : C.inkMuted,
                    border: `1px solid ${copied ? C.success + '50' : C.border}`,
                  }}>
                  {copied ? <Check size={11}/> : <Copy size={11}/>}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
              <div className="rounded-2xl"
                style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 16px rgba(38,63,73,0.07)', overflow: 'hidden' }}>
                {/* Page-like inner area */}
                <div style={{ padding: '32px 40px', maxWidth: 720, margin: '0 auto' }}>
                  {renderMarkdown(reformatted)}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
