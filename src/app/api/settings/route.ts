import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { full_name, graduation_year, gpa, sat_score, act_score, intended_majors, reminder_email_enabled } = body

  const profileFields = { full_name, graduation_year, gpa, sat_score, act_score, intended_majors }
  const hasProfileFields = Object.values(profileFields).some(v => v !== undefined)

  if (!hasProfileFields && reminder_email_enabled === undefined) {
    return NextResponse.json({ ok: true })
  }

  if (hasProfileFields) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (full_name        !== undefined) updates.full_name        = full_name
    if (graduation_year  !== undefined) updates.graduation_year  = graduation_year
    if (gpa              !== undefined) updates.gpa              = gpa
    if (sat_score        !== undefined) updates.sat_score        = sat_score
    if (act_score        !== undefined) updates.act_score        = act_score
    if (intended_majors  !== undefined) updates.intended_majors  = intended_majors
    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, ...updates }, { onConflict: 'user_id' })
    if (error) {
      console.error('[settings:profile]', error.message)
      return NextResponse.json({ error: 'Could not save your settings.' }, { status: 500 })
    }
  }

  if (reminder_email_enabled !== undefined) {
    const { error } = await supabase
      .from('users')
      .update({ reminder_email_enabled: Boolean(reminder_email_enabled) })
      .eq('id', user.id)
    if (error) {
      console.error('[settings:notifications]', error.message)
      return NextResponse.json({ error: 'Could not save notification settings.' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
