import { createAdminClient } from '@/lib/supabase/admin'
import { computePlannerEvents, daysFromNow } from '@/lib/reminders'
import { getReminderSendOffsets, calculateReminderScore } from '@/lib/reminderSeverity'
import { sendReminderEmail } from '@/lib/email'
import type { Application, School, SchoolRound } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const tokenParam = request.nextUrl.searchParams.get('secret')
  const token = auth?.replace('Bearer ', '') ?? tokenParam ?? ''
  if (!process.env.CRON_SECRET || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const offsets = new Set(getReminderSendOffsets())

  // Only users who are pro AND have opted in to email reminders
  const { data: eligibleUsers, error: usersError } = await admin
    .from('users')
    .select('id, reminder_email_enabled')
    .eq('is_pro', true)
    .eq('reminder_email_enabled', true)

  if (usersError) {
    console.error('[cron:reminders] users query error:', usersError)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
  if (!eligibleUsers || eligibleUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0, errors: 0 })
  }

  const eligibleIds = eligibleUsers.map(u => u.id)

  // Fetch applications first, then only the schools/rounds we actually need
  const appsRes = await admin.from('applications').select('*').in('user_id', eligibleIds)

  const schoolIds = [...new Set((appsRes.data ?? []).map(a => a.school_id).filter(Boolean))]
  const [schoolsRes, roundsRes] = await Promise.all([
    schoolIds.length > 0
      ? admin.from('schools').select('*').in('id', schoolIds)
      : Promise.resolve({ data: [], error: null }),
    schoolIds.length > 0
      ? admin.from('school_rounds').select('*').in('school_id', schoolIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  const schoolsById: Record<string, School> = {}
  for (const s of (schoolsRes.data ?? []) as School[]) schoolsById[s.id] = s

  const roundsBySchool: Record<string, SchoolRound[]> = {}
  for (const r of (roundsRes.data ?? []) as SchoolRound[]) {
    ;(roundsBySchool[r.school_id] ??= []).push(r)
  }

  const appsByUser: Record<string, Application[]> = {}
  for (const app of (appsRes.data ?? []) as Application[]) {
    ;(appsByUser[app.user_id] ??= []).push(app)
  }

  let sent = 0, skipped = 0, errors = 0

  for (const { id: user_id } of eligibleUsers) {
    const userApps = appsByUser[user_id] ?? []
    if (userApps.length === 0) { console.log(`[cron:reminders] ${user_id} skip — no apps`); skipped++; continue }

    const events = computePlannerEvents({ applications: userApps, schoolsById, roundsBySchool })
    console.log(`[cron:reminders] ${user_id} apps:${userApps.length} events:${events.length} deadlines:${events.filter(e=>e.kind==='deadline').map(e=>`${e.schoolName}(${e.daysUntil}d)`).join(',')}`)

    // Events that fire today (daysUntil matches a send offset)
    const todayEvents = events.filter(e =>
      e.kind === 'deadline' && offsets.has(e.daysUntil),
    )
    if (todayEvents.length === 0) { skipped++; continue }

    // Check idempotency — skip events already delivered at this offset
    const { data: existing } = await admin
      .from('reminder_email_deliveries')
      .select('event_key, offset_days')
      .eq('user_id', user_id)
      .eq('status', 'sent')
      .in('event_key', todayEvents.map(e => e.key))

    const alreadySent = new Set(
      (existing ?? []).map(r => `${r.event_key}:${r.offset_days}`),
    )

    const newEvents = todayEvents.filter(
      e => !alreadySent.has(`${e.key}:${e.daysUntil}`),
    )
    if (newEvents.length === 0) { skipped++; continue }

    // Get the user's email from auth
    const { data: authUser } = await admin.auth.admin.getUserById(user_id)
    const email = authUser?.user?.email
    if (!email) { skipped++; continue }

    const items = newEvents.map(e => ({
      title: `${e.schoolName} — ${e.round}`,
      dueAt: e.dueAt,
      whenLabel: e.daysUntil === 0
        ? 'Due today'
        : e.daysUntil === 1
          ? 'Tomorrow'
          : `${e.daysUntil} days away`,
    }))

    const plural = items.length !== 1
    const result = await sendReminderEmail({
      to: email,
      subject: `${items.length} deadline${plural ? 's' : ''} coming up — ApplyTracker`,
      items,
    })

    // Record delivery status for each event (idempotency)
    const deliveryRows = newEvents.map(e => ({
      user_id,
      event_key: e.key,
      offset_days: e.daysUntil,
      scheduled_for: new Date().toISOString(),
      severity_score: calculateReminderScore({ daysUntil: e.daysUntil, kind: e.kind }),
      status: result.sent ? 'sent' : 'failed',
      ...(result.sent ? { sent_at: new Date().toISOString() } : {}),
    }))

    await admin
      .from('reminder_email_deliveries')
      .upsert(deliveryRows, { onConflict: 'user_id,event_key,offset_days', ignoreDuplicates: false })

    if (result.sent) { sent++ }
    else { errors++; console.warn('[cron:reminders] failed for', email, result.reason) }
  }

  console.log(`[cron:reminders] done — sent:${sent} skipped:${skipped} errors:${errors}`)
  return NextResponse.json({ ok: true, sent, skipped, errors })
}
