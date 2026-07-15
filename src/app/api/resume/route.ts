import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { GapItem, ParsedResume } from '@/types/database'
import { ProxyAgent, fetch as undiciFetch } from 'undici'
import { getAiQuota, acquireAiLock, releaseAiLock, incrementAiUsage, aiLimitMessage } from '@/lib/aiQuota'

export const dynamic = 'force-dynamic'

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined
const proxiedFetch = dispatcher
  ? (url: string, init?: RequestInit) => undiciFetch(url, { ...(init as any), dispatcher } as any) as any
  : undefined

const SYSTEM_PROMPT = `You are a college admissions advisor. Direct, objective, zero softening language. No praise.
Your job: extract the student's resume into structured fields, identify prioritized gaps, then reformat their existing resume.
Return only valid JSON — no markdown fences, no explanation. Be concise — total output under 3200 tokens.`

function buildUserPrompt(
  rawText: string,
  major: string,
  gpa: string,
  sat: string,
  act: string,
  schools: string,
) {
  return `Student profile:
- Intended major: ${major}
- GPA: ${gpa} | SAT: ${sat} | ACT: ${act}
- Target schools: ${schools}

Current resume:
${rawText}

---
STEP 1 — Internally assess the student's competitive tier (do NOT output this):
- REACH: GPA ≥ 3.9, SAT ≥ 1480 (or ACT ≥ 33), 3+ substantive extracurriculars already listed
- MID: GPA 3.4–3.89, SAT 1200–1479 (or ACT 27–32), some activities
- FOUNDATION: GPA < 3.4, SAT < 1200 (or ACT < 27), few or weak activities

Calibrate ALL gap recommendations strictly to what is realistically accessible at their tier:
- REACH → selective national programs (REU, top-tier competitions like USAMO/AMC 10 finals, selective summer institutes, faculty research with publication aim)
- MID → regional competitions, community college dual enrollment, local university lab volunteering, accessible programs (not Ivy-adjacent), school newspapers/clubs in the field
- FOUNDATION → improve GPA/test scores first, school clubs, local volunteering in the field, free online certifications, community college classes

If the student has no score data (not provided), assume MID tier.

STEP 2 — Return this exact JSON shape:
{
  "education": [
    { "school": "school name", "gpa": "GPA if stated, else omit", "graduation": "grad year/month if stated, else omit" }
  ],
  "activities": [
    { "name": "club/activity name", "role": "their role/position, else \\"\\"", "description": "what they did, 1 sentence from the resume", "years": "years/grades involved, else \\"\\"" }
  ],
  "awards": [
    { "name": "award name", "level": "school/regional/state/national/international, else \\"\\"", "year": "year if stated, else \\"\\"" }
  ],
  "work_experience": [
    { "company": "employer", "role": "job title", "description": "what they did, 1 sentence from the resume", "period": "dates if stated, else \\"\\"" }
  ],
  "skills": ["skill", "skill"],
  "gaps": [
    {
      "what": "label, max 5 words",
      "how": "1–2 sentences. Name real programs/orgs/strategies. No generic advice."
    }
  ],
  "reformatted": "full resume in clean markdown"
}

EXTRACTION rules (education, activities, awards, work_experience, skills):
- Extract ONLY what is actually present in the resume. Never invent, infer, or pad. Use the student's own wording, condensed.
- If a section has no items in the resume, return an empty array [] for it.
- Keep each description to a single concise sentence drawn from the resume.
- An item belongs in work_experience if it is a paid/professional job or internship; otherwise clubs, sports, volunteering, and leadership go in activities.

Gap rules — STRICT PRIORITY ORDER (do not mix tiers):
1. ACADEMICS (GPA + STANDARDIZED TESTS) — check both. If GPA is below 3.7 unweighted or SAT is below the 25th percentile of target schools (or below 1350 if no schools listed), this is gap #1. State the exact score gap and give a concrete improvement path (Khan Academy SAT, specific retake timeline, grade recovery strategy). If both GPA and SAT need work, list GPA first then SAT as a combined first gap.
2. ACTIVITIES & LEADERSHIP — missing major-relevant activity, or existing activity with zero leadership. If student already has an activity (e.g. band, robotics, swim), suggest a concrete leadership angle specific to what they have: start a chapter, lead a team, organize a competition. Do not suggest they "join" something they already do.
3. COMPETITIONS — only after activities are addressed. Name real competitions for the major at their tier.
4. EXTRAS — research, certifications, internships. Only if space remains.

Additional rules:
- 4–6 gaps total, following priority order above
- Only things to ADD, not critiques of existing items
- "how" must name actual programs/orgs, not categories
- Never use: consider, might, could, great, impressive, strong, good start, explore
- Never recommend programs above their tier
- Look at existing activities for creative leadership suggestions — if they play an instrument, run a club; if they code, open-source contribution or hackathon

Reformat rules:
- Use only existing content — nothing added or invented
- Section order: Name/Contact → Education → Experience → Activities → Awards → Skills
- Clean headers (## for sections), dashes (- ) for bullets, **bold** for role titles and school names
- Remove visual noise, keep it minimal and professional`
}

export async function POST(request: NextRequest) {
  let step = 'init'
  const supabase = await createClient()
  let userId = ''
  let lockAcquired = false
  let parsedOk = false
  try {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(proxiedFetch ? { fetch: proxiedFetch as any } : {}),
  })
  step = 'auth'
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  userId = user.id

  // Quota: monthly cap (free 3 / pro 20) + concurrency lock, atomic increment.
  step = 'quota'
  const quota = await getAiQuota(supabase, user.id, user.email ?? '', 'resume')
  if (quota.is_locked) {
    return NextResponse.json({ error: 'A resume is already being analyzed. Please wait for it to finish.' }, { status: 429 })
  }
  if (!quota.can_use) {
    return NextResponse.json({ error: aiLimitMessage(quota) }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ]
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF and Word (.docx) files are accepted' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  // Take the per-user lock now that the request is valid (prevents firing many
  // concurrent paid parses). Released in finally.
  lockAcquired = await acquireAiLock(supabase, user.id, 'resume')
  if (!lockAcquired) {
    return NextResponse.json({ error: 'A resume is already being analyzed. Please wait for it to finish.' }, { status: 429 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || file.type === 'application/msword'

  let resumeText: string
  try {
    if (isDocx) {
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      resumeText = result.value
    } else {
      const { extractText } = await import('unpdf')
      const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
      resumeText = Array.isArray(text) ? text.join('\n') : text
    }
  } catch {
    return NextResponse.json({ error: 'Could not read file. Please try a different file.' }, { status: 422 })
  }

  if (!resumeText.trim()) {
    return NextResponse.json({ error: 'File appears to be empty or image-only.' }, { status: 422 })
  }

  step = 'storage'
  // Upload to storage
  const ext = isDocx ? 'docx' : 'pdf'
  const filePath = `${user.id}/resume.${ext}`
  const { error: uploadErr } = await supabase.storage.from('resumes').upload(filePath, buffer, {
    contentType: file.type,
    upsert: true,
  })
  if (uploadErr) {
    // Don't fail the whole request (the parse below is the valuable part), but
    // log it so a broken bucket/policy is visible instead of silently swallowed.
    console.error('[resume] storage upload failed:', uploadErr.message)
  }

  step = 'fetchProfile'
  // Fetch profile context + target schools
  const [{ data: profile }, { data: applications }] = await Promise.all([
    supabase.from('profiles').select('gpa, sat_score, act_score, intended_major, intended_majors').eq('user_id', user.id).single(),
    supabase.from('applications').select('school_id, application_type, intended_major, schools(name, acceptance_rate)').eq('user_id', user.id),
  ])

  const major = profile?.intended_major ?? (profile?.intended_majors?.[0]) ?? 'undecided'
  const gpa = profile?.gpa ? String(profile.gpa) : 'not provided'
  const sat = profile?.sat_score ? String(profile.sat_score) : 'not provided'
  const act = profile?.act_score ? String(profile.act_score) : 'not provided'

  const schoolLines = (applications ?? [])
    .map((a: any) => {
      const s = a.schools
      if (!s) return null
      const rate = s.acceptance_rate ? `${s.acceptance_rate}% admit` : 'rate unknown'
      const round = a.application_type ?? 'RD'
      return `${s.name} (${rate}, ${round})`
    })
    .filter(Boolean)
    .join(', ')

  const schools = schoolLines || 'not specified'

  step = 'anthropic'
  // Run gap analysis + reformat
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(resumeText, major, gpa, sat, act, schools) }],
  })

  step = 'parseJson'
  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  // Extract the outermost JSON object — more robust than stripping fences only.
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let analysisResult: Partial<ParsedResume> & { gaps: GapItem[]; reformatted: string }
  try {
    analysisResult = JSON.parse(jsonStr)
  } catch {
    console.error('[resume] JSON parse failed. stop_reason:', message.stop_reason, '| raw[:300]:', raw.slice(0, 300))
    return NextResponse.json({ error: 'AI returned invalid response. Please try again.' }, { status: 500 })
  }

  const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])
  const parsed: ParsedResume = {
    education: arr<ParsedResume['education'][number]>(analysisResult.education),
    activities: arr<ParsedResume['activities'][number]>(analysisResult.activities),
    awards: arr<ParsedResume['awards'][number]>(analysisResult.awards),
    work_experience: arr<ParsedResume['work_experience'][number]>(analysisResult.work_experience),
    skills: arr<string>(analysisResult.skills),
    gaps: analysisResult.gaps,
    reformatted: analysisResult.reformatted,
  }

  // Save
  await supabase.from('profiles').upsert({
    user_id: user.id,
    resume_raw_text: resumeText,
    resume_parsed: parsed,
    updated_at: new Date().toISOString(),
  })

  // Atomic increment of the monthly counter (only on success).
  parsedOk = true

  return NextResponse.json({ parsed })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[resume] failed at step ${step}:`, msg)
    return NextResponse.json({ error: 'Resume analysis failed. Please try again.' }, { status: 500 })
  } finally {
    if (lockAcquired && userId) await releaseAiLock(supabase, userId, 'resume')
    if (parsedOk && userId) await incrementAiUsage(supabase, userId, 'resume').catch(() => {})
  }
}
