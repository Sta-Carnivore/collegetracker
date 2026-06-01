import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { full_name, graduation_year, gpa, sat_score, act_score, intended_majors, complete } = body

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (full_name !== undefined) updates.full_name = full_name
  if (graduation_year !== undefined) updates.graduation_year = graduation_year
  if (gpa !== undefined) updates.gpa = gpa
  if (sat_score !== undefined) updates.sat_score = sat_score
  if (act_score !== undefined) updates.act_score = act_score
  if (intended_majors !== undefined) updates.intended_majors = intended_majors
  if (complete) updates.onboarding_completed = true

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
