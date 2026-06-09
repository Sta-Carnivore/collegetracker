import type { SupabaseClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'

/**
 * Usage quotas for the non-Bio AI features. Two independent pools:
 *  - 'resume'  : resume parsing            (free 3/mo, pro 20/mo)
 *  - 'advisor' : recommend + strategy      (free 0,    pro 30/mo)
 *
 * Mirrors lib/bioQuota: monthly period reset, atomic RPC increment, and a
 * per-feature concurrency lock so a user can't fire many paid calls at once.
 * Admin (isAdminEmail) is unlimited but still takes the lock (anti-double-click).
 */

export type AiFeature = 'resume' | 'advisor'
export type AiTier = 'free' | 'pro' | 'admin'

interface FeatureConfig {
  counterCol: string
  periodCol: string
  lockCol: string
  lockTsCol: string
  freeLimit: number   // -1 = unlimited
  proLimit: number
  staleMinutes: number
}

const FEATURES: Record<AiFeature, FeatureConfig> = {
  resume: {
    counterCol: 'ai_resume_calls_this_month',
    periodCol: 'resume_period_start',
    lockCol: 'resume_active_job',
    lockTsCol: 'resume_last_job_at',
    freeLimit: 1,
    proLimit: 10,
    staleMinutes: 5,
  },
  advisor: {
    counterCol: 'advisor_calls_used',
    periodCol: 'advisor_period_start',
    lockCol: 'advisor_active_job',
    lockTsCol: 'advisor_last_job_at',
    freeLimit: 0,
    proLimit: 30,
    staleMinutes: 5,
  },
}

export interface AiQuotaState {
  feature: AiFeature
  tier: AiTier
  used: number
  limit: number        // -1 = unlimited
  can_use: boolean
  is_locked: boolean
}

function tierOf(row: { is_pro?: boolean | null } | null, email: string): AiTier {
  if (isAdminEmail(email)) return 'admin'
  if (row?.is_pro) return 'pro'
  return 'free'
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity
  return (Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000)
}

export async function getAiQuota(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  feature: AiFeature,
): Promise<AiQuotaState> {
  const cfg = FEATURES[feature]
  const cols = `is_pro, ${cfg.counterCol}, ${cfg.periodCol}, ${cfg.lockCol}`
  const { data: row } = await supabase.from('users').select(cols).eq('id', userId).single()

  const tier = tierOf(row as { is_pro?: boolean | null } | null, userEmail)
  const limit = tier === 'admin' ? -1 : tier === 'pro' ? cfg.proLimit : cfg.freeLimit

  // Monthly reset (28-day rolling) for non-admins.
  let used = (row as Record<string, number> | null)?.[cfg.counterCol] ?? 0
  let locked = (row as Record<string, boolean> | null)?.[cfg.lockCol] ?? false
  if (tier !== 'admin' && daysSince((row as Record<string, string> | null)?.[cfg.periodCol]) >= 28) {
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('users').update({ [cfg.counterCol]: 0, [cfg.periodCol]: today }).eq('id', userId)
    used = 0
  }
  // Re-read lock fresh isn't necessary; we have it from the row.
  void locked

  return {
    feature,
    tier,
    used,
    limit,
    can_use: limit === -1 || used < limit,
    is_locked: (row as Record<string, boolean> | null)?.[cfg.lockCol] ?? false,
  }
}

export async function acquireAiLock(
  supabase: SupabaseClient,
  userId: string,
  feature: AiFeature,
): Promise<boolean> {
  const cfg = FEATURES[feature]
  // Clear a stale lock (a crashed prior job) before trying to acquire.
  const staleTs = new Date(Date.now() - cfg.staleMinutes * 60 * 1000).toISOString()
  await supabase
    .from('users')
    .update({ [cfg.lockCol]: false })
    .eq('id', userId)
    .eq(cfg.lockCol, true)
    .lt(cfg.lockTsCol, staleTs)

  const { data } = await supabase
    .from('users')
    .update({ [cfg.lockCol]: true, [cfg.lockTsCol]: new Date().toISOString() })
    .eq('id', userId)
    .eq(cfg.lockCol, false)
    .select('id')

  return Array.isArray(data) && data.length > 0
}

export async function releaseAiLock(
  supabase: SupabaseClient,
  userId: string,
  feature: AiFeature,
): Promise<void> {
  const cfg = FEATURES[feature]
  await supabase.from('users').update({ [cfg.lockCol]: false }).eq('id', userId)
}

export async function incrementAiUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: AiFeature,
): Promise<void> {
  await supabase.rpc('ai_increment_usage', { p_user_id: userId, p_feature: feature })
}

// Friendly limit message for a 429.
export function aiLimitMessage(q: AiQuotaState): string {
  if (q.feature === 'resume') {
    return q.tier === 'free'
      ? `You've used all ${q.limit} free resume analyses this month. Upgrade to Pro for 10/month.`
      : `You've used all ${q.limit} resume analyses this month.`
  }
  // advisor
  return q.tier === 'free'
    ? 'AI Recommend & Strategy are Pro features. Upgrade to Pro to use them.'
    : `You've used all ${q.limit} AI advisor runs this month.`
}
