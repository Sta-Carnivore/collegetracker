'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe, ChevronRight, ChevronLeft, Loader2, Check, Copy, ExternalLink, RefreshCw, Send, EyeOff, AlertCircle, PenLine, Wand2, MousePointerClick, History, Save, Lock, Zap } from 'lucide-react'
import { C } from '@/lib/atlas'
import { applyBioBaseStyles } from '@/lib/bioRender'
import { sanitizeBioHtml } from '@/lib/bioSanitize'
import { useToast } from '@/components/ui/Toast'
import HistoryDrawer from '@/components/bio/HistoryDrawer'
import type { QuotaState } from '@/lib/bioQuota'

// Preview parity: render the SAME scriptless output the public /u/[slug] page
// serves, so what the user sees in the builder is exactly what visitors get.
// (Older stored pages may still contain a script; this strips it in preview too.)
function previewSrcDoc(html: string): string {
  return applyBioBaseStyles(sanitizeBioHtml(html), 'preview')
}

type BioStep = 'select' | 'questionnaire' | 'preview' | 'published'
type BioStyle = 'proof_board' | 'field_notes' | 'exhibit_wall'

interface ResumeItem { title: string; description?: string }

interface BioMetrics {
  generation_duration_seconds: number
  token_cost: { input_tokens: number; output_tokens: number; total_tokens: number }
  estimated_cost_usd: number
}

interface Props {
  profileName: string
  resumeItems: ResumeItem[]
  hasResume: boolean
  prefillGoal: string
  existingSlug: string | null
  existingHtml: string | null
  existingStyle: BioStyle | null
}

interface StyleDef {
  id: BioStyle
  label: string
  sub: string
  fits: string
  color: string
  pale: string
  sampleName: string
  sampleRole: string
  hero: string
  demo: React.ReactNode
}

const STYLES: StyleDef[] = [
  {
    id: 'proof_board',
    label: 'Proof Board',
    sub: 'The STEM derivation',
    fits: 'CS · Math · Engineering · Physics · Research',
    color: C.teal,
    pale: C.paleTeal,
    sampleName: 'Maya Chen',
    sampleRole: 'Prospective CS + Math',
    hero: 'I build tools that make hard things feel obvious.',
    demo: (
      <div className="bio-demo" style={{ width: '100%', height: 150, background: '#F5F0E8', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
        <svg width="100%" height="100%" viewBox="0 0 200 150" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          {[62, 98, 134, 170].map(x => <line key={x} x1={x} y1="12" x2={x} y2="124" stroke="#2D3B55" strokeWidth="0.5" strokeOpacity="0.07" vectorEffect="non-scaling-stroke"/>)}
          {[36, 68, 100].map(y => <line key={y} x1="24" y1={y} x2="186" y2={y} stroke="#2D3B55" strokeWidth="0.5" strokeOpacity="0.07" vectorEffect="non-scaling-stroke"/>)}
          <line x1="24" y1="124" x2="24" y2="14" stroke="#2D3B55" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          <line x1="24" y1="124" x2="186" y2="124" stroke="#2D3B55" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          <path className="bio-pf-curve" pathLength={100} d="M28 116 Q70 110 100 74 T180 22" stroke="#C8A45A" strokeWidth="2.4" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          <circle className="bio-pf-dot" style={{ animationDelay: '1.2s' }} cx="70" cy="92" r="3.2" fill="#328F86"/>
          <circle className="bio-pf-dot" style={{ animationDelay: '1.9s' }} cx="112" cy="54" r="3.2" fill="#328F86"/>
          <circle className="bio-pf-dot" style={{ animationDelay: '2.6s' }} cx="170" cy="28" r="3.6" fill="#7A3B35"/>
        </svg>
        <div style={{ position: 'absolute', right: 10, top: 9, textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#2D3B55', fontFamily: 'Georgia, serif', fontWeight: 600, lineHeight: 1 }}>Maya Chen</div>
          <div style={{ fontSize: 6.5, color: '#5A6E7F', fontFamily: 'monospace', letterSpacing: '0.14em', marginTop: 2 }}>PROOF OF GROWTH</div>
        </div>
        <div className="bio-rise" style={{ animationDelay: '2.8s', position: 'absolute', left: 28, bottom: 11, background: '#F5F0E8', border: '1px solid #328F8655', borderRadius: 4, padding: '4px 7px', maxWidth: 104 }}>
          <div style={{ fontSize: 6.5, color: '#328F86', fontFamily: 'monospace', letterSpacing: '0.1em' }}>THEOREM 01</div>
          <div style={{ fontSize: 8.5, color: '#2D3B55', fontFamily: 'Georgia, serif', marginTop: 1, lineHeight: 1.15 }}>Built X &rarr; shipped Y</div>
        </div>
        <div style={{ position: 'absolute', right: 11, bottom: 9, fontSize: 12, color: '#C8A45A', fontFamily: 'Georgia, serif' }}>&#8718;</div>
      </div>
    ),
  },
  {
    id: 'field_notes',
    label: 'Field Notes',
    sub: 'The research archive',
    fits: 'Humanities · Psych · Pre-Med · Policy · Writing',
    color: '#5C6B4E',
    pale: '#E8EDE3',
    sampleName: 'Daniel Okafor',
    sampleRole: 'Prospective Cognitive Science',
    hero: 'Why do quiet systems fail?',
    demo: (
      <div className="bio-demo" style={{ width: '100%', height: 150, background: '#F7F3EB', borderRadius: 10, overflow: 'hidden', position: 'relative', borderLeft: '4px solid #2C3A45' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 17px, #2C3A4514 17px, #2C3A4514 18px)', pointerEvents: 'none' }}/>
        {[24, 74, 124].map(t => <div key={t} style={{ position: 'absolute', left: 2, top: t, width: 5, height: 5, borderRadius: '50%', background: '#EDE7D9', border: '1px solid #2C3A4530' }}/>)}
        <div style={{ padding: '11px 11px 11px 15px', position: 'relative' }}>
          <div style={{ fontSize: 6.5, fontFamily: 'monospace', color: '#6A7880', letterSpacing: '0.14em', marginBottom: 4 }}>FIELD NOTES &mdash; 2025</div>
          <div style={{ fontSize: 12, fontFamily: 'Georgia, serif', fontWeight: 600, color: '#2C3A45', lineHeight: 1.15 }}>
            Why do <span className="bio-fn-mark" style={{ ['--bio-hl' as never]: '#B89A5A55' }}>quiet systems</span> fail?
          </div>
          <div style={{ fontSize: 6.5, fontFamily: 'monospace', color: '#5C6B4E', marginTop: 7, letterSpacing: '0.1em' }}>RESEARCH QUESTION &middot;&middot;&middot;&middot;&middot;&middot;</div>
          <div style={{ marginTop: 8, background: '#EDE7D9', border: '1px solid #5C6B4E40', borderRadius: 4, padding: '5px 7px' }}>
            <div style={{ fontSize: 6.5, fontFamily: 'monospace', color: '#5C6B4E', letterSpacing: '0.05em' }}>&#9733; CONTEXT / INSIGHT</div>
            <div style={{ fontSize: 8.5, color: '#2C3A45', fontFamily: 'Georgia, serif', marginTop: 2, lineHeight: 1.25 }}>Observed it, wrote it up, changed the protocol.</div>
          </div>
        </div>
        <div className="bio-fn-note" style={{ animationDelay: '1.5s', position: 'absolute', right: 8, top: 46, transform: 'rotate(3deg)', fontSize: 7.5, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#5C6B4E', maxWidth: 54, lineHeight: 1.25, textAlign: 'right' }}>
          &#8627; revisited 3&times;
        </div>
      </div>
    ),
  },
  {
    id: 'exhibit_wall',
    label: 'Exhibit Wall',
    sub: 'The curator\'s gallery',
    fits: 'Cross-disciplinary · Design · Arts · Startup · Leadership',
    color: C.plum,
    pale: C.palePlum,
    sampleName: 'Sofia Reyes',
    sampleRole: 'Prospective Design + CS',
    hero: 'Things I made because I couldn\'t not.',
    demo: (
      <div className="bio-demo" style={{ width: '100%', height: 150, background: '#EDEBE6', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #2E2E2E12 1px, transparent 1px)', backgroundSize: '14px 14px' }}/>
        <div style={{ position: 'absolute', right: 10, top: 10, fontSize: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#2E2E2E' }}>Selected Works</div>
        <div className="bio-ew-card" style={{ ['--bio-rot' as never]: '-3deg', animationDelay: '0.05s', position: 'absolute', left: 11, top: 26, background: '#FFFDF8', border: '1px solid rgba(46,46,46,0.14)', borderRadius: 6, padding: '6px 9px', boxShadow: '0 3px 11px rgba(0,0,0,0.09)', width: 92 }}>
          <div style={{ fontSize: 6.5, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.08em' }}>EXHIBIT 01</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#2E2E2E', fontFamily: 'Georgia, serif', marginTop: 2, lineHeight: 1.05 }}>Platform Build</div>
          <div style={{ fontSize: 6.5, color: '#6B6560', marginTop: 2 }}>Code &middot; Product</div>
        </div>
        <div className="bio-ew-card" style={{ ['--bio-rot' as never]: '2.2deg', animationDelay: '0.2s', position: 'absolute', left: 90, top: 46, background: '#FFFDF8', border: '1px solid rgba(46,46,46,0.14)', borderRadius: 6, padding: '6px 9px', boxShadow: '0 3px 11px rgba(0,0,0,0.09)', width: 80 }}>
          <div style={{ fontSize: 6.5, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.08em' }}>EXHIBIT 02</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#2E2E2E', fontFamily: 'Georgia, serif', marginTop: 2, lineHeight: 1.05 }}>AIME &times;3</div>
          <div style={{ fontSize: 6.5, color: '#6B6560', marginTop: 2 }}>Math &middot; Proof</div>
        </div>
        <div className="bio-ew-curator" style={{ position: 'absolute', left: 14, bottom: 11, background: '#F0E9D8', border: '1px solid #B5614E40', borderRadius: 4, padding: '4px 7px', transform: 'rotate(-2deg)', maxWidth: 102 }}>
          <div style={{ fontSize: 6, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.06em' }}>CURATOR&rsquo;S NOTE</div>
          <div style={{ fontSize: 7.5, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#2E2E2E', marginTop: 1, lineHeight: 1.2 }}>One thread: build, prove, share.</div>
        </div>
      </div>
    ),
  },
]

/* ── Large immersive first-viewport preview per style ── */
function BigPreview({ id }: { id: BioStyle }) {
  const box: React.CSSProperties = {
    width: '100%', height: 'clamp(320px, 40vw, 430px)', borderRadius: 16,
    overflow: 'hidden', position: 'relative',
  }

  if (id === 'proof_board') {
    return (
      <div style={{ ...box, background: '#F5F0E8' }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          {[80, 140, 200, 260, 320, 380].map(x => <line key={x} x1={x} y1="20" x2={x} y2="340" stroke="#2D3B55" strokeWidth="0.5" strokeOpacity="0.06" vectorEffect="non-scaling-stroke"/>)}
          {[80, 140, 200, 260, 320].map(y => <line key={y} x1="44" y1={y} x2="384" y2={y} stroke="#2D3B55" strokeWidth="0.5" strokeOpacity="0.06" vectorEffect="non-scaling-stroke"/>)}
          <line x1="44" y1="340" x2="44" y2="22" stroke="#2D3B55" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          <line x1="44" y1="340" x2="384" y2="340" stroke="#2D3B55" strokeWidth="1.4" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          <path className="bio-pf-curve" pathLength={100} d="M52 320 Q150 300 210 200 T380 56" stroke="#C8A45A" strokeWidth="2.6" fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
          <circle className="bio-pf-dot" style={{ animationDelay: '1.2s' }} cx="150" cy="252" r="4.4" fill="#328F86"/>
          <circle className="bio-pf-dot" style={{ animationDelay: '1.9s' }} cx="244" cy="158" r="4.4" fill="#328F86"/>
          <circle className="bio-pf-dot" style={{ animationDelay: '2.6s' }} cx="372" cy="66" r="5" fill="#7A3B35"/>
        </svg>
        <span style={{ position: 'absolute', left: 50, bottom: 12, fontSize: 9, color: '#5A6E7F', fontFamily: 'monospace', letterSpacing: '0.08em' }}>practice &rarr;</span>
        <span style={{ position: 'absolute', left: 10, top: 90, fontSize: 9, color: '#5A6E7F', fontFamily: 'monospace', transform: 'rotate(-90deg)', transformOrigin: 'left center' }}>depth</span>
        <div style={{ position: 'absolute', right: 20, top: 18, textAlign: 'right' }}>
          <div style={{ fontSize: 26, color: '#2D3B55', fontFamily: 'Georgia, serif', fontWeight: 600, lineHeight: 1 }}>Maya Chen</div>
          <div style={{ fontSize: 9, color: '#5A6E7F', fontFamily: 'monospace', letterSpacing: '0.16em', marginTop: 4 }}>PROOF OF GROWTH &middot; CS + MATH</div>
        </div>
        <div className="bio-rise" style={{ animationDelay: '0.4s', position: 'absolute', left: 56, top: 92, maxWidth: 230, background: 'rgba(245,240,232,0.92)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 'clamp(15px,2.2vw,21px)', color: '#2D3B55', fontFamily: 'Georgia, serif', lineHeight: 1.25 }}>I build tools that make hard things feel obvious.</div>
        </div>
        <div className="bio-rise" style={{ animationDelay: '2.8s', position: 'absolute', left: 56, bottom: 40, background: '#F5F0E8', border: '1px solid #328F8655', borderRadius: 6, padding: '7px 11px', maxWidth: 220 }}>
          <div style={{ fontSize: 9, color: '#328F86', fontFamily: 'monospace', letterSpacing: '0.1em' }}>THEOREM 01 — SHIPMENT</div>
          <div style={{ fontSize: 12, color: '#2D3B55', fontFamily: 'Georgia, serif', marginTop: 2, lineHeight: 1.2 }}>Given a slow tutoring queue, I built a scheduler. Wait time fell 60%.</div>
        </div>
        <div style={{ position: 'absolute', right: 18, bottom: 14, fontSize: 22, color: '#C8A45A', fontFamily: 'Georgia, serif' }}>&#8718;</div>
      </div>
    )
  }

  if (id === 'field_notes') {
    return (
      <div style={{ ...box, background: '#F7F3EB', borderLeft: '5px solid #2C3A45' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(transparent, transparent 25px, #2C3A4510 25px, #2C3A4510 26px)', pointerEvents: 'none' }}/>
        {[34, 110, 186, 262].map(t => <div key={t} style={{ position: 'absolute', left: 5, top: t, width: 8, height: 8, borderRadius: '50%', background: '#EDE7D9', border: '1px solid #2C3A4530' }}/>)}
        <div style={{ position: 'absolute', right: 18, top: 16, fontSize: 9, fontFamily: 'monospace', color: '#6A7880', letterSpacing: '0.14em' }}>p. 01 / FIELD NOTES — 2025</div>
        <div style={{ padding: '34px 28px 24px 34px', position: 'relative', maxWidth: 540 }}>
          <div style={{ fontSize: 'clamp(26px,4vw,40px)', fontFamily: 'Georgia, serif', fontWeight: 600, color: '#2C3A45', lineHeight: 1.05 }}>Daniel Okafor</div>
          <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#5C6B4E', letterSpacing: '0.12em', marginTop: 6 }}>PROSPECTIVE COGNITIVE SCIENCE</div>
          <div style={{ marginTop: 18, background: 'rgba(247,243,235,0.94)', borderRadius: 6, padding: '4px 6px', display: 'inline-block' }}>
            <span style={{ fontSize: 'clamp(17px,2.6vw,24px)', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#2C3A45', lineHeight: 1.3 }}>
              Why do <span className="bio-fn-mark" style={{ ['--bio-hl' as never]: '#B89A5A66' }}>quiet systems</span> fail?
            </span>
          </div>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#5C6B4E', marginTop: 18, letterSpacing: '0.12em' }}>RESEARCH QUESTION &middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;&middot;</div>
          <div style={{ marginTop: 12, background: '#EDE7D9', border: '1px solid #5C6B4E40', borderRadius: 6, padding: '11px 13px', maxWidth: 320 }}>
            <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#5C6B4E', letterSpacing: '0.06em' }}>&#9733; CONTEXT / INSIGHT</div>
            <div style={{ fontSize: 13, color: '#2C3A45', fontFamily: 'Georgia, serif', marginTop: 4, lineHeight: 1.45 }}>I noticed our debate club drifted whenever no one was tracking it. So I built the tracker, and the drift stopped.</div>
          </div>
        </div>
        <div className="bio-fn-note" style={{ animationDelay: '1.4s', position: 'absolute', right: 22, top: 150, transform: 'rotate(3deg)', fontSize: 12, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#5C6B4E', maxWidth: 120, lineHeight: 1.35, textAlign: 'right' }}>
          &#8627; kept coming back to this for two years
        </div>
      </div>
    )
  }

  // exhibit_wall
  return (
    <div style={{ ...box, background: '#EDEBE6' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #2E2E2E10 1px, transparent 1px)', backgroundSize: '22px 22px' }}/>
      <div style={{ position: 'absolute', top: 26, left: 0, right: 0, textAlign: 'center', padding: '0 16px' }}>
        <div style={{ fontSize: 'clamp(30px,5vw,48px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#2E2E2E', lineHeight: 1 }}>Sofia Reyes</div>
        <div style={{ fontSize: 13, color: '#6B6560', fontFamily: 'var(--font-sans)', marginTop: 8 }}>An exhibition — things I made because I couldn&rsquo;t not.</div>
      </div>
      <div className="bio-ew-card" style={{ ['--bio-rot' as never]: '-4deg', animationDelay: '0.1s', position: 'absolute', left: '7%', top: 150, background: '#FFFDF8', border: '1px solid rgba(46,46,46,0.14)', borderRadius: 8, padding: '10px 13px', boxShadow: '0 6px 18px rgba(0,0,0,0.10)', width: 168 }}>
        <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.1em' }}>EXHIBIT 01 · CODE</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2E2E2E', fontFamily: 'Georgia, serif', marginTop: 3, lineHeight: 1.1 }}>Reuse Map</div>
        <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 4, lineHeight: 1.4 }}>A map of where my town wastes water. 400 students used it.</div>
      </div>
      <div className="bio-ew-card" style={{ ['--bio-rot' as never]: '3deg', animationDelay: '0.28s', position: 'absolute', right: '8%', top: 132, background: '#FFFDF8', border: '1px solid rgba(46,46,46,0.14)', borderRadius: 8, padding: '10px 13px', boxShadow: '0 6px 18px rgba(0,0,0,0.10)', width: 150 }}>
        <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.1em' }}>EXHIBIT 02 · DESIGN</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2E2E2E', fontFamily: 'Georgia, serif', marginTop: 3, lineHeight: 1.1 }}>Field Type</div>
        <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 4, lineHeight: 1.4 }}>A typeface drawn from soil samples.</div>
      </div>
      <div className="bio-ew-card" style={{ ['--bio-rot' as never]: '-1.5deg', animationDelay: '0.46s', position: 'absolute', left: '34%', bottom: 26, background: '#FFFDF8', border: '1px solid rgba(46,46,46,0.14)', borderRadius: 8, padding: '10px 13px', boxShadow: '0 6px 18px rgba(0,0,0,0.10)', width: 158 }}>
        <div style={{ fontSize: 8.5, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.1em' }}>EXHIBIT 03 · WRITING</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#2E2E2E', fontFamily: 'Georgia, serif', marginTop: 3, lineHeight: 1.1 }}>Zine, Vol. 2</div>
        <div style={{ fontSize: 10.5, color: '#6B6560', marginTop: 4, lineHeight: 1.4 }}>Self-published, 60 copies sold.</div>
      </div>
      <div className="bio-ew-curator" style={{ position: 'absolute', right: 22, bottom: 22, background: '#F0E9D8', border: '1px solid #B5614E40', borderRadius: 5, padding: '7px 10px', transform: 'rotate(-2deg)', maxWidth: 150 }}>
        <div style={{ fontSize: 8, fontFamily: 'monospace', color: '#B5614E', letterSpacing: '0.08em' }}>CURATOR&rsquo;S NOTE</div>
        <div style={{ fontSize: 11, fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#2E2E2E', marginTop: 2, lineHeight: 1.3 }}>Different mediums, one curiosity.</div>
      </div>
    </div>
  )
}

/* ── Immersive loading overlay (reusable) ── */
const GEN_STEPS = ['Writing portfolio story', 'Designing page', 'Reviewing layout', 'Preparing preview']
const GEN_TIMINGS = [0, 30000, 110000, 320000]
const REFINE_STEPS = ['Reading your edit', 'Redrawing the page', 'Polishing details']
const REFINE_TIMINGS = [0, 20000, 60000]

function BioLoadingOverlay({ mode }: { mode: 'generate' | 'refine' }) {
  const steps = mode === 'generate' ? GEN_STEPS : REFINE_STEPS
  const timings = mode === 'generate' ? GEN_TIMINGS : REFINE_TIMINGS
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timers = timings.map((t, i) =>
      i === 0 ? null : setTimeout(() => setActive(i), t),
    )
    return () => { timers.forEach(t => t && clearTimeout(t)) }
  }, [timings])

  return (
    <div className="bio-ov-root" role="status" aria-live="polite"
      aria-label={mode === 'generate' ? 'Generating your bio site' : 'Applying your edit'}>
      <div className="bio-ov-scrim"/>
      <div className="bio-ov-card">
        {/* animated hand-drawn composition */}
        <div className="bio-ov-stage" aria-hidden="true">
          <svg viewBox="0 0 240 120" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <line x1="22" y1="100" x2="22" y2="20" stroke={C.ink} strokeWidth="1.4" strokeOpacity="0.5" strokeLinecap="round"/>
            <line x1="22" y1="100" x2="218" y2="100" stroke={C.ink} strokeWidth="1.4" strokeOpacity="0.5" strokeLinecap="round"/>
            <path className="bio-ov-trace" pathLength={100} d="M26 92 Q90 86 130 56 T214 24"
              stroke={C.gold} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
            <circle className="bio-ov-dot" style={{ animationDelay: '0.2s' }} cx="90" cy="74" r="3.4" fill={C.teal}/>
            <circle className="bio-ov-dot" style={{ animationDelay: '0.6s' }} cx="134" cy="52" r="3.4" fill={C.teal}/>
            <circle className="bio-ov-dot" style={{ animationDelay: '1s' }} cx="206" cy="28" r="3.8" fill="#7A3B35"/>
          </svg>
          <div className="bio-ov-chip bio-ov-chip-a">Story</div>
          <div className="bio-ov-chip bio-ov-chip-b">Layout</div>
          <div className="bio-ov-chip bio-ov-chip-c" style={{ ['--bio-rot' as never]: '4deg' }}>note ✎</div>
        </div>

        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: C.inkStrong, fontWeight: 600, marginTop: 18 }}>
          {mode === 'generate' ? 'Designing your portfolio' : 'Applying your edit'}
        </h3>
        <p style={{ fontSize: 13, color: C.inkMuted, marginTop: 6, lineHeight: 1.5, maxWidth: 360 }}>
          {mode === 'generate'
            ? <>Generation may take 5–10 minutes. We&rsquo;re writing your story, designing your page, and reviewing the final result. You can keep this tab open and wait.</>
            : <>This may take 1–3 minutes. We&rsquo;re rereading your page and redrawing the parts you changed.</>}
        </p>

        <div className="bio-ov-steps">
          {steps.map((label, i) => {
            const state = i < active ? 'done' : i === active ? 'active' : 'todo'
            return (
              <div key={label} className="bio-ov-step" data-state={state}>
                <span className="bio-ov-bullet">
                  {state === 'done'
                    ? <Check size={12} strokeWidth={3}/>
                    : state === 'active'
                      ? <Loader2 size={12} className="animate-spin"/>
                      : <span className="bio-ov-pip"/>}
                </span>
                <span>{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const STYLE_QUESTIONS: Record<BioStyle, string> = {
  proof_board: 'What are you trying to prove through your work?',
  field_notes: 'What central question do you keep returning to?',
  exhibit_wall: 'What\'s the theme of your exhibition — what connects all your work?',
}

const labelStyle = {
  fontSize: 11, fontWeight: 600 as const, textTransform: 'uppercase' as const,
  letterSpacing: '0.05em', color: C.inkFaint, fontFamily: 'var(--font-sans)',
  display: 'block' as const, marginBottom: 6,
}

const inputStyle = {
  width: '100%', background: C.bgSoft, border: `1px solid ${C.border}`,
  color: C.ink, fontSize: 13, borderRadius: 10, padding: '9px 12px',
  outline: 'none', fontFamily: 'var(--font-sans)',
} as const

/* ── Inline edit helpers ── */
const EDIT_CSS = `
/* Edit mode runs no page scripts, so force all content visible (JS-gated
   reveals would otherwise hide text) and freeze entrance animations. */
body, body *{ opacity:1 !important; visibility:visible !important; animation:none !important; transition:none !important; transform:none !important; }
[data-bio-editable]{ outline:1px dashed transparent; outline-offset:3px; border-radius:3px; cursor:text; }
[data-bio-editable]:hover{ outline-color:rgba(50,143,134,.65); background-color:rgba(50,143,134,.06); }
[data-bio-editable]:focus{ outline:2px solid #328F86; outline-offset:3px; background-color:rgba(50,143,134,.10); }
`

// Serialize the live edit document back to clean HTML, stripping the
// editing-only attributes and injected style so stored HTML stays pristine.
function serializeClean(doc: Document): string {
  const clone = doc.documentElement.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-bio-editable]').forEach(el => {
    el.removeAttribute('contenteditable')
    el.removeAttribute('data-bio-editable')
    el.removeAttribute('spellcheck')
  })
  clone.querySelector('#bio-edit-style')?.remove()
  return '<!DOCTYPE html>\n' + clone.outerHTML
}

// Visible text length only — strips script/style CONTENT and tags. Used to
// compare two HTML strings on the same basis (the old guard compared full-HTML
// tag-strip, which counts inline CSS/JS as "text", against body innerText —
// inconsistent, so it silently rejected valid edits on script-heavy pages).
function visibleLen(html: string): number {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

// Shown for wording-only requests — mirrors the server's no_change message.
const TEXT_ONLY_MSG = 'That looks like a wording change. Click the text in the preview and edit it directly — it’s instant and free. Use AI refine for visual or layout changes.'

// Any hint of a visual/layout change → NOT text-only (let the server classifier
// decide). Covers EN + common CJK terms for color/size/weight/spacing/motion/layout.
const VISUAL_HINTS = /(colou?r|warm|cool|bold|weight|font|size|big|small|large|spac|margin|pad|shadow|border|animat|curve|motif|hero|layout|move|reorder|section|background|gradient|style|design|rotate|align|red|blue|green|gold|teal|dark|light|bright|色|加粗|字体|字号|间距|动画|曲线|布局|移动|排版|背景|样式|设计|更大|更小|加大|缩小|变大|变小|大一点|小一点|颜色|对齐)/i

// Clear "change this text to that" phrasings (EN + CJK).
const TEXT_CHANGE = /(改成|改为|换成|改名|重命名|更名|标题改|名字改|措辞|错别字|rename|reword|re-?word|typo|spelling|spell|capitali[sz]|change .+ to |replace .+ with |rewrite the (title|heading|name|text)|fix the (wording|text|spelling))/i

// Conservative client-side detector: only true when clearly a wording change and
// free of any visual/layout cue. Lets us answer instantly with zero AI cost.
function looksTextOnly(instruction: string): boolean {
  if (VISUAL_HINTS.test(instruction)) return false
  return TEXT_CHANGE.test(instruction)
}

export default function BioClient({ profileName, resumeItems, hasResume, prefillGoal, existingSlug, existingHtml, existingStyle }: Props) {
  const { toast } = useToast()

  const initialStep: BioStep = existingSlug ? 'published' : existingHtml ? 'preview' : 'select'
  const [step, setStep] = useState<BioStep>(initialStep)
  const [style, setStyle] = useState<BioStyle | null>(existingStyle)
  const [peek, setPeek] = useState<BioStyle | null>(null)
  const [questionnaire, setQuestionnaire] = useState({
    tagline: '', highlights: [] as string[], goal: prefillGoal, styleSpecific: '',
  })
  const [html, setHtml] = useState<string | null>(existingHtml)
  const [score, setScore] = useState<number | null>(null)
  const [metrics, setMetrics] = useState<BioMetrics | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatLog, setChatLog] = useState<{ id: number; text: string; status: 'applying' | 'done' | 'error' | 'info'; note?: string }[]>([])
  const [slug, setSlug] = useState<string | null>(existingSlug)
  const [generating, setGenerating] = useState(false)
  const [refining, setRefining] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Bottom editor panel
  const [panelTab, setPanelTab] = useState<'refine' | 'edit'>('refine')
  const [editSrcDoc, setEditSrcDoc] = useState<string | null>(null)
  const [inlineEdits, setInlineEdits] = useState(0)
  const [inlineDirty, setInlineDirty] = useState(false)
  const editDocRef = useRef<Document | null>(null)

  // Version history
  const [showHistory, setShowHistory] = useState(false)
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  const [historyKey, setHistoryKey] = useState(0)  // bump to force the drawer to reload

  // Quota
  const [quota, setQuota] = useState<QuotaState | null>(null)

  // Persist the refine log across page refreshes (per browser). Loaded after
  // mount (localStorage isn't available during SSR); any interrupted "applying"
  // entry is restored as an error so it doesn't spin forever.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bio-refine-log')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setChatLog(parsed.map((e: { status: string }) => (e.status === 'applying' ? { ...e, status: 'error' } : e)) as typeof chatLog)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('bio-refine-log', JSON.stringify(chatLog)) } catch { /* ignore */ }
  }, [chatLog])

  // Fetch quota on mount and after each generate/refine to keep counts fresh.
  function refreshQuota() {
    fetch('/api/bio/quota').then(r => r.ok ? r.json() : null).then(q => { if (q) setQuota(q) }).catch(() => {})
  }
  useEffect(() => { refreshQuota() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedStyleDef = STYLES.find(s => s.id === style)
  const shownStyle = peek ?? style ?? 'proof_board'
  const shownDef = STYLES.find(s => s.id === shownStyle)!

  function persistDraft(nextHtml: string) {
    fetch('/api/bio/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: nextHtml, style, published: !!slug }),
    }).catch(() => {/* silent */})
  }

  async function generate() {
    if (!style) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/bio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style, questionnaire }),
      })
      let data: Record<string, unknown>
      try { data = await res.json() } catch {
        setError('Generation failed (server error). Please try again in a moment.')
        return
      }
      if (!res.ok) { setError((data.error as string) ?? 'Generation failed. Please try again.'); return }
      setHtml(data.html as string)
      setScore((data.score as number) ?? null)
      setMetrics((data.metrics as BioMetrics) ?? null)
      setStep('preview')
      setPanelTab('refine')
      setChatLog([])  // fresh page → start a new refine log
      refreshQuota()
      // Auto-save draft so navigating away doesn't lose the work
      fetch('/api/bio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: data.html, style, published: false }),
      }).catch(() => {/* silent */})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function refine(opts?: { preset?: string; label?: string }) {
    if (!html || refining) return
    const preset = opts?.preset
    const instruction = preset ? (opts?.label ?? preset) : chatInput.trim()
    if (!instruction) return
    const id = chatLog.length + 1

    // Instant client-side short-circuit for obvious wording changes — no AI call,
    // no network round-trip, no cost. Anything ambiguous still goes to the server.
    if (!preset && looksTextOnly(instruction)) {
      setChatLog(prev => [...prev, { id, text: instruction, status: 'info', note: TEXT_ONLY_MSG }])
      setChatInput('')
      toast('No AI needed — click the text in the preview to edit it directly.', 'info')
      return
    }

    setChatLog(prev => [...prev, { id, text: instruction, status: 'applying' }])
    if (!preset) setChatInput('')
    setRefining(true)
    const mark = (status: 'done' | 'error' | 'info', note?: string) =>
      setChatLog(prev => prev.map(e => (e.id === id ? { ...e, status, note } : e)))
    try {
      const res = await fetch('/api/bio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style, questionnaire,
          refine_instruction: instruction,
          existing_html: html,
          ...(preset ? { preset } : {}),
        }),
      })
      let data: Record<string, unknown>
      try { data = await res.json() } catch {
        mark('error', 'Server error. Please try again.')
        toast('Refinement failed — server error', 'error')
        return
      }
      if (res.ok && data.no_change) {
        // Text-only request — server intentionally didn't touch the page.
        mark('info', data.message as string)
        toast('No AI needed — click the text in the preview to edit it directly.', 'info')
      } else if (res.ok) {
        setHtml(data.html as string)
        if (data.metrics) setMetrics(data.metrics as BioMetrics)
        mark('done')
        persistDraft(data.html as string)
        setHistoryKey(k => k + 1)
        refreshQuota()
      } else {
        mark('error', data.error as string)
        toast((data.error as string) ?? 'Refinement failed', 'error')
      }
    } catch {
      mark('error')
      toast('Refinement failed', 'error')
    } finally {
      setRefining(false)
    }
  }

  // Style-specific refine presets — cheaper/safer than free-form refine.
  const REFINE_PRESETS: { key: string; label: string; styles: BioStyle[] }[] = [
    { key: 'stronger_curve', label: 'Stronger proof curve', styles: ['proof_board'] },
    { key: 'more_handdrawn', label: 'More hand-drawn',       styles: ['proof_board'] },
    { key: 'warmer',         label: 'Warmer',                styles: ['proof_board', 'field_notes', 'exhibit_wall'] },
    { key: 'bolder',         label: 'More bold',             styles: ['proof_board', 'field_notes', 'exhibit_wall'] },
    { key: 'more_animated',  label: 'More animated',         styles: ['proof_board', 'field_notes', 'exhibit_wall'] },
  ]

  function openEditMode() {
    if (!html) return
    setEditSrcDoc(html)        // stable srcDoc for the edit iframe (raw, no base styles)
    setInlineEdits(0)
    setInlineDirty(false)
    setPanelTab('edit')
  }

  // Serialize the live edit document, guarding against a serialization hiccup
  // that would drop most of the content. Returns the cleaned HTML, or null if
  // there's no edit doc / the result looks broken (caller keeps prior HTML).
  // NOTE: compares visible text on the SAME basis for prev and next — this is
  // the fix for the persistence bug (the old guard compared full-HTML tag-strip
  // vs body innerText, so it rejected valid edits on script-heavy pages).
  function captureInlineHtml(): string | null {
    const doc = editDocRef.current
    if (!doc) return null
    try {
      const next = serializeClean(doc)
      const prevText = visibleLen(html ?? '')
      const nextText = visibleLen(next)
      if (next.length < 200) return null
      if (prevText > 0 && nextText < prevText * 0.5) return null
      return next
    } catch {
      return null
    }
  }

  // Sync the live edited document back into React state (and the draft).
  // Updates `html` only — NOT `editSrcDoc` — so the edit iframe never reloads
  // and the caret is preserved while typing.
  function syncFromInline() {
    const next = captureInlineHtml()
    if (next === null) return
    if (next === html) { setInlineDirty(false); return }
    setHtml(next)
    setInlineEdits(n => n + 1)
    setInlineDirty(false)
    persistDraft(next)
  }

  // Runs on the edit iframe's load: make text nodes editable + wire sync.
  function setupInlineEditing(ev: React.SyntheticEvent<HTMLIFrameElement>) {
    let doc: Document | null = null
    try { doc = ev.currentTarget.contentDocument } catch { doc = null }
    if (!doc || !doc.body) return
    editDocRef.current = doc

    const style = doc.createElement('style')
    style.id = 'bio-edit-style'
    style.textContent = EDIT_CSS
    doc.head?.appendChild(style)

    const mark = (el: Element) => {
      if (el.closest('[data-bio-editable]')) return
      const txt = (el.textContent || '').trim()
      if (txt.length < 1 || !/[A-Za-z0-9]/.test(txt)) return
      el.setAttribute('contenteditable', 'true')
      el.setAttribute('data-bio-editable', '')
      el.setAttribute('spellcheck', 'false')
    }
    // Block text elements first (parents), then leaf inline-only elements.
    doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption').forEach(mark)
    doc.body.querySelectorAll('span,a,strong,em,div').forEach(el => { if (el.children.length === 0) mark(el) })

    let t: ReturnType<typeof setTimeout> | null = null
    doc.addEventListener('input', () => {
      setInlineDirty(true)            // pending edit not yet in React state
      if (t) clearTimeout(t)
      t = setTimeout(syncFromInline, 500)
    })
    doc.addEventListener('blur', () => syncFromInline(), true)

    // The edit iframe runs no page scripts, so handle anchor clicks here:
    // hash links scroll within the iframe; everything else is disabled so a
    // stray link can't blank the editor or change the builder route.
    doc.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null
      const a = target?.closest?.('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (href === null) return
      if (href.charAt(0) === '#') {
        e.preventDefault()
        const id = href.slice(1)
        const el = id ? doc!.getElementById(id) : null
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else {
        e.preventDefault()
      }
    }, true)
  }

  async function publish() {
    // Always pull the latest live DOM from the edit iframe first, so a pending
    // (un-debounced) inline edit can never be lost at publish time. Fall back to
    // current React state if there's no edit doc or capture looks broken.
    const latest = captureInlineHtml() ?? html
    if (!latest) return
    if (latest !== html) setHtml(latest)
    setInlineDirty(false)
    setPublishing(true)
    try {
      const res = await fetch('/api/bio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: latest, style, snapshot: true }),
      })
      const data = await res.json()
      if (res.ok) { setSlug(data.slug); setStep('published'); setHistoryKey(k => k + 1); toast('Bio site published!') }
      else toast(data.error ?? 'Failed to publish', 'error')
    } finally {
      setPublishing(false)
    }
  }

  // Save the current page to version history without publishing (a draft snapshot).
  async function saveSnapshot() {
    const latest = captureInlineHtml() ?? html
    if (!latest) return
    if (latest !== html) setHtml(latest)
    setInlineDirty(false)
    setSavingSnapshot(true)
    try {
      const res = await fetch('/api/bio/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: latest, style, published: false, snapshot: true }),
      })
      const data = await res.json()
      if (res.ok) { setHistoryKey(k => k + 1); toast('Saved to version history') }
      else toast(data.error ?? 'Could not save', 'error')
    } catch {
      toast('Could not save', 'error')
    } finally {
      setSavingSnapshot(false)
    }
  }

  // Load a restored version into the builder as the current working copy. Does
  // not touch the live page — the user reviews then clicks Publish.
  function restoreVersion(restoredHtml: string, restoredStyle: string | null, _versionNo: number) {
    setHtml(restoredHtml)
    if (restoredStyle === 'proof_board' || restoredStyle === 'field_notes' || restoredStyle === 'exhibit_wall') {
      setStyle(restoredStyle)
    }
    setEditSrcDoc(null)
    setInlineEdits(0)
    setInlineDirty(false)
    setPanelTab('refine')
    setStep('preview')
    // If this page isn't published yet, keep the working draft saved so it
    // survives a reload. If it IS published, leave the live page untouched until
    // the user explicitly publishes the restored version.
    if (!slug) persistDraft(restoredHtml)
  }

  async function unpublish() {
    setUnpublishing(true)
    try {
      await fetch('/api/bio/publish', { method: 'DELETE' })
      setSlug(null)
      setStep('preview')
      toast('Bio site taken offline')
    } finally {
      setUnpublishing(false)
    }
  }

  function copyLink() {
    if (!slug) return
    navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleHighlight(title: string) {
    setQuestionnaire(prev => ({
      ...prev,
      highlights: prev.highlights.includes(title)
        ? prev.highlights.filter(h => h !== title)
        : prev.highlights.length < 2
          ? [...prev.highlights, title]
          : prev.highlights,
    }))
  }

  const editMode = step === 'preview' && panelTab === 'edit'

  return (
    <div style={{ color: C.ink }}>
      {(generating || refining) && <BioLoadingOverlay mode={generating ? 'generate' : 'refine'}/>}

      <HistoryDrawer key={historyKey} open={showHistory} onClose={() => setShowHistory(false)} onRestore={restoreVersion}/>


      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.4rem,2vw,1.8rem)', color: C.inkStrong, fontWeight: 600, lineHeight: 1.2 }}>
            Bio Website
          </h1>
          <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
            Generate a personal portfolio page for your college applications.
          </p>
        </div>
        {step === 'preview' && (
          <div className="flex gap-2">
            <button onClick={() => { setHistoryKey(k => k + 1); setShowHistory(true) }} disabled={generating || refining}
              className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 transition-all disabled:opacity-50"
              style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
              <History size={13}/> History
            </button>
            <button onClick={() => setStep('questionnaire')} disabled={generating || refining}
              className="flex items-center gap-1.5 text-sm rounded-xl px-3 py-2 transition-all disabled:opacity-50"
              style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
              <RefreshCw size={13}/> Regenerate
            </button>
            <button onClick={publish} disabled={publishing || refining}
              className="flex items-center gap-2 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-50"
              style={{ background: C.teal, color: 'white' }}>
              {publishing ? <Loader2 size={13} className="animate-spin"/> : <Globe size={13}/>}
              Publish
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm flex items-start gap-2"
          style={{ background: '#F5DDD9', border: `1px solid ${C.danger}40`, color: C.danger }}>
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5"/>
          <span>{error} <button onClick={generate} className="underline font-semibold">Retry</button></span>
        </div>
      )}

      {!hasResume && (step === 'select' || step === 'questionnaire') && (
        <div className="rounded-xl px-4 py-3 mb-5 text-sm flex items-start gap-2"
          style={{ background: C.paleGold, border: `1px solid ${C.gold}50`, color: C.inkStrong }}>
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" style={{ color: C.gold }}/>
          <span>
            We don&rsquo;t see resume data on your profile yet. Generation will lean on your name, major, and the answers below — but the page will be much stronger if you{' '}
            <a href="/resume" className="underline font-semibold">upload your resume</a> first.
          </span>
        </div>
      )}

      {/* ── Paywall banner for free users ── */}
      {quota?.tier === 'free' && (
        <div className="rounded-2xl p-5 mb-5"
          style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(38,63,73,0.07)' }}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: C.paleTeal, border: `1px solid ${C.teal}30` }}>
              <Lock size={16} style={{ color: C.teal }}/>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: C.inkStrong }}>Bio Website is a paid feature</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: C.inkMuted }}>
                Get a fully-designed personal portfolio page — no templates, no drag-and-drop. Choose a style, answer a few questions, and get a hand-crafted page in minutes.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  onClick={async () => {
                    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ period: 'bio_onetime' }) })
                    const data = await res.json()
                    if (data.url) window.location.href = data.url
                  }}
                  className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 font-semibold transition-all"
                  style={{ background: C.teal, color: 'white' }}>
                  <Zap size={13}/> Bio Website — $15 one-time
                </button>
                <a href="/settings"
                  className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 font-semibold transition-all"
                  style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                  Pro plan — 5 generations/month
                </a>
              </div>
              <p className="text-xs mt-2.5" style={{ color: C.inkFaint }}>
                Bio purchase: 3 pages total · 5 AI refines.&ensp;Pro: 5 pages/month · 15 AI refines/month. Publish, edit, and restore history are unlimited on both.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Quota remaining banner for paid users ── */}
      {quota && quota.tier !== 'free' && quota.tier !== 'admin' && (step === 'select' || step === 'questionnaire') && (
        <div className="rounded-xl px-3.5 py-2.5 mb-4 flex items-center gap-2 text-xs"
          style={{ background: C.bgSoft, border: `1px solid ${C.border}`, color: C.inkFaint }}>
          <Zap size={12} style={{ color: C.teal, flexShrink: 0 }}/>
          <span>
            <span style={{ color: C.inkStrong, fontWeight: 500 }}>
              {quota.generates_limit - quota.generates_used} generation{quota.generates_limit - quota.generates_used !== 1 ? 's' : ''}{' '}
              · {quota.refines_limit - quota.refines_used} AI refine{quota.refines_limit - quota.refines_used !== 1 ? 's' : ''}
            </span>
            {' '}remaining{quota.is_monthly ? ' this month' : ' total'}
          </span>
        </div>
      )}

      {/* ── Step: Select Style ── */}
      {step === 'select' && (
        <div className="space-y-5">
          <p className="text-sm" style={{ color: C.inkMuted }}>
            Three premium directions for your homepage. Hover to preview, click to choose — this is what your first screen will feel like.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Large featured preview */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, boxShadow: '0 6px 30px rgba(38,63,73,0.12)' }}>
                <BigPreview id={shownStyle}/>
              </div>
              <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: shownDef.pale, color: shownDef.color, border: `1px solid ${shownDef.color}40` }}>{shownDef.label}</span>
                <span className="text-sm font-medium" style={{ color: C.inkStrong }}>{shownDef.sampleName}</span>
                <span className="text-xs" style={{ color: C.inkFaint }}>· {shownDef.sampleRole}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: C.inkMuted, fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>&ldquo;{shownDef.hero}&rdquo;</p>
            </div>

            {/* Selectable alternates */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              {STYLES.map(s => {
                const selected = style === s.id
                return (
                  <button key={s.id}
                    onClick={() => setStyle(s.id)}
                    onMouseEnter={() => setPeek(s.id)}
                    onMouseLeave={() => setPeek(null)}
                    onFocus={() => setPeek(s.id)}
                    onBlur={() => setPeek(null)}
                    className="bio-pick text-left rounded-2xl p-3 transition-all flex gap-3 items-stretch"
                    style={{
                      background: selected ? s.pale : C.card,
                      border: `${selected ? '2px' : '1px'} solid ${selected ? s.color : C.border}`,
                      boxShadow: selected ? `0 0 0 3px ${s.color}22` : '0 1px 8px rgba(38,63,73,0.05)',
                    }}>
                    <div style={{ width: 132, flexShrink: 0 }}>{s.demo}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm truncate" style={{ color: C.inkStrong }}>{s.label}</p>
                        {selected && <Check size={14} style={{ color: s.color }} strokeWidth={3}/>}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: s.color, fontWeight: 500 }}>{s.sub}</p>
                      <p className="text-xs mt-1.5 leading-snug" style={{ color: C.inkMuted }}>{s.fits}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={() => style && setStep('questionnaire')}
              disabled={!style || quota?.tier === 'free'}
              title={quota?.tier === 'free' ? 'Unlock Bio Website to continue' : undefined}
              className="flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 font-semibold transition-all disabled:opacity-40"
              style={{ background: C.teal, color: 'white' }}>
              {quota?.tier === 'free' ? <><Lock size={13}/> Unlock to continue</> : <>Continue with {selectedStyleDef?.label ?? 'a style'} <ChevronRight size={15}/></>}
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Questionnaire ── */}
      {step === 'questionnaire' && style && (
        <div className="space-y-5 max-w-2xl">
          <button onClick={() => setStep('select')} className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: C.inkFaint }}>
            <ChevronLeft size={14}/> Change style
          </button>

          <div className="rounded-2xl p-6 space-y-5"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 10px rgba(38,63,73,0.06)' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: selectedStyleDef?.pale, border: `1px solid ${selectedStyleDef?.color}30` }}>
                <Globe size={14} style={{ color: selectedStyleDef?.color }}/>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: C.inkStrong }}>{selectedStyleDef?.label}</p>
                <p className="text-xs" style={{ color: C.inkMuted }}>Answer what you can — skip the rest and AI fills it in.</p>
              </div>
            </div>

            <div>
              <label style={labelStyle}>{STYLE_QUESTIONS[style]}</label>
              <input type="text" value={questionnaire.styleSpecific}
                onChange={e => setQuestionnaire(p => ({ ...p, styleSpecific: e.target.value }))}
                placeholder="Leave blank → AI writes it from your data"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>

            <div>
              <label style={labelStyle}>Your tagline — one punchy sentence</label>
              <input type="text" value={questionnaire.tagline}
                onChange={e => setQuestionnaire(p => ({ ...p, tagline: e.target.value }))}
                placeholder="Leave blank → AI writes it"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>

            {resumeItems.length > 0 && (
              <div>
                <label style={labelStyle}>Feature highlights (up to 2 — these get full treatment)</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {resumeItems.map(item => {
                    const selected = questionnaire.highlights.includes(item.title)
                    const maxed = questionnaire.highlights.length >= 2 && !selected
                    return (
                      <button key={item.title} onClick={() => !maxed && toggleHighlight(item.title)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{
                          background: selected ? C.paleTeal : C.bgSoft,
                          color: selected ? C.teal : maxed ? C.inkFaint : C.inkMuted,
                          border: `1px solid ${selected ? C.teal + '50' : C.border}`,
                          opacity: maxed ? 0.5 : 1,
                          cursor: maxed ? 'not-allowed' : 'pointer',
                        }}>
                        {item.title}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs mt-1.5" style={{ color: C.inkFaint }}>Leave blank → AI picks the most impactful</p>
              </div>
            )}

            <div>
              <label style={labelStyle}>Future goal / what you&rsquo;re applying for</label>
              <input type="text" value={questionnaire.goal}
                onChange={e => setQuestionnaire(p => ({ ...p, goal: e.target.value }))}
                placeholder="e.g. Study CS + build tools for education access"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs" style={{ color: C.inkFaint }}>Generation takes about 5–10 minutes. You can leave the tab open.</p>
            <button onClick={generate}
              disabled={generating || !quota?.can_generate || quota?.is_locked}
              title={!quota?.can_generate ? 'Generation limit reached' : quota?.is_locked ? 'A job is already running' : undefined}
              className="flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 font-semibold transition-all disabled:opacity-50"
              style={{ background: C.teal, color: 'white' }}>
              Generate <ChevronRight size={15}/>
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Preview ── */}
      {step === 'preview' && html && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: C.inkFaint }}>
            {score !== null && (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: score >= 85 ? C.success : C.gold }}/>
                Quality {score}/100 {score >= 85 ? '— looks great' : '— repairs applied'}
              </span>
            )}
          </div>

          {/* iframe preview */}
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}`, boxShadow: '0 4px 24px rgba(38,63,73,0.10)', position: 'relative' }}>
            <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
              <div className="flex gap-1.5">
                {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }}/>)}
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs px-3 py-0.5 rounded inline-flex items-center gap-1.5"
                  style={{ background: editMode ? C.paleTeal : C.card, color: editMode ? C.teal : C.inkFaint, border: `1px solid ${editMode ? C.teal + '50' : C.border}` }}>
                  {editMode ? <><MousePointerClick size={11}/> Editing — click any text to change it</> : 'Preview — exactly what visitors see'}
                </span>
              </div>
            </div>
            {!editMode && (
              <div className="px-4 py-1.5 text-center" style={{ background: C.bgSoft, borderBottom: `1px solid ${C.border}` }}>
                <span className="text-xs inline-flex items-center gap-1.5" style={{ color: C.inkFaint }}>
                  <Lock size={10}/> Published pages run no JavaScript for security — all animation is CSS-based and looks identical here.
                </span>
              </div>
            )}
            {editMode ? (
              <iframe
                key="edit"
                srcDoc={editSrcDoc ?? html}
                onLoad={setupInlineEditing}
                style={{ width: '100%', height: 600, border: 'none', display: 'block', background: '#fff' }}
                sandbox="allow-same-origin"
                title="Bio page editor"
              />
            ) : (
              <iframe
                key="view"
                srcDoc={previewSrcDoc(html)}
                style={{ width: '100%', height: 600, border: 'none', display: 'block' }}
                sandbox="allow-scripts"
                title="Bio page preview"
              />
            )}
          </div>

          {/* Editor panel — tabs: Quick edit / Refine with AI */}
          <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-1 px-3 pt-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={() => setPanelTab('refine')}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-t-lg transition-all"
                style={{ color: panelTab === 'refine' ? C.teal : C.inkMuted, borderBottom: `2px solid ${panelTab === 'refine' ? C.teal : 'transparent'}`, marginBottom: -1 }}>
                <Wand2 size={13}/> Refine with AI
              </button>
              <button
                onClick={openEditMode}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-t-lg transition-all"
                style={{ color: panelTab === 'edit' ? C.teal : C.inkMuted, borderBottom: `2px solid ${panelTab === 'edit' ? C.teal : 'transparent'}`, marginBottom: -1 }}>
                <PenLine size={13}/> Quick edit text
              </button>
            </div>

            {/* Tab: AI refine */}
            {panelTab === 'refine' && (
              <>
                {chatLog.length > 0 && (
                  <div className="px-4 py-3 space-y-3" style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {chatLog.map(m => (
                      <div key={m.id} className="flex flex-col items-end gap-1">
                        <div className="text-sm px-3 py-2 max-w-[85%]"
                          style={{ background: C.paleTeal, color: C.ink, borderRadius: '14px 14px 4px 14px' }}>
                          {m.text}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs pr-1"
                          style={{ color: m.status === 'error' ? C.danger : m.status === 'done' ? C.success : C.inkFaint }}>
                          {m.status === 'applying' && <><Loader2 size={11} className="animate-spin"/> Applying change…</>}
                          {m.status === 'done' && <><Check size={11}/> Applied</>}
                          {m.status === 'error' && <><AlertCircle size={11}/> Couldn&rsquo;t apply — try rephrasing</>}
                          {m.status === 'info' && <><MousePointerClick size={11}/> No change made</>}
                        </div>
                        {m.status === 'info' && m.note && (
                          <div className="text-xs px-3 py-2 max-w-[85%] self-start"
                            style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}`, borderRadius: '4px 14px 14px 14px' }}>
                            {m.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-4 py-3" style={{ borderTop: chatLog.length > 0 ? `1px solid ${C.border}` : 'none' }}>
                  <div className="flex gap-2">
                    <input type="text" value={chatInput} disabled={refining}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && refine()}
                      placeholder={refining ? 'Applying your last change…' : `e.g. "Make the hero bolder" · "Move AIME to the top"`}
                      style={{ ...inputStyle, flex: 1, opacity: refining ? 0.55 : 1, cursor: refining ? 'not-allowed' : 'text' }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.teal)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.border)}/>
                    <button onClick={() => refine()}
                      disabled={refining || !chatInput.trim() || (!quota?.can_expensive_refine && !quota?.can_css_tweak)}
                      title={!quota?.can_expensive_refine && !quota?.can_css_tweak ? 'Refine limit reached' : undefined}
                      className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 font-semibold transition-all disabled:opacity-40"
                      style={{ background: C.teal, color: 'white', flexShrink: 0 }}>
                      {refining ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
                      {refining ? 'Applying' : 'Send'}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <span className="text-xs mr-0.5" style={{ color: C.inkFaint }}>Quick styles:</span>
                    {REFINE_PRESETS.filter(p => !style || p.styles.includes(style)).map(p => {
                      // css_tweak presets: warmer / bolder / more_animated. motif presets: stronger_curve / more_handdrawn.
                      const isCss = p.key === 'warmer' || p.key === 'bolder' || p.key === 'more_animated'
                      const quotaBlocked = isCss ? !quota?.can_css_tweak : !quota?.can_expensive_refine
                      return (
                        <button key={p.key}
                          disabled={refining || quotaBlocked}
                          title={quotaBlocked ? (isCss ? 'CSS tweak limit reached' : 'AI refine limit reached') : undefined}
                          onClick={() => refine({ preset: p.key, label: p.label })}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all disabled:opacity-40"
                          style={{ background: C.paleTeal, color: C.teal, border: `1px solid ${C.teal}40` }}>
                          {p.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs mt-2" style={{ color: C.inkFaint }}>
                    AI refine is for broader visual &amp; layout changes (2–4 min). Quick styles above are faster and safer.
                    For wording, click the text in the preview and edit it directly.
                  </p>
                  {quota && quota.tier !== 'free' && quota.tier !== 'admin' && (
                    <p className="text-xs mt-1" style={{ color: C.inkFaint }}>
                      {quota.refines_limit - quota.refines_used} AI refine{quota.refines_limit - quota.refines_used !== 1 ? 's' : ''} · {quota.css_tweaks_limit - quota.css_tweaks_used} CSS tweaks remaining{quota.is_monthly ? ' this month' : ' total'}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Tab: Quick edit text — inline, directly on the preview */}
            {panelTab === 'edit' && (
              <div className="px-4 py-3">
                <div className="flex items-start gap-2.5 rounded-lg p-3" style={{ background: C.paleTeal, border: `1px solid ${C.teal}30` }}>
                  <MousePointerClick size={15} style={{ color: C.teal, flexShrink: 0, marginTop: 1 }}/>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: C.inkStrong }}>Click any text in the preview above to edit it.</p>
                    <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
                      Editable text outlines when you hover. Type to change wording — no AI call, no waiting. Animations pause while editing and resume in preview.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs flex items-center gap-1.5"
                    style={{ color: inlineDirty ? C.gold : inlineEdits > 0 ? C.success : C.inkFaint }}>
                    {inlineDirty
                      ? <><Loader2 size={12} className="animate-spin"/> Saving edits…</>
                      : inlineEdits > 0
                        ? <><Check size={12}/> Edits saved</>
                        : 'Changes save automatically as you type'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={saveSnapshot} disabled={savingSnapshot}
                      className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 font-semibold transition-all disabled:opacity-50"
                      style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                      {savingSnapshot ? <Loader2 size={12} className="animate-spin"/> : <Save size={12}/>}
                      Save to history
                    </button>
                    <button onClick={() => setPanelTab('refine')}
                      className="text-xs rounded-lg px-3 py-1.5 font-semibold transition-all"
                      style={{ background: C.teal, color: 'white' }}>
                      Done editing
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step: Published ── */}
      {step === 'published' && slug && (
        <div className="space-y-4">
          <div className="rounded-2xl p-6"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(38,63,73,0.07)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: '#D1EBE0', border: `1px solid ${C.success}30` }}>
                <Globe size={18} style={{ color: C.success }}/>
              </div>
              <div>
                <p className="font-semibold" style={{ color: C.inkStrong }}>Your bio site is live</p>
                <p className="text-xs" style={{ color: C.inkMuted }}>Share it with admissions officers</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 mb-4"
              style={{ background: C.bgSoft, border: `1px solid ${C.border}` }}>
              <span className="text-sm flex-1 truncate" style={{ color: C.inkMuted, fontFamily: 'monospace' }}>
                {typeof window !== 'undefined' ? window.location.origin : ''}/u/{slug}
              </span>
              <button onClick={copyLink}
                className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-all flex-shrink-0"
                style={{ background: copied ? '#D1EBE0' : C.card, color: copied ? C.success : C.inkMuted, border: `1px solid ${copied ? C.success + '50' : C.border}` }}>
                {copied ? <Check size={11}/> : <Copy size={11}/>}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <a href={`/u/${slug}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs rounded-lg px-2.5 py-1.5 transition-all"
                style={{ background: C.card, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                <ExternalLink size={11}/>
              </a>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('preview')}
                className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 transition-all"
                style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                <RefreshCw size={13}/> Edit & refine
              </button>
              <button onClick={() => { setHistoryKey(k => k + 1); setShowHistory(true) }}
                className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 transition-all"
                style={{ background: C.bgSoft, color: C.inkMuted, border: `1px solid ${C.border}` }}>
                <History size={13}/> History
              </button>
              <button onClick={unpublish} disabled={unpublishing}
                className="flex items-center gap-1.5 text-sm rounded-xl px-4 py-2 transition-all disabled:opacity-50"
                style={{ color: C.danger, border: `1px solid ${C.danger}30`, background: '#F5DDD9' }}>
                {unpublishing ? <Loader2 size={13} className="animate-spin"/> : <EyeOff size={13}/>}
                Take offline
              </button>
            </div>
          </div>

          {html && (
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
              <iframe srcDoc={previewSrcDoc(html)} style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
                sandbox="allow-scripts" title="Bio page"/>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
