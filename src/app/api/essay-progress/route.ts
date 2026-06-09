import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Toggle a single essay's done state for the current user.
// Also syncs supplemental_essays_done on the application row so the tracker stays in sync.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { school_essay_id, done } = await request.json()
  if (!school_essay_id || typeof done !== 'boolean') {
    return NextResponse.json({ error: 'school_essay_id and done are required' }, { status: 400 })
  }

  const { error } = await supabase.from('user_essay_progress').upsert(
    { user_id: user.id, school_essay_id, done, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,school_essay_id' },
  )
  if (error) {
    console.error('[essay-progress]', error.message)
    return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 })
  }

  // Sync done count → applications.supplemental_essays_done
  const { data: essay } = await supabase
    .from('school_essays').select('school_id').eq('id', school_essay_id).single()

  if (essay) {
    const { data: allEssays } = await supabase
      .from('school_essays').select('id').eq('school_id', essay.school_id)
    const essayIds = (allEssays ?? []).map((e: { id: string }) => e.id)

    const { count: doneCount } = await supabase
      .from('user_essay_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('done', true)
      .in('school_essay_id', essayIds)

    await supabase.from('applications')
      .update({ supplemental_essays_done: doneCount ?? 0, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('school_id', essay.school_id)
  }

  return NextResponse.json({ ok: true })
}
