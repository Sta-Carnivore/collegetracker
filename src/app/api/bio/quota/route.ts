import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getQuotaState } from '@/lib/bioQuota'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const quota = await getQuotaState(supabase, user.id, user.email ?? '')
    return NextResponse.json(quota)
  } catch {
    // If the quota columns don't exist yet (pre-migration), return a permissive
    // default so existing users aren't blocked by a missing migration.
    return NextResponse.json({
      tier: 'pro',
      generates_used: 0, refines_used: 0, css_tweaks_used: 0,
      generates_limit: 5, refines_limit: 15, css_tweaks_limit: 20,
      is_monthly: true, period_start: null, is_locked: false,
      can_generate: true, can_expensive_refine: true, can_css_tweak: true,
    })
  }
}
