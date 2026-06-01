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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { school_id, status, supplemental_essays_done, application_type, intended_major, notes, portal_url } = body

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
    if (application_type !== undefined) update.application_type = application_type
    if (intended_major !== undefined) update.intended_major = intended_major
    if (notes !== undefined) update.notes = notes
    if (portal_url !== undefined) update.portal_url = portal_url

    await supabase.from('applications').update(update).eq('id', existing.id)
  } else {
    await supabase.from('applications').insert({
      user_id: user.id,
      school_id,
      status: status ?? 'not_started',
      application_type: application_type ?? null,
      intended_major: intended_major ?? null,
      notes: notes ?? null,
      portal_url: portal_url ?? null,
      updated_at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true })
}
