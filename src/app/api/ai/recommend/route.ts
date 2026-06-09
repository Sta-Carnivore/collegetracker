import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ProxyAgent, fetch as undiciFetch } from 'undici'
import { getAiQuota, acquireAiLock, releaseAiLock, incrementAiUsage, aiLimitMessage } from '@/lib/aiQuota'

export const dynamic = 'force-dynamic'

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined
const proxiedFetch = dispatcher
  ? (url: string, init?: RequestInit) => undiciFetch(url, { ...(init as any), dispatcher } as any) as any
  : undefined

export async function POST() {
  const supabase = await createClient()
  let userId = ''
  let lockAcquired = false
  let ok = false
  try {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    ...(proxiedFetch ? { fetch: proxiedFetch as any } : {}),
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  userId = user.id

  // Advisor pool (shared with /api/ai/strategy): pro 30/month, monthly reset,
  // concurrency lock, atomic increment. Free tier limit is 0 → Pro-gated.
  const quota = await getAiQuota(supabase, user.id, user.email ?? '', 'advisor')
  if (quota.is_locked) {
    return NextResponse.json({ error: 'An AI advisor run is already in progress. Please wait.' }, { status: 429 })
  }
  if (!quota.can_use) {
    return NextResponse.json({ error: aiLimitMessage(quota) }, { status: quota.tier === 'free' ? 403 : 429 })
  }

  const [{ data: profile }, { data: schools }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('schools').select('*').order('acceptance_rate'),
  ])

  if (!profile) {
    return NextResponse.json({ error: 'Please upload your resume first to generate recommendations.' }, { status: 400 })
  }

  lockAcquired = await acquireAiLock(supabase, user.id, 'advisor')
  if (!lockAcquired) {
    return NextResponse.json({ error: 'An AI advisor run is already in progress. Please wait.' }, { status: 429 })
  }

  const profileSummary = `
GPA: ${profile.gpa ?? 'not provided'}
SAT: ${profile.sat_score ?? 'not provided'}
ACT: ${profile.act_score ?? 'not provided'}
Intended Major: ${profile.intended_major ?? 'undecided'}
Activities: ${JSON.stringify(profile.activities ?? [])}
Awards: ${JSON.stringify(profile.awards ?? [])}
  `.trim()

  const schoolList = (schools ?? []).map(s =>
    `${s.name} | Acceptance: ${s.acceptance_rate}% | SAT: ${s.sat_25th}-${s.sat_75th} | ACT: ${s.act_25th}-${s.act_75th} | Majors: ${s.popular_majors?.join(', ')}`
  ).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system: `You are an expert US college admissions counselor. Analyze the student's profile and recommend schools. Return only a JSON array, no markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `Student profile:
${profileSummary}

Available schools:
${schoolList}

Return a JSON array of exactly 8 school recommendations, ordered from best fit to reach schools. Each item:
{
  "school_name": string,
  "match_type": "likely" | "match" | "reach",
  "match_score": number (1-10),
  "rationale": string (2-3 sentences explaining why this school fits),
  "strengths": string (what works in the student's favor),
  "concerns": string (what to watch out for)
}`
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let recommendations: unknown
  try {
    recommendations = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'Failed to parse recommendations. Please try again.' }, { status: 500 })
  }
  ok = true
  return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('[recommend] failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Recommendation failed. Please try again.' }, { status: 500 })
  } finally {
    if (lockAcquired && userId) await releaseAiLock(supabase, userId, 'advisor')
    if (ok && userId) await incrementAiUsage(supabase, userId, 'advisor').catch(() => {})
  }
}
