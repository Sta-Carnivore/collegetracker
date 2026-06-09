import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// List the current user's version history. Returns METADATA ONLY — never the
// html body, and never any token/cost data (that lives in bio_generations and
// is admin-only). The html for a single version is fetched on demand from
// /api/bio/versions/[id] for preview / restore.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bio_page_versions')
    .select('id, slug, version_no, label, style, source, score, duration_seconds, is_published_snapshot, is_current, created_at')
    .eq('user_id', user.id)
    .order('version_no', { ascending: false })

  // Missing table (not migrated yet) → empty history, not an error.
  if (error) return NextResponse.json({ versions: [] })

  return NextResponse.json({ versions: data ?? [] })
}
