export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { tryCreateAdminClient } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import { C } from '@/lib/atlas'
import type { BioGeneration } from '@/types/database'

const MODE_LABEL: Record<string, string> = { generate: 'Generated', refine: 'Refined' }

function money(n: number, dp = 4): string {
  return `$${n.toFixed(dp)}`
}

export default async function AdminUsagePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isAdminEmail(user.email)) redirect('/dashboard')

  const admin = tryCreateAdminClient()

  if (!admin) {
    return (
      <div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: C.inkStrong, fontWeight: 600 }}>
          Admin · Usage &amp; Cost
        </h1>
        <div className="rounded-xl px-4 py-3 mt-4 text-sm"
          style={{ background: C.paleGold, border: `1px solid ${C.gold}50`, color: C.inkStrong }}>
          Service-role key not configured. Set <code>SUPABASE_SERVICE_ROLE_KEY</code> in your environment to view
          cross-user usage analytics.
        </div>
      </div>
    )
  }

  const { data: rows } = await admin
    .from('bio_generations')
    .select('id, user_id, version_id, mode, model, style, generation_duration_seconds, input_tokens, output_tokens, total_tokens, estimated_cost_usd, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  const generations = (rows ?? []) as BioGeneration[]

  // Map user_id → email (best-effort).
  const userIds = [...new Set(generations.map(g => g.user_id))]
  const emailById = new Map<string, string>()
  if (userIds.length) {
    const { data: users } = await admin.from('users').select('id, email').in('id', userIds)
    for (const u of users ?? []) emailById.set(u.id as string, u.email as string)
  }

  // Aggregates.
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  let totalCost = 0, totalTokens = 0, monthCost = 0, durSum = 0, durCount = 0
  for (const g of generations) {
    totalCost += g.estimated_cost_usd ?? 0
    totalTokens += g.total_tokens ?? 0
    if (new Date(g.created_at).getTime() >= monthStart) monthCost += g.estimated_cost_usd ?? 0
    if (g.generation_duration_seconds != null) { durSum += g.generation_duration_seconds; durCount++ }
  }
  const avgDur = durCount ? Math.round(durSum / durCount) : 0

  const cards = [
    { label: 'Total generations', value: generations.length.toLocaleString() },
    { label: 'Total cost', value: money(totalCost, 2) },
    { label: 'This month', value: money(monthCost, 2) },
    { label: 'Total tokens', value: totalTokens.toLocaleString() },
    { label: 'Avg duration', value: `${avgDur}s` },
    { label: 'Unique users', value: userIds.length.toLocaleString() },
  ]

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '8px 10px', fontSize: 11, textTransform: 'uppercase',
    letterSpacing: '0.05em', color: C.inkFaint, fontWeight: 600, whiteSpace: 'nowrap',
    borderBottom: `1px solid ${C.border}`,
  }
  const td: React.CSSProperties = {
    padding: '8px 10px', fontSize: 13, color: C.ink, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap',
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: C.inkStrong, fontWeight: 600 }}>
        Admin · Usage &amp; Cost
      </h1>
      <p className="text-sm mt-0.5" style={{ color: C.inkMuted }}>
        Bio Website generation analytics across all users. Visible to admins only.
      </p>

      {/* Summary cards */}
      <div className="grid gap-3 mt-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
        {cards.map(c => (
          <div key={c.label} className="rounded-xl p-4"
            style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 1px 8px rgba(38,63,73,0.05)' }}>
            <p className="text-xs" style={{ color: C.inkFaint }}>{c.label}</p>
            <p className="mt-1" style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: C.inkStrong }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      {/* Detail table */}
      <div className="rounded-2xl overflow-hidden mt-6"
        style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.inkStrong }}>
            Recent generations <span style={{ color: C.inkFaint, fontWeight: 400 }}>({generations.length})</span>
          </p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>When</th>
                <th style={th}>User</th>
                <th style={th}>Type</th>
                <th style={th}>Style</th>
                <th style={th}>Model</th>
                <th style={{ ...th, textAlign: 'right' }}>Duration</th>
                <th style={{ ...th, textAlign: 'right' }}>In</th>
                <th style={{ ...th, textAlign: 'right' }}>Out</th>
                <th style={{ ...th, textAlign: 'right' }}>Total</th>
                <th style={{ ...th, textAlign: 'right' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {generations.length === 0 && (
                <tr><td style={{ ...td, color: C.inkFaint }} colSpan={10}>No generations logged yet.</td></tr>
              )}
              {generations.map(g => (
                <tr key={g.id}>
                  <td style={td}>{new Date(g.created_at).toLocaleString()}</td>
                  <td style={{ ...td, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {emailById.get(g.user_id) ?? g.user_id.slice(0, 8)}
                  </td>
                  <td style={td}>{MODE_LABEL[g.mode] ?? g.mode}</td>
                  <td style={td}>{g.style ? g.style.replace('_', ' ') : '—'}</td>
                  <td style={{ ...td, color: C.inkMuted }}>{g.model ?? '—'}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{g.generation_duration_seconds != null ? `${Math.round(g.generation_duration_seconds)}s` : '—'}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.inkMuted }}>{(g.input_tokens ?? 0).toLocaleString()}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.inkMuted }}>{(g.output_tokens ?? 0).toLocaleString()}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{(g.total_tokens ?? 0).toLocaleString()}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{money(g.estimated_cost_usd ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
