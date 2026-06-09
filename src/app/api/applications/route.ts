import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const school_id = searchParams.get('school_id')
  if (!school_id) return NextResponse.json({ error: 'school_id required' }, { status: 400 })

  await supabase.from('applications').delete().eq('user_id', user.id).eq('school_id', school_id)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    console.error('[applications GET]', error.message)
    return NextResponse.json({ error: 'Could not load applications.' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    school_id, status, supplemental_essays_done, application_type, intended_major, notes, portal_url,
    // Per-user overrides of the global school reference data (admin-only to edit globally).
    deadline_ea, deadline_ed, deadline_rd, notification_date, notification_ea, notification_ed,
    supplemental_essays_total,
  } = body

  if (!school_id || typeof school_id !== 'string') {
    return NextResponse.json({ error: 'school_id required' }, { status: 400 })
  }

  // Normalize an optional date string: '' → null, otherwise pass through.
  const dateOrNull = (v: unknown) => (v === undefined ? undefined : (v ? v : null))
  const intOrNull = (v: unknown) => (v === undefined ? undefined : (v === null || v === '' ? null : Number(v)))

  const { data: existing } = await supabase
    .from('applications')
    .select('id')
    .eq('user_id', user.id)
    .eq('school_id', school_id)
    .single()

  // Assemble only the fields that were actually provided.
  const fields: Record<string, unknown> = {}
  if (status !== undefined) fields.status = status
  if (supplemental_essays_done !== undefined) fields.supplemental_essays_done = supplemental_essays_done
  if (application_type !== undefined) fields.application_type = application_type
  if (intended_major !== undefined) fields.intended_major = intended_major
  if (notes !== undefined) fields.notes = notes
  if (portal_url !== undefined) fields.portal_url = portal_url
  if (dateOrNull(deadline_ea) !== undefined) fields.deadline_ea = dateOrNull(deadline_ea)
  if (dateOrNull(deadline_ed) !== undefined) fields.deadline_ed = dateOrNull(deadline_ed)
  if (dateOrNull(deadline_rd) !== undefined) fields.deadline_rd = dateOrNull(deadline_rd)
  if (dateOrNull(notification_date) !== undefined) fields.notification_date = dateOrNull(notification_date)
  if (dateOrNull(notification_ea) !== undefined) fields.notification_ea = dateOrNull(notification_ea)
  if (dateOrNull(notification_ed) !== undefined) fields.notification_ed = dateOrNull(notification_ed)
  if (intOrNull(supplemental_essays_total) !== undefined) fields.supplemental_essays_total = intOrNull(supplemental_essays_total)

  if (existing) {
    await supabase.from('applications')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await supabase.from('applications').insert({
      user_id: user.id,
      school_id,
      status: status ?? 'not_started',
      application_type: application_type ?? null,
      intended_major: intended_major ?? null,
      notes: notes ?? null,
      portal_url: portal_url ?? null,
      ...fields,
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true })
}
