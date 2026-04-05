import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { school_id, status, supplemental_essays_done } = body

  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', school_id)
    .single()

  if (existing) {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (status !== undefined) update.status = status
    if (supplemental_essays_done !== undefined) update.supplemental_essays_done = supplemental_essays_done

    await supabase.from('applications').update(update).eq('id', existing.id)
  } else {
    await supabase.from('applications').insert({
      user_id: user.id,
      school_id,
      status: status ?? 'not_started',
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true })
}
