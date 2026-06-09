import type { createClient } from '@/lib/supabase/server'
import type { BioVersionSource } from '@/types/database'

type Sb = Awaited<ReturnType<typeof createClient>>

interface SnapshotInput {
  html: string
  style?: string | null
  slug?: string | null
  source: BioVersionSource
  score?: number | null
  durationSeconds?: number | null
  label?: string | null
  isPublishedSnapshot?: boolean
}

// Create a new version snapshot and make it the current one. Best-effort: if the
// bio_page_versions table doesn't exist yet, this returns null and the caller's
// flow (generate/refine/publish) continues unaffected. Returns the new row id on
// success so callers (e.g. the usage logger) can link to it.
export async function saveBioVersion(
  supabase: Sb,
  userId: string,
  input: SnapshotInput,
): Promise<{ id: string; version_no: number } | null> {
  try {
    const { data: last } = await supabase
      .from('bio_page_versions')
      .select('version_no')
      .eq('user_id', userId)
      .order('version_no', { ascending: false })
      .limit(1)
      .maybeSingle()

    const nextNo = (last?.version_no ?? 0) + 1

    // Only one version is "current" at a time.
    await supabase
      .from('bio_page_versions')
      .update({ is_current: false })
      .eq('user_id', userId)
      .eq('is_current', true)

    const { data, error } = await supabase
      .from('bio_page_versions')
      .insert({
        user_id: userId,
        slug: input.slug ?? null,
        version_no: nextNo,
        label: input.label ?? null,
        html: input.html,
        style: input.style ?? null,
        source: input.source,
        score: input.score ?? null,
        duration_seconds: input.durationSeconds ?? null,
        is_published_snapshot: input.isPublishedSnapshot ?? false,
        is_current: true,
      })
      .select('id, version_no')
      .single()

    if (error || !data) return null
    return { id: data.id, version_no: data.version_no }
  } catch {
    return null
  }
}
