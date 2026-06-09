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

  // Advisor pool (shared with /api/ai/recommend): pro 30/month, monthly reset,
  // concurrency lock, atomic increment. Free tier limit is 0 → Pro-gated.
  const quota = await getAiQuota(supabase, user.id, user.email ?? '', 'advisor')
  if (quota.is_locked) {
    return NextResponse.json({ error: 'An AI advisor run is already in progress. Please wait.' }, { status: 429 })
  }
  if (!quota.can_use) {
    return NextResponse.json({ error: aiLimitMessage(quota) }, { status: quota.tier === 'free' ? 403 : 429 })
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('*, schools(*)')
    .eq('user_id', user.id)

  if (!applications || applications.length === 0) {
    return NextResponse.json({ error: 'No applications found. Add schools to your dashboard first.' }, { status: 400 })
  }

  lockAcquired = await acquireAiLock(supabase, user.id, 'advisor')
  if (!lockAcquired) {
    return NextResponse.json({ error: 'An AI advisor run is already in progress. Please wait.' }, { status: 429 })
  }

  const today = new Date().toISOString().split('T')[0]

  const appSummary = applications.map(a => {
    const school = a.schools as { name: string; deadline_ea: string | null; deadline_ed: string | null; deadline_rd: string | null; supplemental_essay_count: number } | null
    return `${school?.name} | Type: ${a.application_type ?? 'TBD'} | Status: ${a.status} | Supplementals: ${a.supplemental_essays_done}/${school?.supplemental_essay_count ?? 0} | RD Deadline: ${school?.deadline_rd ?? 'N/A'} | EA: ${school?.deadline_ea ?? 'N/A'} | ED: ${school?.deadline_ed ?? 'N/A'}`
  }).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: `You are an expert US college admissions counselor. Analyze the student's application status and generate a prioritized action plan. Return only a JSON object, no markdown.`,
    messages: [{
      role: 'user',
      content: `Today's date: ${today}

Student's applications:
${appSummary}

Return a JSON object with this schema:
{
  "summary": string (1-2 sentence overall assessment),
  "urgent": [{ "task": string, "reason": string }],
  "this_week": [{ "task": string, "reason": string }],
  "upcoming": [{ "task": string, "reason": string }],
  "at_risk": [{ "school": string, "issue": string }]
}

urgent = must do in next 3 days
this_week = should do this week
upcoming = plan for next 2-4 weeks
at_risk = schools where the student may miss deadlines or is underprepared`
    }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

  let strategy: unknown
  try {
    strategy = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'Failed to parse strategy. Please try again.' }, { status: 500 })
  }
  ok = true
  return NextResponse.json({ strategy })
  } catch (err) {
    console.error('[strategy] failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Strategy generation failed. Please try again.' }, { status: 500 })
  } finally {
    if (lockAcquired && userId) await releaseAiLock(supabase, userId, 'advisor')
    if (ok && userId) await incrementAiUsage(supabase, userId, 'advisor').catch(() => {})
  }
}
