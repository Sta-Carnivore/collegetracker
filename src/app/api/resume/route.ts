import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { extractText } from 'unpdf'
import { ParsedResume } from '@/types/database'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert college application advisor. Extract structured information from a student's resume and return it as JSON only — no explanation, no markdown, just raw JSON.`

const USER_PROMPT = (text: string) => `Extract the following fields from this resume text. Return only a JSON object with this exact schema:

{
  "education": [{ "school": string, "gpa": string, "graduation": string }],
  "activities": [{ "name": string, "role": string, "description": string, "years": string }],
  "awards": [{ "name": string, "level": string, "year": string }],
  "work_experience": [{ "company": string, "role": string, "description": string, "period": string }],
  "skills": [string]
}

Resume text:
${text}`

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check monthly limit (10 calls/month for free users)
  const { data: userData } = await supabase
    .from('users')
    .select('is_pro, ai_resume_calls_this_month')
    .eq('id', user.id)
    .single()

  if (!userData?.is_pro && (userData?.ai_resume_calls_this_month ?? 0) >= 10) {
    return NextResponse.json({ error: 'Monthly AI resume limit reached (10/month)' }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate file
  const allowedTypes = ['application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
  }

  // Extract text from PDF
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  let resumeText: string
  try {
    const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true })
    resumeText = Array.isArray(text) ? text.join('\n') : text
  } catch {
    return NextResponse.json({ error: 'Could not read PDF. Please try a different file.' }, { status: 422 })
  }

  if (!resumeText.trim()) {
    return NextResponse.json({ error: 'PDF appears to be empty or image-only.' }, { status: 422 })
  }

  // Upload to Supabase Storage
  const filePath = `${user.id}/resume.pdf`
  await supabase.storage.from('resumes').upload(filePath, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })

  // Call Claude for structured extraction
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT(resumeText) }],
  })

  const raw = (message.content[0] as { type: string; text: string }).text.trim()
  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  let parsed: ParsedResume
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 })
  }

  // Save to profiles
  await supabase.from('profiles').upsert({
    user_id: user.id,
    resume_raw_text: resumeText,
    resume_parsed: parsed,
    updated_at: new Date().toISOString(),
  })

  // Increment usage counter
  await supabase.from('users').update({
    ai_resume_calls_this_month: (userData?.ai_resume_calls_this_month ?? 0) + 1,
  }).eq('id', user.id)

  return NextResponse.json({ parsed })
}
