import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
