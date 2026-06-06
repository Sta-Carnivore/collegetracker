import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const dynamic = 'force-dynamic'

export async function POST() {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users').select('is_pro').eq('id', user.id).single()

  if (!userData?.is_pro) {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 })
  }

  const { data: applications } = await supabase
    .from('applications')
    .select('*, schools(*)')
    .eq('user_id', user.id)

  if (!applications || applications.length === 0) {
    return NextResponse.json({ error: 'No applications found. Add schools to your dashboard first.' }, { status: 400 })
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

  try {
    const strategy = JSON.parse(jsonStr)
    return NextResponse.json({ strategy })
  } catch {
    return NextResponse.json({ error: 'Failed to parse strategy. Please try again.' }, { status: 500 })
  }
}
