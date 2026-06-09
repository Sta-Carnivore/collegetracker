import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'

// The `schools` table is GLOBAL reference data shared by every user. Writing to
// it changes deadlines/essay counts for EVERYONE, so this route is admin-only.
// Students who want a personal deadline edit it on their own application row
// (PATCH /api/applications), which the UI prefers over the school's value.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden: school reference data is admin-only.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { deadline_ea, deadline_ed, deadline_rd, notification_date, notification_ea, notification_ed, supplemental_essay_count } = body

  const update: Record<string, unknown> = {}
  if (deadline_ea !== undefined) update.deadline_ea = deadline_ea || null
  if (deadline_ed !== undefined) update.deadline_ed = deadline_ed || null
  if (deadline_rd !== undefined) update.deadline_rd = deadline_rd || null
  if (notification_date !== undefined) update.notification_date = notification_date || null
  if (notification_ea !== undefined) update.notification_ea = notification_ea || null
  if (notification_ed !== undefined) update.notification_ed = notification_ed || null
  if (supplemental_essay_count !== undefined) update.supplemental_essay_count = Number(supplemental_essay_count)

  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true })

  const admin = createAdminClient()
  const { error } = await admin.from('schools').update(update).eq('id', id)
  if (error) {
    console.error('[schools PATCH]', error.message)
    return NextResponse.json({ error: 'Could not update school.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
