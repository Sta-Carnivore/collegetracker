import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Record a user's interaction with a derived planner event (dismiss / restore).
// The in-app feed is computed live from deadlines; this only stores the override.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const action = body.action ?? 'dismiss'

  // ── Create a user-defined custom event (no school) ────────────────────────
  if (action === 'create_custom') {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const due_at = body.due_at
    if (!title || !due_at || Number.isNaN(Date.parse(due_at))) {
      return NextResponse.json({ error: 'A name and a valid date are required.' }, { status: 400 })
    }
    if (title.length > 120) {
      return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('reminders')
      .insert({ user_id: user.id, school_id: null, round: null, kind: 'custom', title, due_at, status: 'active' })
      .select('id, title, due_at')
      .single()
    if (error) {
      console.error('[reminders]', error.message)
      return NextResponse.json({ error: 'Could not add event.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true, event: data })
  }

  // ── Edit a custom event (name and/or date) ───────────────────────────────
  if (action === 'update_custom') {
    const { id } = body
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const due_at = body.due_at
    if (!id || !title || !due_at || Number.isNaN(Date.parse(due_at))) {
      return NextResponse.json({ error: 'id, a name and a valid date are required.' }, { status: 400 })
    }
    if (title.length > 120) {
      return NextResponse.json({ error: 'Name is too long.' }, { status: 400 })
    }
    const { error } = await supabase
      .from('reminders').update({ title, due_at })
      .eq('id', id).eq('user_id', user.id).eq('kind', 'custom')
    if (error) {
      console.error('[reminders]', error.message)
      return NextResponse.json({ error: 'Could not update event.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // ── Dismiss / restore a custom event (soft — the row IS the event) ────────
  if (action === 'set_custom_status') {
    const { id, status } = body
    if (!id || !['active', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'id and a valid status are required' }, { status: 400 })
    }
    const { error } = await supabase
      .from('reminders').update({ status }).eq('id', id).eq('user_id', user.id).eq('kind', 'custom')
    if (error) {
      console.error('[reminders]', error.message)
      return NextResponse.json({ error: 'Could not update event.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // ── Restore a previously dismissed derived event ──────────────────────────
  // Derived events are recomputed live, so removing the override row makes the
  // event active again.
  if (action === 'restore') {
    const { school_id, round, kind } = body
    if (!school_id || !kind) {
      return NextResponse.json({ error: 'school_id and kind are required' }, { status: 400 })
    }
    let q = supabase.from('reminders').delete().eq('user_id', user.id).eq('school_id', school_id).eq('kind', kind)
    q = round == null ? q.is('round', null) : q.eq('round', round)
    const { error } = await q
    if (error) {
      console.error('[reminders]', error.message)
      return NextResponse.json({ error: 'Could not restore reminder.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  // ── Dismiss a derived event (default) ─────────────────────────────────────
  const { school_id, round, kind, title, due_at, status } = body
  if (!school_id || !kind || !title) {
    return NextResponse.json({ error: 'school_id, kind and title are required' }, { status: 400 })
  }
  const validStatus = ['active', 'dismissed', 'done']
  const st = validStatus.includes(status) ? status : 'dismissed'

  const { error } = await supabase.from('reminders').upsert(
    {
      user_id: user.id,
      school_id,
      round: round ?? null,
      kind,
      title,
      due_at: due_at ?? null,
      status: st,
    },
    { onConflict: 'user_id,school_id,round,kind' },
  )
  if (error) {
    console.error('[reminders]', error.message)
    return NextResponse.json({ error: 'Could not update reminder.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
