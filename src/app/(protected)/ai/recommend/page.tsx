'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Lock, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { C } from '@/lib/atlas'
import { useToast } from '@/components/ui/Toast'

interface Recommendation {
  school_name: string
  match_type: 'likely' | 'match' | 'reach'
  match_score: number
  rationale: string
  strengths: string
  concerns: string
}

const MATCH_CONFIG = {
  likely: { label: 'Likely',  color: C.success,  pale: '#D1EBE0', border: `${C.success}40`, Icon: TrendingDown },
  match:  { label: 'Match',   color: C.teal,     pale: C.paleTeal, border: `${C.teal}40`,   Icon: Minus        },
  reach:  { label: 'Reach',   color: C.gold,     pale: C.paleGold, border: `${C.gold}40`,   Icon: TrendingUp   },
} as const

export default function RecommendPage() {
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPro] = useState(false)

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/ai/recommend', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      toast(data.error ?? 'Something went wrong.', 'error')
    } else {
      setRecommendations(data.recommendations)
      toast('Recommendations ready')
    }
    setLoading(false)
  }

  const likely = recommendations.filter(r => r.match_type === 'likely')
  const match  = recommendations.filter(r => r.match_type === 'match')
  const reach  = recommendations.filter(r => r.match_type === 'reach')

  return (
    <div style={{ color: C.ink }}>
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
            School Recommender
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
            AI matches your profile to the best-fit schools.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading || !isPro}
          className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-50 flex-shrink-0"
          style={{ background: C.teal, color: 'white' }}
          onMouseEnter={e => { if (!loading && isPro) (e.currentTarget as HTMLElement).style.background = '#267970' }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = C.teal}>
          {loading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
          {loading ? 'Analyzing…' : 'Generate Recommendations'}
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
        <div className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: '#F5DDD9', border: `1px solid ${C.danger}40`, color: C.danger }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl p-16 text-center"
          style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: C.teal }}/>
          <p style={{ color: C.inkMuted, fontWeight: 500 }}>AI is analyzing your profile…</p>
          <p className="text-xs mt-1" style={{ color: C.inkFaint }}>This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {recommendations.length > 0 && !loading && (
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex gap-4 text-xs flex-wrap">
            {(['likely', 'match', 'reach'] as const).map(type => {
              const cfg = MATCH_CONFIG[type]
              return (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }}/>
                  <span style={{ color: C.inkMuted }}>{cfg.label}</span>
                </div>
              )
            })}
          </div>

          {/* Groups */}
          {([['likely', likely], ['match', match], ['reach', reach]] as const).map(([type, list]) => {
            if (!list.length) return null
            const cfg = MATCH_CONFIG[type]
            const Icon = cfg.Icon
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color: cfg.color }}/>
                  <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: cfg.color, fontFamily: 'var(--font-sans)' }}>
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-3">
                  {list.map((rec, i) => (
                    <div key={i} className="rounded-2xl p-5"
                      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(38,63,73,0.06)' }}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: cfg.pale, border: `1px solid ${cfg.border}` }}>
                            <Icon size={14} style={{ color: cfg.color }}/>
                          </div>
                          <div>
                            <p style={{ fontFamily: 'var(--font-serif)', color: C.inkStrong, fontWeight: 600, fontSize: 15 }}>{rec.school_name}</p>
                            <p style={{ fontSize: 11, color: C.inkFaint }}>Fit score: {rec.match_score}/10</p>
                          </div>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                          style={{ background: cfg.pale, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed mb-4" style={{ color: C.inkMuted }}>{rec.rationale}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl p-3"
                          style={{ background: '#D1EBE020', border: `1px solid ${C.success}30` }}>
                          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.success, marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Strengths</p>
                          <p style={{ fontSize: 12, color: C.inkMuted }}>{rec.strengths}</p>
                        </div>
                        <div className="rounded-xl p-3"
                          style={{ background: '#F5DDD920', border: `1px solid ${C.danger}30` }}>
                          <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.danger, marginBottom: 4, fontFamily: 'var(--font-sans)' }}>Watch out</p>
                          <p style={{ fontSize: 12, color: C.inkMuted }}>{rec.concerns}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty (pro, no results yet) */}
      {recommendations.length === 0 && !loading && !error && isPro && (
        <div className="rounded-2xl p-16 text-center"
          style={{ border: `2px dashed ${C.border}`, background: C.card }}>
          <Sparkles size={28} style={{ color: C.inkFaint, margin: '0 auto 12px' }}/>
          <p style={{ color: C.inkMuted }}>Click &ldquo;Generate Recommendations&rdquo; to get your personalized school list.</p>
          <p className="text-xs mt-1" style={{ color: C.inkFaint }}>Make sure you&apos;ve uploaded your resume first.</p>
        </div>
      )}

      {/* Empty (not pro, no results) */}
      {recommendations.length === 0 && !loading && !error && !isPro && (
        <div className="rounded-2xl p-16 text-center"
          style={{ border: `2px dashed ${C.border}`, background: C.card }}>
          <div className="flex gap-6 justify-center text-xs mb-8" style={{ color: C.inkFaint }}>
            {(['likely', 'match', 'reach'] as const).map(type => {
              const cfg = MATCH_CONFIG[type]
              const Ico = cfg.Icon
              return (
                <div key={type} className="flex flex-col items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.pale }}>
                    <Ico size={14} style={{ color: cfg.color }}/>
                  </div>
                  <span>{cfg.label}</span>
                </div>
              )
            })}
          </div>
          <p style={{ color: C.inkMuted, fontWeight: 500, marginBottom: 4 }}>
            Upgrade to Pro to get personalized school matches.
          </p>
          <p style={{ color: C.inkFaint, fontSize: 12 }}>
            AI analyzes your GPA, test scores, activities, and intended major.
          </p>
          <div className="flex items-center justify-center gap-1 mt-6 text-sm font-medium" style={{ color: C.teal }}>
            <span>View Pro plans in Settings</span>
            <ArrowRight size={13}/>
          </div>
        </div>
      )}
    </div>
  )
}
