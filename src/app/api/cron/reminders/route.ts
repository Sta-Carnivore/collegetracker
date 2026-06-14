import { createAdminClient } from '@/lib/supabase/admin'
import { computePlannerEvents } from '@/lib/reminders'
import { getReminderSendOffsets } from '@/lib/reminderSeverity'
import { sendReminderEmail } from '@/lib/email'
import type { Application, School, SchoolRound } from '@/types/database'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const offsets = new Set(getReminderSendOffsets())

  // Fetch all reference data in parallel
  const [usersRes, appsRes, schoolsRes, roundsRes] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('applications').select('*'),
    admin.from('schools').select('*'),
    admin.from('school_rounds').select('*'),
  ])

  if (usersRes.error) {
    console.error('[cron:reminders] listUsers error:', usersRes.error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

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

  for (const user of usersRes.data.users) {
    if (!user.email) { skipped++; continue }

    const userApps = appsByUser[user.id] ?? []
    if (userApps.length === 0) { skipped++; continue }

    const events = computePlannerEvents({ applications: userApps, schoolsById, roundsBySchool })

    const dueToday = events.filter(e =>
      e.kind === 'deadline' && offsets.has(e.daysUntil),
    )
    if (dueToday.length === 0) { skipped++; continue }

    const items = dueToday.map(e => ({
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
      to: user.email,
      subject: `${items.length} deadline${plural ? 's' : ''} coming up — ApplyTracker`,
      items,
    })

    if (result.sent) sent++
    else { errors++; console.warn('[cron:reminders] failed for', user.email, result.reason) }
  }

  console.log(`[cron:reminders] done — sent:${sent} skipped:${skipped} errors:${errors}`)
  return NextResponse.json({ ok: true, sent, skipped, errors })
}
