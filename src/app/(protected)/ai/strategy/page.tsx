'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2, Lock, AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface StrategyItem { task: string; reason: string }
interface AtRisk       { school: string; issue: string }
interface Strategy {
  summary: string
  urgent:     StrategyItem[]
  this_week:  StrategyItem[]
  upcoming:   StrategyItem[]
  at_risk:    AtRisk[]
}

const SECTION_CONFIG = {
  at_risk:   { label: 'At Risk',              color: C.danger,  pale: '#F5DDD9',   border: '#BA5A5540' },
  urgent:    { label: 'Urgent — Next 3 Days', color: C.gold,    pale: C.paleGold,  border: C.gold + '40' },
  this_week: { label: 'This Week',            color: C.teal,    pale: C.paleTeal,  border: C.teal + '40' },
  upcoming:  { label: 'Upcoming (2–4 weeks)', color: C.inkFaint, pale: C.bgSoft,   border: C.border },
} as const

export default function StrategyPage() {
  const { toast } = useToast()
  const [strategy, setStrategy] = useState<Strategy | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [isPro, setIsPro]       = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('users').select('is_pro').eq('id', user.id).single()
          .then(({ data }) => setIsPro(data?.is_pro ?? false))
      }
    })
  }, [supabase])

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/ai/strategy', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error)
      toast(data.error ?? 'Failed to generate strategy', 'error')
    } else {
      setStrategy(data.strategy)
      toast('Strategy generated')
    }
    setLoading(false)
  }

  return (
    <div style={{ color: C.ink }}>
      {/* Title row */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
            Application Strategy
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
            AI analyzes your applications and tells you what to do next.
          </p>
        </div>
        <button onClick={generate} disabled={loading || !isPro}
          className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-50 flex-shrink-0"
          style={{ background: C.teal, color: 'white' }}
          onMouseEnter={e => { if (!loading && isPro) (e.currentTarget as HTMLElement).style.background = '#267970' }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
          {loading ? 'Analyzing…' : 'Generate Strategy'}
        </button>
      </div>

      {/* Pro gate */}
      {!isPro && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: C.paleGold, border: `1px solid ${C.gold}40`, color: '#7A5C1E' }}>
          <Lock size={14}/>
          This feature requires a Pro subscription.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: '#F5DDD9', border: `1px solid ${C.danger}40`, color: C.danger }}>
          <AlertTriangle size={14}/>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: C.teal }}/>
          <p style={{ color: C.inkMuted, fontWeight: 500 }}>AI is reviewing your applications…</p>
          <p className="text-xs mt-1" style={{ color: C.inkFaint }}>This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {strategy && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-2xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(38,63,73,0.07)' }}>
            <p style={{ color: C.inkMuted, lineHeight: 1.6, fontSize: 14 }}>{strategy.summary}</p>
          </div>

          {(['at_risk', 'urgent', 'this_week', 'upcoming'] as const).map(key => {
            const items = key === 'at_risk' ? strategy.at_risk : strategy[key]
            if (!items?.length) return null
            const cfg = SECTION_CONFIG[key]
            return (
              <div key={key} className="rounded-2xl p-5"
                style={{ background: cfg.pale, border: `1px solid ${cfg.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.06)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.color, marginBottom: 14, fontFamily: 'var(--font-sans)' }}>
                  {cfg.label}
                </p>
                <div className="space-y-3">
                  {key === 'at_risk'
                    ? (strategy.at_risk as AtRisk[]).map((r, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span style={{ color: cfg.color, fontWeight: 600, flexShrink: 0 }}>{r.school}</span>
                          <span style={{ color: C.inkMuted }}>{r.issue}</span>
                        </div>
                      ))
                    : (items as StrategyItem[]).map((t, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <ArrowRight size={14} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }}/>
                          <div>
                            <p style={{ color: C.inkStrong, fontWeight: 500 }}>{t.task}</p>
                            <p style={{ color: C.inkMuted, fontSize: 12, marginTop: 2 }}>{t.reason}</p>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty (pro, no results yet) */}
      {!strategy && !loading && !error && isPro && (
        <div className="rounded-2xl p-16 text-center"
          style={{ border: `2px dashed ${C.border}`, background: C.card }}>
          <Sparkles size={28} style={{ color: C.inkFaint, margin: '0 auto 12px' }}/>
          <p style={{ color: C.inkMuted }}>Click &ldquo;Generate Strategy&rdquo; to get your personalized action plan.</p>
        </div>
      )}
    </div>
  )
}
