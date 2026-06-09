import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ProxyAgent, fetch as undiciFetch } from 'undici'
import { saveBioVersion } from '@/lib/bioVersions'
import { ensureCompleteDocument } from '@/lib/bioRender'
import { getQuotaState, acquireJobLock, releaseJobLock, incrementUsage, type BioCredit } from '@/lib/bioQuota'
import { isAdminEmail } from '@/lib/admin'
import { sanitizeBioHtml } from '@/lib/bioSanitize'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined
const proxiedFetch = dispatcher
  ? (url: string, init?: RequestInit) => undiciFetch(url, { ...(init as any), dispatcher } as any) as any
  : undefined

/* ── Usage / cost tracking ──
   Prices are USD per 1,000,000 tokens. Update if Anthropic pricing changes. */
const PRICING: Record<string, { in: number; out: number }> = {
  'claude-sonnet-4-6': { in: 3, out: 15 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5 },
}

type Usage = { input_tokens?: number; output_tokens?: number }

function makeMeter() {
  let input = 0
  let output = 0
  let cost = 0
  return {
    add(model: string, usage: Usage | undefined) {
      const i = usage?.input_tokens ?? 0
      const o = usage?.output_tokens ?? 0
      input += i
      output += o
      const p = PRICING[model]
      if (p) cost += (i * p.in + o * p.out) / 1_000_000
    },
    metrics(startMs: number) {
      return {
        generation_duration_seconds: Math.round((Date.now() - startMs) / 100) / 10,
        token_cost: { input_tokens: input, output_tokens: output, total_tokens: input + output },
        estimated_cost_usd: Math.round(cost * 10000) / 10000,
      }
    },
  }
}

/* ── Validation helpers ── */

// Approximate visible text length: drop scripts/styles/tags, collapse space.
function visibleTextLength(html: string): number {
  if (!html) return 0
  const noCode = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
  return noCode.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
}

// A non-truncated document closes its body/html. Truncation (hitting the token
// cap mid-stream) is the regression that produced blank pages.
function looksTruncated(html: string): boolean {
  return !/<\/html\s*>/i.test(html) && !/<\/body\s*>/i.test(html)
}

// Returns a human-readable reason if the HTML is unusable, else null.
function validateBioHtml(html: string, name?: string): string | null {
  if (!html || html.length < 600) return 'The page came back empty.'
  if (looksTruncated(html)) return 'The page was cut off before it finished generating.'
  if (visibleTextLength(html) < 800) return 'The page has too little visible text.'
  if (name && name.trim().length > 1 && !html.includes(name.trim().split(/\s+/)[0])) {
    // hero name (at least the first name) should appear somewhere
    return 'The page is missing your name / hero content.'
  }
  return null
}

// Validate Agent 1 content JSON before spending tokens on HTML.
function validateContentJson(c: any): string | null {
  if (!c || typeof c !== 'object') return 'No content was produced.'
  if (!c.name || String(c.name).trim().length < 1) return 'Content is missing a name.'
  const hero = c.tagline || c.proof_statement || c.core_question || c.exhibition_title
    || (c.proof_labels && c.proof_labels.proof_statement)
  if (!hero || String(hero).trim().length < 2) return 'Content is missing a hero line / tagline.'
  const blocks =
    (Array.isArray(c.tier1) ? c.tier1.length : 0) +
    (Array.isArray(c.tier2) ? c.tier2.length : 0) +
    (Array.isArray(c.tier3) ? c.tier3.length : 0)
  if (blocks < 3) return 'Not enough resume content to build a page. Add or re-upload your resume, then try again.'
  return null
}

/* ── Style specifications injected into Agent 2 ── */

const PROOF_BOARD_SPEC = `
STYLE: Proof Board — a STEM student's living proof of growth. Confident, structured, hand-derived.

LAYOUT MODEL (full-bleed — NOT a narrow document):
- The page fills the FULL viewport width. Hero is min-height:100vh; every section is width:100% with its own background band edge-to-edge.
- ONLY text/content is constrained, via an inner wrapper: .wrap{max-width:1120px;margin:0 auto;padding:0 clamp(20px,5vw,80px)}. Prose paragraphs use max-width:64ch.
- Scale type and motifs UP on large screens with clamp(). Never wrap the whole page in a <900px centered container.

PALETTE (declare in :root and use everywhere — richer, higher contrast):
--bg:#F1E9D8; --bg-panel:#FBF6EA; --ink:#1A2735; --ink-soft:#44566A; --line:rgba(26,39,53,0.16);
--gold:#BC8638; --gold-soft:#E9CD86; --teal:#1C7B70; --teal-soft:#B6DfD8; --clay:#8C3C2E;
Body text is --ink (strong). Eyebrow labels are --teal or --clay. NEVER set body paragraphs in faint gray.

FONTS (load weights up to 700):
<link href="https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
- Display/name/section titles: "STIX Two Text" serif, weights 600-700
- Eyebrow labels / theorem headers / chips: "IBM Plex Mono" uppercase, letter-spacing .16em
- Body: "Inter" 400/500

TYPE SCALE (bold, confident):
- Hero name: STIX Two Text 700, clamp(3rem,8vw,6rem), line-height .95
- Section titles: STIX Two Text 600, clamp(1.9rem,3.6vw,3rem)
- Body: Inter 1.0625rem, line-height 1.65
- Eyebrow: IBM Plex Mono 600, .72rem, uppercase, --teal

SCRIPTLESS HAND-DRAWN CURVE (NO JavaScript — inline SVG + CSS only) — the curve MUST look hand-drawn, NOT a clean chart line:
- The published page runs ZERO JavaScript (no <script> at all, no rough.js, no canvas, no requestAnimationFrame). Draw the entire proof motif with INLINE SVG animated by CSS. A <script> tag will be stripped and the motif will vanish — so it must be pure SVG/CSS.
- HAND-DRAWN LOOK WITHOUT rough.js: give the SVG a wobble filter and apply it to the curve + axes:
  <filter id="rough"><feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"/></filter>
  Put filter="url(#rough)" on the curve path and the axes lines so straight strokes ripple like ink on paper. Use stroke-linecap="round" stroke-linejoin="round". Optionally add a faint SECOND offset copy of the curve path (translated 1-2px, lower opacity) for a redrawn-by-hand feel.
- Never draw the curve as a clean un-filtered smooth line — that reads as a default finance/dashboard chart and is REJECTED. The feTurbulence displacement is what makes it hand-derived.

HERO = THE SIGNATURE, and it MUST ANIMATE ON LOAD via CSS (this is the #1 requirement):
- Full-bleed coordinate field as backdrop/side panel: faint grid (≤8% opacity, CSS background or SVG lines), then BOLD X and Y axes as SVG lines with filter="url(#rough)" so they look slightly imperfect.
- Define the curve from a small array of plotted points (4-6 (x,y) pairs trending up) inside the SVG viewBox. Author the path's "d" through EXACTLY those coordinates, and place each evidence <circle> at those SAME coordinates — so every dot visibly sits ON the line, never floating above or below it. Do not eyeball dot positions.
- SELF-DRAWING CURVE (pure CSS): on the curve <path> set a stroke-dasharray equal to its length and animate stroke-dashoffset from that length → 0 with a CSS @keyframes that autoplays (~0.7s delay, ~1.5s duration) so it traces itself in. The axes can draw the same way (0-0.7s).
- PLOTTED POINTS (pure CSS): each evidence <circle> starts at scale 0 / opacity 0 and pops in via a CSS @keyframes with staggered animation-delay (after the curve, ~1.2s, 1.6s, 2.0s…), each with a tiny IBM Plex Mono label.
- Each label belongs to ONE point: anchor it right next to its dot (or join it with a short tick/leader line) and offset labels so they don't collide. A reader must tell which label goes with which point. Labels are tier1 titles (kept short).
- Hero name HUGE, with a dashed rectangle "stamp" around it (SVG rect with filter="url(#rough)" and stroke-dasharray) OR a hand underline that draws in via CSS.
- "PROOF OF GROWTH" eyebrow + first-person tagline (e.g. "I build ...").
- One ∎ proof mark and a "THEOREM 01" evidence card that rises in (CSS).
- Axis labels (x: practice/iterations, y: depth/impact).
- READABILITY: hero name/tagline sit on --bg or a --bg-panel chip — never directly over the dense grid at low contrast.
- The decorative SVG sits behind text (lower z-index) and has pointer-events:none.

ACCENT SYSTEM (use generously but tastefully): monospace eyebrow label above EVERY section; ruled divider lines between sections (SVG line with filter="url(#rough)" or a CSS border); ∎ end-marks; GIVEN / CLAIM / EVIDENCE / RESULT stamps; small corner tick marks on cards.

SECTIONS (full-bleed bands, alternate --bg / --bg-panel):
GIVEN — education: school, GPA, SAT, graduation; courses as inline monospace chips.
EVIDENCE — tier1 as THEOREM BLOCKS, tier2 as LEMMAS (one line), tier3 grouped.
METHOD — skills matrix table (rows: categories; cols: Exposure/Practice/Output; cells: ●○○).
RESULT — first-person future goal + contact.

THEOREM BLOCK (each tier1): bordered card (1px --line border, or an SVG rect with filter="url(#rough)"), header "Theorem N — [title]" mono 600; fields Problem:/Approach:/Result:/Tools: (mono tags); bottom-right ∎ in --gold. HOVER: bg warms to --bg-panel, border darkens, ∎ nudges right.

ANIMATION (must feel like a proof being BUILT BY HAND, not a dashboard loading) — ALL via CSS, NO JavaScript: the curve traces itself in via stroke-dashoffset @keyframes; axes draw the same way; evidence dots pop in (scale/opacity @keyframes) with staggered animation-delay. The feTurbulence "rough" filter keeps the strokes hand-drawn throughout — they never snap to a clean line. pure-CSS autoplay entrances for name/tagline/cards (animation-fill-mode:both, staggered delay, resting state visible); each section eyebrow gets a small underline that draws on entry (background-size or SVG stroke). NO IntersectionObserver, NO requestAnimationFrame, NO opacity:0-until-scrolled, NO <script>. Theorem hover via CSS. Respect prefers-reduced-motion (show final state — including the curve, points, and labels in their final positions).
FORBIDDEN: any <script>/JavaScript (it will be stripped); rough.js or canvas; a too-perfect / mathematically clean un-filtered chart line; points floating off the curve; labels that don't clearly map to a point; a default finance-chart look; narrow centered document, all-gray quiet text, dark bg, neon, glass, gradients, sans-serif display, generic SaaS hero.
`

const FIELD_NOTES_SPEC = `
STYLE: Field Notes — a researcher's high-end academic notebook. Warm, literate, annotated.

LAYOUT MODEL (full-bleed — NOT a narrow document):
- Page fills the FULL viewport width. Hero is min-height:100vh. Sections are full-width bands.
- A persistent left "spine" rail (clamp(8px,3vw,28px) wide, solid --ink edge + faint margin) runs the full height.
- Content uses an inner grid: a left margin column (dates/notes), a main column (prose, max-width 64ch), and a right margin column (annotations). On <820px collapse to one column and move annotations inline.
- Scale type UP on large screens with clamp().

PALETTE (declare in :root — warmer paper, deeper ink):
--bg:#F6EFE0; --bg-panel:#FCF7EC; --ink:#21303A; --ink-soft:#52636C; --line:rgba(33,48,58,0.16);
--olive:#566B45; --gold:#B68B3C; --gold-hi:#E9CE8A; --rust:#9A4A33;
Body text is --ink. Labels/dates are --olive/--gold. The highlighter is --gold-hi.

FONTS (weights to 700):
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Source+Sans+3:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
- Headings/name/quotes: "Lora" serif, 600-700
- Body: "Source Sans 3"
- Dates/labels/index: "IBM Plex Mono"

TYPE SCALE:
- Hero name: Lora 700, clamp(2.8rem,7vw,5.2rem), line-height 1.0
- Research question (the signature line): Lora 600 italic, clamp(1.6rem,3.2vw,2.6rem)
- Section titles: Lora 600, clamp(1.7rem,3vw,2.4rem)
- Body: Source Sans 3 1.0625rem, line-height 1.7
- Labels: IBM Plex Mono .72rem uppercase, letter-spacing .16em

HERO = THE SIGNATURE, MUST ANIMATE ON LOAD:
- Faint ruled-paper background (repeating-linear-gradient, 1px line at --line, ~30px rhythm). Spine on the left.
- Big first-person name + role label.
- THE central research question rendered large with an animated HIGHLIGHTER sweep on key words (a --gold-hi background that grows from 0 to full width on load, ~0.9s).
- A couple of margin notes (handwritten-feel Lora italic, slightly rotated) that fade/slide in from the right after the highlighter.
- A "RESEARCH QUESTION" eyebrow + page number "p.01" top-right.
- READABILITY: prose and the question sit on near-solid --bg/--bg-panel — ruled lines stay faint and never reduce contrast of multi-line text.

ACCENT SYSTEM: monospace eyebrow + page number per section; ★ markers on research notes; ruled underlines that draw in; pull-quote with a thick --gold left border; archive index rows like a card catalog.

RESEARCH NOTE CARD (tier1): 1px --line border on --bg-panel; "★ [Title]" Lora 600; divider; Context:/Role:/Insight:/Impact: (mono labels + Source Sans body); date range bottom-right. HOVER: a right-margin annotation slides in + card lifts slightly.

QUOTE/PULL BLOCK: 3px --gold left border, Lora italic clamp(1.3rem,2vw,1.7rem), mono attribution.
ARCHIVE INDEX (awards): mono rows "2025 / Category / Title", subtle alternating row bg.

SECTIONS (full-bleed bands): Profile / Research Questions / Selected Work / Community & Leadership / Awards / Reflections.
ANIMATION: highlighter sweep on load (background-size keyframe, decorative); pure-CSS autoplay entrances for name/question/cards (animation-fill-mode:both, staggered, resting state visible); margin notes slide/fade in via CSS autoplay; underlines draw on entry. NO IntersectionObserver, NO opacity:0-until-scrolled, NO bounce. Respect prefers-reduced-motion.
FORBIDDEN: rough.js (not this style), narrow centered document, all-gray quiet text, dark bg, neon, glass.
`

const EXHIBIT_WALL_SPEC = `
STYLE: Exhibit Wall — a curated student exhibition of growth artifacts. Editorial, gallery, confident.

LAYOUT MODEL (full-bleed — NOT a narrow document):
- Page fills the FULL viewport width. Hero is min-height:100vh, a real gallery wall.
- Sections are full-width bands; only running prose is constrained (max-width 64ch). Card grids use the full width with comfortable gutters.
- Scale type and cards UP on large screens with clamp().

PALETTE (declare in :root — gallery warm, strong accents):
--bg:#EAE6DD; --bg-panel:#F4EFE4; --card:#FFFDF7; --ink:#262320; --ink-soft:#615A52; --line:rgba(38,35,32,0.16);
--coral:#B5573F; --violet:#414D78; --gold:#B68B3C;
Body text is --ink. Catalog labels are --coral. Tags use --violet.

FONTS (weights to 800):
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Nunito:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
- Name / display titles: "Playfair Display" 700-800
- Body / UI: "Nunito"
- Catalog numbers / labels: "IBM Plex Mono"

TYPE SCALE:
- Hero name: Playfair Display 800, clamp(3.2rem,9vw,6.5rem), line-height .95
- Exhibition subtitle: Nunito 500, clamp(1.1rem,2vw,1.5rem), --ink-soft (still readable)
- Card titles: Playfair Display 700, clamp(1.2rem,1.6vw,1.5rem)
- Body: Nunito 1.0625rem, line-height 1.6
- Catalog labels: IBM Plex Mono .72rem, letter-spacing .14em, --coral

HERO = THE SIGNATURE, MUST ANIMATE ON LOAD:
- Faint dot-grid gallery wall (radial-gradient dots ~22px, ≤8% opacity).
- Huge name + first-person exhibition subtitle ("Things I made because ...").
- 3-5 artifact cards placed around the hero with slight rotations (use CSS custom property --rot, -4deg..4deg). On load they STAGGER IN (translateY+opacity, ~120ms apart) and then DRIFT very slightly (≤4px, slow ease-in-out, infinite) so the wall feels alive.
- Each hero card: "EXHIBIT 0N · TYPE" mono label, title, one-line description.
- A curator's note sticky in a corner.
- READABILITY: name/subtitle and all card text sit on solid --card/--bg-panel — never directly over the dot grid as a long paragraph.

ACCENT SYSTEM: mono catalog numbers everywhere; museum wall-label captions; thin --line dividers; a "CURATOR'S NOTE" sticky; section eyebrows.

ARTIFACT CARD (tier1): --card bg, 1px --line border, box-shadow 0 4px 18px rgba(0,0,0,.08), rotation via --rot. "Exhibit 0N" (--coral) top-left, type tag (--violet) top-right, Playfair title, divider, "Why it exists:" / "What changed:" labels + text. HOVER: rotation normalizes to 0deg, lifts, shadow grows, and a sticky curator note slides in.

TIER2 CARDS: smaller "Record 0N" cards, no rotation. AWARDS SHELF: horizontal row of museum labels, mono "[Year] — [Award]".

SECTIONS (full-bleed bands): Entrance Statement / Featured Artifacts / Project Wall / Leadership Records / Awards Shelf / Process Notes / Future Installation.
ANIMATION: hero card stagger via pure-CSS autoplay (animation-fill-mode:both, ~120ms apart, resting state visible) + subtle infinite drift on the motif; pure-CSS autoplay entrances for name/subtitle/cards; card hover (straighten + lift + curator note); section eyebrows underline in. NO IntersectionObserver, NO opacity:0-until-scrolled. Respect prefers-reduced-motion (disable drift, show final state).
FORBIDDEN: dark bg, neon, glass-morphism, rough.js (not this style), narrow centered document, all-gray quiet text.
`

const STYLE_SPECS: Record<string, string> = {
  proof_board: PROOF_BOARD_SPEC,
  field_notes: FIELD_NOTES_SPEC,
  exhibit_wall: EXHIBIT_WALL_SPEC,
}

/* ── Agent prompts ── */

const A1_SYSTEM = `You are helping a real high-school student write the words for their own personal portfolio site. You are NOT an admissions officer writing a report ABOUT them. You are the student's ghostwriter — every line should sound like the student talking about their own work.

Transform raw student data into structured content for a single-page portfolio. Keep the chosen style's flavor, but the VOICE is always first-person and human.

VOICE — non-negotiable:
- First person, always: "I built…", "I kept coming back to…", "I'm trying to figure out…", "I learned…". Never "This student…", "They demonstrated…".
- Light and natural, like a sharp 17-year-old who is genuinely into their thing — not a press release, not a grant application.
- The intro/tagline is short and personal. NO grand, abstract, throat-clearing openers ("Driven by an insatiable passion for the intersection of…"). Just say what you do and why you care.
- Reflective is good; pompous is not. One honest sentence beats three impressive ones.
- Don't over-explain the student or over-justify small things.

STYLE FLAVORS (tone only — voice stays first-person):
- proof_board: builder/logical, dry humor. "I had problem X, so I built Y. It did Z." Plain and concrete.
- field_notes: curious/observational. "I keep returning to this question…" Notebook honesty.
- exhibit_wall: a maker showing their work. "I made this because…" Confident, not grandiose.

CONTENT TIERING — based on real impact, specificity, narrative value:
- TIER 1 (1-3 items): the things they'd actually talk about for ten minutes — real projects, top awards, defining work, with concrete outcomes → full narrative
- TIER 2 (3-6 items): solid supporting activities/work → brief, one or two honest sentences
- TIER 3 (remaining): memberships, one-off volunteering, small repeated items → grouped, no individual treatment

Rules:
- Cut prestige filler: "passionate about", "experienced in", "dedicated to", "leveraged", "spearheaded", "fostered", "honed".
- Pull the real thing out: "Led club" → what did you actually do, how many people, what changed? But only state what the data supports.
- Do NOT inflate minor activities into something they aren't. If it was small, let it be small and honest.
- Be specific using the resume data; never invent achievements, numbers, or titles.
- If a questionnaire field is blank, infer naturally from the data in the student's own voice.
- Return ONLY valid JSON — no markdown, no explanation.`

const A1_OUTPUT_SCHEMA = `{
  "name": "string",
  "tagline": "one punchy line, not generic",
  "intended_major": "string",
  "target_schools": ["string"],
  "tier1": [{
    "title": "string",
    "type": "project|award|research|work",
    "problem": "string — what problem or question",
    "approach": "string — how you attacked it",
    "result": "string — concrete outcome",
    "tools": ["string"],
    "period": "string",
    "curator_note": "string — for exhibit_wall only, 1 sentence insight"
  }],
  "tier2": [{
    "title": "string",
    "type": "string",
    "description": "string — 1-2 sentences",
    "period": "string"
  }],
  "tier3": ["string — titles only, comma-separated grouping"],
  "education": {
    "school": "string",
    "gpa": "string",
    "sat": "string",
    "act": "string",
    "graduation": "string",
    "courses": ["string — top 5 relevant"]
  },
  "skills": ["string"],
  "future_goal": "string — 2 sentences max, specific",
  "core_question": "string — for field_notes: the question they keep returning to",
  "exhibition_title": "string — for exhibit_wall: the theme of the exhibition",
  "proof_labels": {
    "x_axis": "string — for proof_board: e.g. practice or iterations",
    "y_axis": "string — for proof_board: e.g. depth or signal",
    "proof_statement": "string — for proof_board: the main tagline as a proof"
  },
  "contact": "string — email or link"
}`

const A2_SYSTEM = `You are an award-winning frontend designer-developer. You build single-page personal portfolio websites for ambitious high-school students applying to top universities. Your work looks hand-crafted by a senior designer — never like a template or AI output.

OUTPUT CONTRACT:
- Output ONLY the raw HTML document, starting with <!DOCTYPE html>. No markdown fences, no commentary, no trailing notes.
- ABSOLUTELY NO JAVASCRIPT. The published page runs under a strict Content-Security-Policy (script-src 'none'): every <script> tag is STRIPPED before serving, and any motif that depended on it will simply vanish. So you must NOT emit a single <script> tag, inline event handler (onclick/onload/onerror/…), javascript: URL, rough.js, canvas drawing, requestAnimationFrame, or IntersectionObserver. Build EVERYTHING with HTML + CSS + inline SVG only.
- Fully self-contained: ALL styling in one <style> in <head>. Font CDN <link>s go in <head>. No external scripts, no CDN libraries.
- No external images. Build every visual with CSS, inline SVG, or the style's drawn motifs. No emoji as icons.

THIS IS A SINGLE-PAGE PORTFOLIO — NOT A SCHOOL OR COMPANY SITE:
- It is ONE page. There are NO other pages, so there must be NO links that imply them.
- ABSOLUTELY FORBIDDEN navigation items: About, Giving, Admissions, Apply, Alumni, Parent Resources, News, Events, Athletics, Departments, Login, Donate, Contact Us page, or any institutional menu.
- Do NOT build a school-style top navbar. Do NOT invent pages.
- IF (and only if) you include navigation, it must be a minimal in-page anchor strip whose items are EXACTLY the real sections you generated (e.g. Profile, Work, Evidence, Archive, Contact) and every anchor scrolls within this one page. Clicking the name/logo must always return to the hero. Never produce an anchor or href that leads nowhere or to an external/orphan page. Prefer NO nav at all over a fake one.

FULL-SCREEN WEBSITE — NOT A NARROW DOCUMENT (critical layout rule):
- This is a real homepage, not a centered A4 page. The hero MUST be min-height:100vh and the page MUST use the full viewport width.
- NEVER wrap the entire page in a narrow centered container (no body{max-width:720px}, no single .container{max-width:800px;margin:auto} around everything). That "small card on a big empty page" look is a failure.
- Section backgrounds span edge-to-edge (full-bleed bands). Constrain ONLY the readable content with an inner wrapper (e.g. .wrap{max-width:1120px;margin:0 auto;padding:0 clamp(20px,5vw,80px)}); prose paragraphs may go narrower (max-width:64ch) for readability, but headings, hero, motifs, and section color bands stay full width.
- Scale UP on large desktops: use clamp() for font sizes, hero height, and spacing so a 1440px screen feels intentional, not stretched-small. Laptop, desktop, and mobile must each feel deliberate.

FIRST VIEWPORT MUST CARRY A LIVE STYLE-SPECIFIC ANIMATION (the single biggest requirement):
- Within the first screen the chosen style's signature motif must be PRESENT and ANIMATING on load — not just static text. ALL animation is CSS/SVG (no JS):
  proof_board → inline-SVG axes + a self-drawing growth curve (stroke-dashoffset @keyframes) with a feTurbulence "rough" filter for the hand-drawn look + plotted evidence points (CSS scale/opacity pop-in) + a ∎/theorem mark.
  field_notes → ruled paper + spine + the research question with an animated CSS highlighter sweep (background-size @keyframes) + margin notes that appear (CSS).
  exhibit_wall → gallery dot-wall + numbered, slightly-rotated artifact cards that stagger in and drift subtly (CSS @keyframes) + a curator note.
- A hero that is "mostly a quiet text block" is REJECTED. The motif must be obvious and moving — and it must move with CSS, never JS.

BOLD, PREMIUM TYPOGRAPHY & HIERARCHY:
- Strong weight contrast: huge heavy display headings (700-800) against lighter body. Follow the style's TYPE SCALE (clamp-based) exactly.
- Confident, large hero text. Clear hierarchy: eyebrow label → big title → body → accents.
- Use the style's ACCENT SYSTEM generously but tastefully: eyebrow labels, ruled lines, stamps/marks, annotations, catalog numbers, dividers. The page must NOT read as a plain beige page with paragraphs.

FIRST-PERSON COPY:
- All visible prose is in the student's first-person voice ("I built…", "I keep returning to…"). Never third-person "This student…". The content JSON is already first-person; preserve that voice.

VISIBILITY-SAFE ANIMATION (CRITICAL — the page runs with ZERO JavaScript):
- The published page has NO JavaScript at all (CSP script-src 'none'). Every motif, animation, and interaction is CSS/SVG. There is no "if the script fails" — there is no script. Design accordingly.
- ALL real content (hero text, headings, paragraphs, cards, every section) MUST be fully visible by default. NEVER set content to opacity:0 / visibility:hidden / transform off-screen as a resting state — there is no JS to bring it back, so it would be gone forever.
- Entrance reveals must be PURE CSS: @keyframes that AUTOPLAY on load with "animation-fill-mode: both" and staggered "animation-delay". The element's resting (post-animation) state is fully visible.
- The ONLY animated decoration is CSS/SVG (stroke-dashoffset draws, background-size sweeps, transform/scale pop-ins). Nothing depends on a script.
- Under @media (prefers-reduced-motion: reduce), content is simply shown (no transforms), never hidden.

COMPLETE, SELF-CONTAINED OUTPUT (prevent truncation):
- You MUST emit the ENTIRE document and close it with </body></html>. A cut-off document is a failure.
- Keep the CSS and inline SVG concise and efficient. Do not write sprawling code that risks running out of space before the document closes. Favor compact, correct code and a complete page over an elaborate but truncated one.

MANDATORY MOTION (the page must feel alive and crafted, never static — but never chaotic):
- THE GOLDEN RULE: motion may animate the MOTIF and may ENHANCE text entrances, but text is ALWAYS visible by default. Animate transform / stroke-dashoffset / clip-path / background-size / scale — NOT the opacity of readable content gated on a script.
- Hero reveal on load: a staggered entrance of the name, tagline, and the style's signature motif using PURE-CSS @keyframes that autoplay with animation-fill-mode:both and per-element animation-delay. The signature motif (axes+curve, highlighter sweep, card stagger) is the star.
- Drawn motifs animate IN with CSS/SVG only: hand-drawn lines/curves TRACE themselves via SVG stroke-dashoffset @keyframes (proof_board's axes/growth curve — NO rough.js, NO requestAnimationFrame); background-size/clip-path reveals for ruled lines, underlines, highlighter, annotation marks. These are DECORATIVE layers — never the only thing holding text visible.
- Below-the-fold sections must be VISIBLE BY DEFAULT (resting opacity:1). DO NOT use IntersectionObserver, and DO NOT set sections/cards to opacity:0 waiting to be scrolled into view. If you want a scroll-in feel, use CSS scroll-driven animations (animation-timeline:view()) whose UN-supported fallback is the fully-visible state — never a JS observer that, if it fails, leaves content blank.
- Cards/items may stagger in via pure-CSS autoplay (animation-delay per index, ~80-120ms apart), resting state fully visible.
- Section labels/headings get a small signature touch on entry (an underline that draws via stroke/background-size, a label that slides) — pure CSS, content already legible.
- At least two meaningful hover interactions matching the style (theorem warms + ∎ nudges; margin annotation slides in; artifact card straightens to 0deg, lifts, and its curator note appears; small paper/shadow depth change).
- Optional restrained ambient life: hero artifacts may drift VERY slightly (≤4px, slow, ease-in-out) — subtle, never busy.
GOOD motion: line-drawing, slight artifact drift, staggered card reveal (CSS autoplay), highlighter sweep, proof curve drawing in, label underlines, small hover depth changes.
AVOID: IntersectionObserver / JS class-toggle reveals (forbidden), generic fade-in as the ONLY motion, heavy parallax, anything neon, motion that competes with reading, more than one looping animation in view at once.
- Respect @media (prefers-reduced-motion: reduce) — disable transforms/animations there, show final state.
- html { scroll-behavior: smooth }.

SMALL LIVELY DETAILS (add a few, tasteful and style-specific — make the page feel handmade and alive, NOT cluttered):
- Pick 3-5 of these, no more: tiny annotation marks or margin notes that fade in softly; section labels that underline or "stamp" in on entry; cards that shift VERY slightly on hover (≤2-4px translate or ≤1deg tilt) with a small paper/shadow depth change; proof ticks / exhibit labels / notebook marks as quiet punctuation; a subtle staggered reveal of list items; a faint paper grain or texture shift.
- These are accents, not the main event. Keep them quiet: low opacity, small movement, short duration. They must never compete with reading or clutter the layout.
- Match them to the style: proof_board → ∎ marks, corner ticks, "Q.E.D."/theorem stamps, a redline annotation; field_notes → margin stars, highlighter dabs, pencil ticks; exhibit_wall → wall-label captions, catalog ticks, a curator sticky.
- DO NOT add: heavy parallax, neon, AI gradients, loud or large motion, more than one looping animation in view, or so many marks that the page reads busy.

READABILITY IS NON-NEGOTIABLE (the most common failure — fix it):
- Decorative texture (graph grid, dot grid, ruled lines, scattered marks) must NEVER sit directly behind body copy or headings at full strength. Keep it faint (≤8-10% opacity) and, where text overlaps it, place the text inside a quiet "paper panel" (solid or near-solid bg from the palette, subtle border) so local contrast is high.
- Body text must hit comfortable contrast against its IMMEDIATE background (aim WCAG AA: ~4.5:1 for body, ~3:1 for large headings). Muted colors are for small labels, not paragraphs.
- Hero title, hero subtitle, project/artifact card text, and long paragraphs each need a calm, high-contrast surface — never a busy decorative field directly behind a multi-line paragraph.
- Decorative SVG layers must be behind text (lower z-index) and must NOT capture pointer events (pointer-events:none). (No <canvas> — it would need JS.)
- Generous line-height for paragraphs (1.5-1.7) and a readable measure (max ~68ch).
- Protect MOBILE readability: at ≤480px, reduce decorative opacity further, stack columns, keep font sizes ≥15px for body, ensure nothing sits illegibly over texture.

STYLE SIGNATURE IN THE FIRST VIEWPORT:
- Within the first screen, the chosen style must be unmistakable: proof_board → drawn axes + growth curve + a theorem/∎ cue; field_notes → ruled paper + spine + a highlighted research question + a margin note; exhibit_wall → gallery dot-wall + numbered, slightly-rotated artifact cards + a curator note.

CRAFT BAR (this is a paid Pro feature):
- Use CSS custom properties (:root) for the full palette and reuse them everywhere.
- Deliberate typographic scale and vertical rhythm; generous, consistent spacing; a clear hero → sections → contact flow.
- Real handcrafted motifs, not generic rounded rectangles in a grid.
- Fully responsive 360px → 1440px: the layout must reflow gracefully, motifs scale, text stays readable, nothing overflows horizontally.

ANTI-PATTERNS — instant fail, never do these:
- Generic SaaS/landing hero (centered headline + big CTA button), pricing-style cards, feature grids.
- Dark glassmorphism, neon, purple-on-white AI gradients, drop-shadow-heavy "floating cards" clichés.
- A faux institutional navbar or any of the forbidden links above.
- Plain beige background with unstyled stacked text (the failure we are fixing).
- Inventing facts. Use only the content JSON; if a field is empty, omit that piece gracefully.

Follow the provided STYLE SPECIFICATION exactly for palette, fonts, motifs, and section names.`

const A3A_SYSTEM = `You are a quality assurance reviewer for a portfolio website generator.
Review the provided HTML and return ONLY a JSON critique. No explanation outside the JSON.

Score 0-100 based on:
- NO JAVASCRIPT — the page must be 100% scriptless (25pts) — see hard gate 1 below
- STYLE SIGNATURE ANIMATION in the first viewport, done with CSS/SVG (20pts) — see hard gate below
- Visibility safety + content completeness — all sections present, NO text hidden (15pts)
- Mobile responsiveness (10pts)
- Code validity — closes </body></html>, no broken tags (15pts)
- Typography, hierarchy, and spacing quality (15pts)

HARD GATES — if any is violated, set score BELOW 80 and add a specific must_fix entry:
1. ZERO JAVASCRIPT (the page is served under CSP script-src 'none' — any JS is stripped and its motif disappears):
   - If the HTML contains ANY <script> tag, inline event handler (onclick/onload/onerror/…), javascript: URL, rough.js, <canvas>, requestAnimationFrame, or IntersectionObserver → score < 70, must_fix: "remove all JavaScript; rebuild the motif/animation with inline SVG + CSS @keyframes (stroke-dashoffset to draw lines/curves, scale/opacity to pop dots in)".
   - This is the most important gate. A page that relies on a script for its hero motif will render BLANK in production.
2. STYLE SIGNATURE ANIMATION must be present and animating in the hero/first viewport, using CSS/SVG only:
   - proof_board → inline-SVG axes + a self-drawing growth curve (path with stroke-dashoffset @keyframes) + plotted evidence <circle> points that pop in via CSS. If the hero has no SVG proof/axis/curve/evidence animation → score < 80.
   - field_notes → a CSS highlighter sweep (background-size @keyframes) / annotation / margin-note / underline-draw on the research question. If absent → score < 80.
   - exhibit_wall → artifact/gallery cards that stagger in and/or drift via CSS @keyframes. If absent → score < 80.
   Look for @keyframes / stroke-dashoffset / background-size sweeps / staggered animation-delay tied to the motif. A hero that is just static text → score < 80.
   PROOF_BOARD CURVE QUALITY (design issue, not a hard gate — flag in must_fix and lower the quality score if violated):
   - The growth curve must look HAND-DRAWN: an SVG path with a feTurbulence/feDisplacementMap "rough" filter applied (filter="url(#rough)"), or visibly irregular coordinates + a faint offset second pass. A too-perfect, mathematically clean UN-FILTERED line, or anything that looks like a default finance/dashboard chart → flag "too-perfect chart line" and tell it to add an SVG feTurbulence displacement filter (baseFrequency ~0.018, scale ~3.2).
   - Every plotted evidence point must sit ON the curve, and each label must clearly correspond to one point. If points float off the curve, or labels don't map to points → flag "points floating off curve / labels not matched to points" with the fix to author dots and the path "d" from the same coordinates.
3. VISIBILITY SAFETY: no readable content may rest at opacity:0/visibility:hidden. Since there is no JS, anything hidden by default stays hidden forever. If you see opacity:0 (or translate-off) as a RESTING state on sections/cards/text (not part of an autoplaying CSS @keyframes that ends visible) → score < 80, must_fix: convert to pure-CSS autoplay keyframes whose resting state is visible.
4. COMPLETE DOCUMENT: must close with </body></html>. If truncated/cut off → score < 70.
Keep CSS/SVG concise so the document stays complete (no sprawling code that risks truncation).

Return this exact shape:
{
  "score": number,
  "must_fix": [
    { "issue": "string", "location": "string — which section/element", "fix": "string — exact fix instruction" }
  ],
  "nice_fix": [
    { "issue": "string", "fix": "string" }
  ]
}`

const A3B_SYSTEM = `You are a precise HTML/CSS repair specialist.
You will receive an HTML page and a list of must_fix issues.
Apply ONLY the must_fix repairs — do not restructure, do not redesign, do not change what works.
HARD RULE: the output must contain ZERO JavaScript — no <script>, no event handlers, no javascript: URLs, no rough.js, no <canvas>, no requestAnimationFrame. If a fix is "remove JS / rebuild the motif", re-create that motif with inline SVG + CSS @keyframes (stroke-dashoffset to draw the curve/axes, scale/opacity to pop dots in, an SVG feTurbulence filter for the hand-drawn look). Never re-introduce a script.
Return ONLY the repaired HTML — no explanation, no markdown fences.`

/* ── Refine: classifier + CSS-patch prompts ── */

const REFINE_CLASSIFY_SYSTEM = `You classify a user's edit request for an existing ONE-PAGE portfolio website into exactly one change_type. Return ONLY JSON: {"change_type":"..."}. No prose.
Types (pick the NARROWEST that fits):
- "text_only": only wording/copy (fix a typo, reword a sentence, rename a heading). No visual change.
- "css_tweak": visual styling achievable with CSS alone — colors/warmth, font weight/size, spacing, shadows, borders, "make it bolder/calmer", subtle extra motion on existing elements.
- "motif_tweak": changing the HERO signature motif/animation itself — the proof-board curve/axes/evidence points, the field-notes highlighter, the exhibit cards — its shape, roughness, drawing, or behavior.
- "big_layout": restructuring/reordering/adding/removing sections, or a major layout change.
- "full_redesign": start over / a completely different look.`

const REFINE_CSS_SYSTEM = `You are a senior CSS engineer making a SMALL visual tweak to an existing one-page portfolio.
Output ONLY additional CSS rules — no <style> tag, no markdown, no commentary. These rules are appended at the END of <head>, so they override earlier styles.
HARD RULES:
- ADD or override only. You ship CSS, so you cannot and must not remove elements, text, or sections.
- Reuse the page's existing CSS custom properties (e.g. var(--gold), var(--ink)) and the real class names visible in the provided HTML. Target specific selectors.
- Never hide content: no display:none / opacity:0 / visibility:hidden on text, cards, or sections. Keep WCAG-readable contrast.
- Preserve the page's aesthetic (paper/ink, serif display). No neon, no AI gradients.
- Keep it focused and minimal — only what the request needs.`

/* ── Refine helpers: motif detection + guards ── */

// Does the html still contain the chosen style's signature motif? Used to reject
// a refine that strips the hero animation (the reported proof-board failure).
function hasStyleMotif(html: string, style: string): boolean {
  const h = html.toLowerCase()
  if (style === 'proof_board') {
    // Scriptless only: the curve/axes are inline SVG animated by CSS. rough.js /
    // canvas / rAF no longer count (they'd be stripped from the public page).
    return h.includes('<svg') && (h.includes('<path') || h.includes('stroke-dashoffset') || h.includes('<polyline') || h.includes('<line'))
  }
  if (style === 'field_notes') {
    return h.includes('repeating-linear-gradient') || h.includes('background-size') || h.includes('<svg') || h.includes('highlight')
  }
  if (style === 'exhibit_wall') {
    return h.includes('rotate(') || h.includes('@keyframes') || h.includes('translatey')
  }
  return true
}

// Returns a rejection reason if a refined document is unsafe to ship, else null.
// This is what stops refine from silently destroying a working page.
function guardRefine(
  original: string,
  next: string,
  style: string,
  opts: { small: boolean; skipSections?: boolean },
): string | null {
  const base = validateBioHtml(next)
  if (base) return base
  const origText = visibleTextLength(original)
  const nextText = visibleTextLength(next)
  if (origText > 0 && nextText < origText * 0.6) return 'The edit dropped too much of the page text.'
  if (hasStyleMotif(original, style) && !hasStyleMotif(next, style))
    return "The edit removed the page's signature animation/motif."
  if (!opts.skipSections) {
    const sections = (s: string) => ((s.match(/<section/gi) || []).length) || ((s.match(/<h2/gi) || []).length)
    const o = sections(original), n = sections(next)
    if (o >= 3 && n < o * 0.6) return 'The edit removed major sections of the page.'
  }
  if (opts.small) {
    const delta = Math.abs(next.length - original.length) / Math.max(1, original.length)
    if (delta > 0.5) return 'That looked like a small tweak but the page changed too drastically.'
  }
  return null
}

// Strip fences/tags and bound length so injected CSS can't break out or bloat.
function sanitizeCss(css: string): string {
  return css
    .replace(/^```(?:css)?\s*/i, '')
    .replace(/\s*```$/, '')
    .replace(/<\/?style[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim()
    .slice(0, 8000)
}

// Inject (or append to) a single override <style> block right before </head>.
// Additive only — never touches existing markup, so it can't remove the motif.
function injectCssOverrides(html: string, css: string): string {
  const tagged = /<style id="bio-refine-overrides">[\s\S]*?<\/style>/i
  if (tagged.test(html)) {
    return html.replace(tagged, m => m.replace(/<\/style>$/i, `\n${css}\n</style>`))
  }
  const block = `<style id="bio-refine-overrides">\n${css}\n</style>`
  if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${block}\n</head>`)
  return block + html
}

// Server-side preset map. Keep instructions specific so the model has direction.
const REFINE_PRESETS: Record<string, { mode: 'css_tweak' | 'motif_tweak'; instruction: string }> = {
  stronger_curve: {
    mode: 'motif_tweak',
    instruction: 'Make the proof-board growth curve much stronger and more convincing, using ONLY inline SVG + CSS (no JavaScript): a thicker hand-drawn path with an SVG feTurbulence/feDisplacementMap "rough" filter (filter="url(#rough)") on the curve and axes, drawn in via a stroke-dashoffset CSS @keyframes, plus 3-4 evidence <circle> points (CSS scale/opacity pop-in) that visibly sit ON the curve with short matched labels. It must read as hand-derived, never a clean default chart line.',
  },
  more_handdrawn: {
    mode: 'motif_tweak',
    instruction: 'Make the hero motif look more hand-drawn and tactile, using ONLY inline SVG + CSS (no JavaScript): increase the SVG feTurbulence roughness (raise baseFrequency / displacement scale) on the curve and axes, add a faint second offset copy of the curve path for a redrawn-by-hand feel, and keep strokes slightly irregular with stroke-linecap/linejoin round. Remove any mechanically perfect line.',
  },
  warmer: {
    mode: 'css_tweak',
    instruction: 'Shift the overall color temperature warmer and cozier while keeping the paper/ink aesthetic and strong contrast.',
  },
  bolder: {
    mode: 'css_tweak',
    instruction: 'Make the typography and hierarchy bolder and more confident: heavier display weights, stronger size contrast between headings and body, slightly tighter heading line-height.',
  },
  more_animated: {
    mode: 'css_tweak',
    instruction: 'Add a little more tasteful motion using CSS only: slightly livelier staggered entrances, subtle hover depth on cards, small label/underline reveals. Keep it subtle, never busy.',
  },
}

type RefineMode = 'text_only' | 'css_tweak' | 'motif_tweak' | 'big_layout' | 'full_redesign'

async function classifyRefine(
  anthropic: Anthropic,
  meter: ReturnType<typeof makeMeter>,
  instruction: string,
  style: string,
): Promise<RefineMode> {
  const valid: RefineMode[] = ['text_only', 'css_tweak', 'motif_tweak', 'big_layout', 'full_redesign']
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: REFINE_CLASSIFY_SYSTEM,
      messages: [{ role: 'user', content: `Style: ${style}\nEdit request: "${instruction}"` }],
    })
    meter.add('claude-haiku-4-5-20251001', msg.usage)
    const raw = (msg.content[0] as { type: string; text: string }).text.trim()
    const j = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim())
    const t = String(j.change_type || '').trim() as RefineMode
    return valid.includes(t) ? t : 'motif_tweak'
  } catch {
    // On any failure, fall back to the guarded full refine (safe, just pricier).
    return 'motif_tweak'
  }
}

function buildFullRefinePrompt(mode: RefineMode, instruction: string, existingHtml: string, styleSpec: string): string {
  const preserve = `PRESERVATION CONTRACT (do not violate):
- Keep ALL existing first-person copy/text unless the change explicitly asks to reword it.
- Keep every section and any in-page nav anchors that already exist.
- The page's signature motif/animation MUST remain present and working (do NOT remove the proof curve/axes/evidence, the highlighter, or the gallery cards).
- Keep the palette and overall aesthetic. Output a COMPLETE document ending in </body></html>.`
  const scope =
    mode === 'motif_tweak'
      ? 'SCOPE: Change ONLY the hero signature motif/animation as described. Leave all other markup, text, sections, and styles exactly as they are.'
      : mode === 'big_layout'
        ? 'SCOPE: Apply the requested layout/structure change. You may restructure sections, but keep all real content and the signature motif.'
        : "SCOPE: Redesign per the request, but reuse the SAME real content (name, projects, sections) and keep the style's signature motif."
  return `Apply this change to the existing portfolio HTML.
Change requested: "${instruction}"

${scope}

${preserve}

Existing HTML:
${existingHtml}

Style spec for reference:
${styleSpec}

Return ONLY the updated, complete HTML.`
}

/* ── Route handler ── */

async function logGeneration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  mode: 'generate' | 'refine',
  style: string,
  m: ReturnType<ReturnType<typeof makeMeter>['metrics']>,
  versionId: string | null = null,
) {
  // Best-effort: if the bio_generations table doesn't exist yet, this just
  // returns an error object we ignore (see scripts/bio-generations-table.sql).
  // This table is the ADMIN-ONLY usage/cost log — tokens + $ live here, never in
  // the user-facing bio_page_versions history.
  try {
    await supabase.from('bio_generations').insert({
      user_id: userId,
      version_id: versionId,
      mode,
      model: 'claude-sonnet-4-6',
      style,
      generation_duration_seconds: m.generation_duration_seconds,
      input_tokens: m.token_cost.input_tokens,
      output_tokens: m.token_cost.output_tokens,
      total_tokens: m.token_cost.total_tokens,
      estimated_cost_usd: m.estimated_cost_usd,
    })
  } catch {
    /* table may not exist; metrics are still returned to the client */
  }
}

// The SDK rejects non-streaming requests that may run past 10 minutes (large
// max_tokens). Stream the response and return the assembled final Message, so
// callers can use `.usage` / `.content` exactly like a create() result.
function streamFinal(
  anthropic: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Message> {
  return anthropic.messages.stream(params).finalMessage()
}

export async function POST(request: NextRequest) {
  let step = 'init'
  const startMs = Date.now()
  const meter = makeMeter()
  let userId = ''
  let creditConsumed: BioCredit = 'none'
  let lockAcquired = false
  const supabase = await createClient()

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(proxiedFetch ? { fetch: proxiedFetch as any } : {}),
    })

    step = 'auth'
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id

    const body = await request.json()
    const { style, questionnaire, refine_instruction, existing_html, preset, refine_mode } = body as {
      style: 'proof_board' | 'field_notes' | 'exhibit_wall'
      questionnaire: { tagline: string; highlights: string[]; goal: string; styleSpecific: string }
      refine_instruction?: string
      existing_html?: string
      preset?: string
      refine_mode?: RefineMode | 'auto'
    }

    if (!style || !STYLE_SPECS[style]) {
      return NextResponse.json({ error: 'Invalid style' }, { status: 400 })
    }

    /* ── Quota check (skip for admin) ── */
    step = 'quota'
    const isAdmin = isAdminEmail(user.email ?? '')
    if (!isAdmin) {
      const quota = await getQuotaState(supabase, userId, user.email ?? '')

      if (quota.is_locked) {
        return NextResponse.json(
          { error: 'You already have a generation in progress. Please wait for it to finish.' },
          { status: 429 },
        )
      }

      const isRefine = !!(refine_instruction && existing_html)

      if (isRefine) {
        // Determine the credit class early to check quota before any AI call.
        // Preset pins the mode; otherwise classify is needed — but we can check
        // the quota for even the cheapest path and bail before spending tokens.
        // CSS tweaks are cheap; expensive refines and redesigns cost real quota.
        const requestedMode = preset && REFINE_PRESETS[preset]
          ? REFINE_PRESETS[preset].mode
          : refine_mode && refine_mode !== 'auto' ? refine_mode : null

        // If the mode is already pinned to css_tweak, check css quota; otherwise
        // assume expensive until classified (conservative — prevents quota bypass).
        const likelyCss = requestedMode === 'css_tweak'
        if (likelyCss && !quota.can_css_tweak) {
          return NextResponse.json(
            { error: `You've used all ${quota.css_tweaks_limit} CSS style tweaks for this period. Try an AI refine or upgrade your plan.` },
            { status: 429 },
          )
        }
        if (!likelyCss && !quota.can_expensive_refine && requestedMode !== 'text_only') {
          return NextResponse.json(
            { error: `You've used all ${quota.refines_limit} AI refines for this period. Upgrade to Pro for 15 refines/month.` },
            { status: 429 },
          )
        }

        // Rate limit: max 10 AI refines per day (CSS + expensive combined).
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count: dailyRefines } = await supabase
          .from('bio_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('mode', 'refine')
          .gte('created_at', dayAgo)
        if ((dailyRefines ?? 0) >= 10) {
          return NextResponse.json(
            { error: "You've reached the limit of 10 AI refines per day. Try again tomorrow." },
            { status: 429 },
          )
        }
      } else {
        // Full generation.
        if (!quota.can_generate) {
          const limitLabel = quota.generates_limit === 0
            ? 'Bio Website requires a purchase or Pro subscription.'
            : `You've used all ${quota.generates_limit} generation${quota.generates_limit > 1 ? 's' : ''}${quota.is_monthly ? ' this month' : ''}. Upgrade for more.`
          return NextResponse.json({ error: limitLabel, quota_exceeded: true }, { status: 429 })
        }
        // Rate limit: max 2 full generates per 60 minutes.
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { count: hourlyGens } = await supabase
          .from('bio_generations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('mode', 'generate')
          .gte('created_at', hourAgo)
        if ((hourlyGens ?? 0) >= 2) {
          return NextResponse.json(
            { error: "You've generated 2 pages in the last hour. Please wait before generating again." },
            { status: 429 },
          )
        }
      }

      // Acquire concurrency lock — prevents duplicate simultaneous submissions.
      lockAcquired = await acquireJobLock(supabase, userId)
      if (!lockAcquired) {
        return NextResponse.json(
          { error: 'A generation is already in progress. Please wait for it to finish.' },
          { status: 429 },
        )
      }
    }

    /* ── Refinement mode: classify → route (text / css-patch / guarded full) ── */
    if (refine_instruction && existing_html) {
      step = 'refine'

      // 1. Decide the change scope. A preset pins the mode; otherwise classify
      //    (unless the client already passed an explicit mode).
      let mode: RefineMode
      let instruction = refine_instruction
      if (preset && REFINE_PRESETS[preset]) {
        mode = REFINE_PRESETS[preset].mode
        instruction = REFINE_PRESETS[preset].instruction
      } else if (refine_mode && refine_mode !== 'auto') {
        mode = refine_mode
      } else {
        mode = await classifyRefine(anthropic, meter, instruction, style)
      }

      // 2. Text-only → no AI page rewrite; point the user at inline editing.
      if (mode === 'text_only') {
        // text_only never consumes a credit and doesn't need to hold the lock.
        if (lockAcquired) await releaseJobLock(supabase, userId)
        lockAcquired = false
        return NextResponse.json({
          no_change: true,
          message: "That looks like a wording change. Click the text in the preview and edit it directly — it's instant and free. Use AI refine for visual or layout changes.",
          metrics: meter.metrics(startMs),
        })
      }

      // 3. Snapshot the pre-refine page so any bad result is instantly revertible.
      await saveBioVersion(supabase, user.id, {
        html: existing_html,
        style,
        source: 'manual_edit',
        label: 'Before refine',
      })

      // 4a. CSS tweak → cheap, additive CSS patch (Haiku). Cannot remove anything.
      if (mode === 'css_tweak') {
        const cssMsg = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1800,
          system: REFINE_CSS_SYSTEM,
          messages: [{
            role: 'user',
            content: `Visual tweak requested: "${instruction}"\n\nExisting HTML (target real selectors / CSS variables from it):\n${existing_html}`,
          }],
        })
        meter.add('claude-haiku-4-5-20251001', cssMsg.usage)
        const css = sanitizeCss((cssMsg.content[0] as { type: string; text: string }).text)
        const cssMetrics = meter.metrics(startMs)
        if (!css || css.length < 8) {
          await logGeneration(supabase, user.id, 'refine', style, cssMetrics)
          return NextResponse.json(
            { error: 'Could not generate that style change. Try rephrasing it.', metrics: cssMetrics },
            { status: 502 },
          )
        }
        // Sanitize the source first (defence in depth for older pages), inject the
        // additive CSS, then re-close. CSS injection can't add scripts; this keeps
        // the stored result scriptless regardless of what the source contained.
        const safeExisting = sanitizeBioHtml(existing_html)
        const patched = ensureCompleteDocument(injectCssOverrides(safeExisting, css))
        const guardErr = guardRefine(safeExisting, patched, style, { small: true })
        if (guardErr) {
          await logGeneration(supabase, user.id, 'refine', style, cssMetrics)
          return NextResponse.json(
            { error: `${guardErr} Your current page was kept.`, metrics: cssMetrics },
            { status: 502 },
          )
        }
        const snap = await saveBioVersion(supabase, user.id, {
          html: patched, style, source: 'refine', durationSeconds: cssMetrics.generation_duration_seconds,
        })
        await logGeneration(supabase, user.id, 'refine', style, cssMetrics, snap?.id ?? null)
        creditConsumed = 'css'
        return NextResponse.json({ html: patched, metrics: cssMetrics, version_id: snap?.id ?? null, change_type: mode })
      }

      // 4b. Motif / layout / redesign → guarded full refine (Sonnet).
      const refineMsg = await streamFinal(anthropic, {
        model: 'claude-sonnet-4-6',
        max_tokens: 24000,
        system: A2_SYSTEM,
        messages: [{ role: 'user', content: buildFullRefinePrompt(mode, instruction, existing_html, STYLE_SPECS[style]) }],
      })
      meter.add('claude-sonnet-4-6', refineMsg.usage)
      let refined = (refineMsg.content[0] as { type: string; text: string }).text.trim()
      refined = refined.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim()
      // Strip any scripts the refine introduced BEFORE guarding/saving, so the
      // motif check runs against the real scriptless page and storage stays safe.
      refined = ensureCompleteDocument(sanitizeBioHtml(refined))
      const refineMetrics = meter.metrics(startMs)

      const guardErr = guardRefine(existing_html, refined, style, {
        small: mode === 'motif_tweak',
        skipSections: mode === 'full_redesign',
      })
      if (guardErr) {
        await logGeneration(supabase, user.id, 'refine', style, refineMetrics)
        return NextResponse.json(
          { error: `${guardErr} Your current page was kept — open History to revert if needed, or try rephrasing.`, metrics: refineMetrics },
          { status: 502 },
        )
      }

      const refineSnap = await saveBioVersion(supabase, user.id, {
        html: refined, style, source: 'refine', durationSeconds: refineMetrics.generation_duration_seconds,
      })
      await logGeneration(supabase, user.id, 'refine', style, refineMetrics, refineSnap?.id ?? null)
      // full_redesign counts against generate quota; motif/layout against refine quota.
      creditConsumed = mode === 'full_redesign' ? 'generate' : 'refine'
      return NextResponse.json({ html: refined, metrics: refineMetrics, version_id: refineSnap?.id ?? null, change_type: mode })
    }

    /* ── Full generation mode ── */
    step = 'fetchProfile'
    const [{ data: profile }, { data: applications }] = await Promise.all([
      supabase.from('profiles')
        .select('full_name, gpa, sat_score, act_score, intended_major, intended_majors, graduation_year, resume_parsed, resume_raw_text')
        .eq('user_id', user.id).single(),
      supabase.from('applications')
        .select('application_type, intended_major, schools(name, acceptance_rate)')
        .eq('user_id', user.id),
    ])

    const resumeParsed = profile?.resume_parsed as any
    const targetSchools = (applications ?? [])
      .map((a: any) => a.schools?.name).filter(Boolean).join(', ') || 'not specified'
    const major = profile?.intended_major ?? profile?.intended_majors?.[0] ?? 'undecided'

    const userData = `
Student: ${profile?.full_name ?? 'Student'}
GPA: ${profile?.gpa ?? 'not provided'} | SAT: ${profile?.sat_score ?? 'not provided'} | ACT: ${profile?.act_score ?? 'not provided'}
Graduation: ${profile?.graduation_year ?? 'not provided'}
Intended Major: ${major}
Target Schools: ${targetSchools}

Education (from resume):
${JSON.stringify(resumeParsed?.education ?? [], null, 2)}

Activities:
${JSON.stringify(resumeParsed?.activities ?? [], null, 2)}

Awards:
${JSON.stringify(resumeParsed?.awards ?? [], null, 2)}

Work Experience:
${JSON.stringify(resumeParsed?.work_experience ?? [], null, 2)}

Skills: ${(resumeParsed?.skills ?? []).join(', ')}

Resume raw text (for additional context):
${(profile?.resume_raw_text ?? '').slice(0, 3000)}

Questionnaire answers:
- Tagline (user wrote, blank = AI decides): "${questionnaire.tagline}"
- Highlights to feature: ${questionnaire.highlights.length ? questionnaire.highlights.join(', ') : 'AI decides based on impact'}
- Future goal: "${questionnaire.goal}"
- Style-specific answer: "${questionnaire.styleSpecific}"`

    /* Agent 1 — Content Writer */
    step = 'agent1'
    const a1Msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: A1_SYSTEM,
      messages: [{
        role: 'user',
        content: `Style: ${style}

${userData}

Return content JSON matching this schema exactly:
${A1_OUTPUT_SCHEMA}`,
      }],
    })

    meter.add('claude-sonnet-4-6', a1Msg.usage)
    const a1Raw = (a1Msg.content[0] as { type: string; text: string }).text.trim()
    const a1Json = a1Raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    let contentJson: any
    try {
      contentJson = JSON.parse(a1Json)
    } catch {
      return NextResponse.json({ error: 'Content writer failed. Please try again.' }, { status: 500 })
    }
    const contentError = validateContentJson(contentJson)
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 422 })
    }

    /* Agent 2 — HTML Generator */
    step = 'agent2'
    const a2Msg = await streamFinal(anthropic, {
      model: 'claude-sonnet-4-6',
      max_tokens: 24000,
      system: A2_SYSTEM,
      messages: [{
        role: 'user',
        content: `STYLE SPECIFICATION:
${STYLE_SPECS[style]}

CONTENT JSON:
${JSON.stringify(contentJson, null, 2)}

Generate the complete portfolio HTML page now.`,
      }],
    })

    meter.add('claude-sonnet-4-6', a2Msg.usage)
    let html = (a2Msg.content[0] as { type: string; text: string }).text.trim()
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim()
    // Strip any JS up front so the critic reviews the REAL scriptless page (the
    // one production will serve). If the model leaned on a script for the motif,
    // the curve is now gone and the critic will (correctly) flag it for repair.
    html = sanitizeBioHtml(html)

    /* Agent 3a — Critic (Sonnet: the gatekeeper for the expensive repair pass,
       so it must reliably catch subtle design issues like a fake/too-perfect
       proof curve or points off the line). */
    step = 'agent3a'
    const a3aMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: A3A_SYSTEM,
      messages: [{
        role: 'user',
        content: `Style: ${style}\n\nHTML:\n${html}`,
      }],
    })

    meter.add('claude-sonnet-4-6', a3aMsg.usage)
    const a3aRaw = (a3aMsg.content[0] as { type: string; text: string }).text.trim()
    const a3aJson = a3aRaw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let critique: { score: number; must_fix: Array<{ issue: string; location: string; fix: string }>; nice_fix: unknown[] }
    try {
      critique = JSON.parse(a3aJson)
    } catch {
      critique = { score: 90, must_fix: [], nice_fix: [] }
    }

    /* Agent 3b — Repair (conditional) */
    if (critique.score < 85 && critique.must_fix.length > 0) {
      step = 'agent3b'
      const a3bMsg = await streamFinal(anthropic, {
        model: 'claude-sonnet-4-6',
        max_tokens: 24000,
        system: A3B_SYSTEM,
        messages: [{
          role: 'user',
          content: `Must-fix issues to repair:
${critique.must_fix.map(f => `- [${f.location}] ${f.issue}: ${f.fix}`).join('\n')}

HTML to repair:
${html}`,
        }],
      })
      meter.add('claude-sonnet-4-6', a3bMsg.usage)
      html = (a3bMsg.content[0] as { type: string; text: string }).text.trim()
      html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim()
      // Repair can re-introduce a script — strip again so what we store/return
      // is guaranteed scriptless.
      html = sanitizeBioHtml(html)
    }

    const genMetrics = meter.metrics(startMs)

    const htmlError = validateBioHtml(html, contentJson?.name)
    if (htmlError) {
      // Cost was incurred — log it (no version snapshot for a broken generation).
      await logGeneration(supabase, user.id, 'generate', style, genMetrics)
      return NextResponse.json(
        { error: `${htmlError} Please try generating again.`, metrics: genMetrics },
        { status: 502 },
      )
    }

    // Snapshot the successful generation as a new current version, then link the
    // usage log to it.
    const genSnap = await saveBioVersion(supabase, user.id, {
      html,
      style,
      source: 'generate',
      score: critique.score,
      durationSeconds: genMetrics.generation_duration_seconds,
    })
    await logGeneration(supabase, user.id, 'generate', style, genMetrics, genSnap?.id ?? null)
    creditConsumed = 'generate'

    return NextResponse.json({ html, score: critique.score, metrics: genMetrics, version_id: genSnap?.id ?? null })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[bio generate] failed at step ${step}:`, msg)
    return NextResponse.json({ error: 'Generation failed. Please try again.' }, { status: 500 })
  } finally {
    // Always release the lock, then increment the counter (only on success).
    if (lockAcquired) await releaseJobLock(supabase, userId)
    if (creditConsumed !== 'none' && userId) {
      await incrementUsage(supabase, userId, creditConsumed).catch(() => {/* best-effort */})
    }
  }
}
