import type { SupabaseClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'

export type BioTier = 'free' | 'bio' | 'pro' | 'admin'
export type BioCredit = 'generate' | 'refine' | 'css' | 'none'

interface Limits {
  generates: number     // -1 = unlimited
  refines: number
  css_tweaks: number
  is_monthly: boolean   // true → pro (resets monthly), false → bio (lifetime) / free
}

const TIER_LIMITS: Record<BioTier, Limits> = {
  free:  { generates: 0,  refines: 0,  css_tweaks: 0,  is_monthly: false },
  bio:   { generates: 3,  refines: 5,  css_tweaks: 20, is_monthly: false },
  pro:   { generates: 5,  refines: 15, css_tweaks: 20, is_monthly: true  },
  admin: { generates: -1, refines: -1, css_tweaks: -1, is_monthly: true  },
}

export interface QuotaState {
  tier: BioTier
  generates_used: number
  refines_used: number
  css_tweaks_used: number
  generates_limit: number
  refines_limit: number
  css_tweaks_limit: number
  is_monthly: boolean
  period_start: string | null
  is_locked: boolean
  can_generate: boolean
  can_expensive_refine: boolean
  can_css_tweak: boolean
}

function detectTier(
  row: { is_pro: boolean; has_bio_purchase?: boolean | null } | null,
  email: string,
): BioTier {
  if (isAdminEmail(email)) return 'admin'
  if (row?.is_pro) return 'pro'
  if (row?.has_bio_purchase) return 'bio'
  return 'free'
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return Infinity
  return (Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000)
}

async function maybeResetPeriod(
  supabase: SupabaseClient,
  userId: string,
  tier: BioTier,
  periodStart: string | null,
): Promise<boolean> {
  if (tier === 'free' || tier === 'admin') return false
  if (daysSince(periodStart) < 28) return false

  const today = new Date().toISOString().split('T')[0]
  const updates: Record<string, unknown> = {
    bio_usage_period_start: today,
    bio_css_tweaks_used: 0,
  }
  // Pro: reset all monthly counters. Bio: only CSS tweaks (generates + refines are lifetime).
  if (tier === 'pro') {
    updates.bio_generates_used = 0
    updates.bio_refines_used = 0
  }
  // Counter columns are not in the authenticated RLS grant (users must not be
  // able to zero their own counters), so the reset must go through admin client.
  await createAdminClient().from('users').update(updates).eq('id', userId)
  return true
}

export async function getQuotaState(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
): Promise<QuotaState> {
  const cols = 'is_pro,has_bio_purchase,bio_generates_used,bio_refines_used,bio_css_tweaks_used,bio_usage_period_start,bio_active_job'
  const { data: row } = await supabase.from('users').select(cols).eq('id', userId).single()

  const tier = detectTier(row, userEmail)
  const limits = TIER_LIMITS[tier]

  const reset = await maybeResetPeriod(supabase, userId, tier, row?.bio_usage_period_start ?? null)
  let fresh = row
  if (reset) {
    const { data } = await supabase.from('users').select(cols).eq('id', userId).single()
    fresh = data
  }

  const gu = fresh?.bio_generates_used ?? 0
  const ru = fresh?.bio_refines_used ?? 0
  const cu = fresh?.bio_css_tweaks_used ?? 0

  return {
    tier,
    generates_used: gu,
    refines_used: ru,
    css_tweaks_used: cu,
    generates_limit: limits.generates,
    refines_limit: limits.refines,
    css_tweaks_limit: limits.css_tweaks,
    is_monthly: limits.is_monthly,
    period_start: fresh?.bio_usage_period_start ?? null,
    is_locked: fresh?.bio_active_job ?? false,
    can_generate: limits.generates === -1 || gu < limits.generates,
    can_expensive_refine: limits.refines === -1 || ru < limits.refines,
    can_css_tweak: limits.css_tweaks === -1 || cu < limits.css_tweaks,
  }
}

// Acquire job lock atomically. Returns true if we got the lock, false if busy.
export async function acquireJobLock(supabase: SupabaseClient, userId: string): Promise<boolean> {
  // Release stale locks (job started > 12 min ago — server must have crashed).
  const staleTs = new Date(Date.now() - 12 * 60 * 1000).toISOString()
  await supabase
    .from('users')
    .update({ bio_active_job: false })
    .eq('id', userId)
    .eq('bio_active_job', true)
    .lt('bio_last_job_start_at', staleTs)

  // CAS: only update if bio_active_job is currently false.
  const { data } = await supabase
    .from('users')
    .update({ bio_active_job: true, bio_last_job_start_at: new Date().toISOString() })
    .eq('id', userId)
    .eq('bio_active_job', false)
    .select('id')

  return Array.isArray(data) && data.length > 0
}

export async function releaseJobLock(supabase: SupabaseClient, userId: string): Promise<void> {
  await supabase.from('users').update({ bio_active_job: false }).eq('id', userId)
}

// Atomically increment the appropriate usage counter via the Postgres function.
export async function incrementUsage(
  supabase: SupabaseClient,
  userId: string,
  credit: BioCredit,
): Promise<void> {
  if (credit === 'none') return
  // Uses the SECURITY DEFINER function created in bio-quota-columns.sql.
  await supabase.rpc('bio_increment_usage', { p_user_id: userId, p_credit: credit })
}

// Human-readable remaining credit string for the UI.
export function remainingLabel(quota: QuotaState): string {
  if (quota.tier === 'admin') return 'Unlimited'
  if (quota.tier === 'free') return 'Upgrade required'
  const tag = quota.is_monthly ? '/month' : ' total'
  const gen = quota.generates_limit - quota.generates_used
  const ref = quota.refines_limit - quota.refines_used
  return `${gen} generation${gen !== 1 ? 's' : ''}${tag} · ${ref} AI refine${ref !== 1 ? 's' : ''}${tag}`
}
