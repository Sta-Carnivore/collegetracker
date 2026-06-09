import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Restore a past version as the CURRENT working version in the builder.
// This intentionally does NOT modify bio_pages (the live /u/[slug] page) — the
// user reviews the restored version in the builder and clicks Publish to make it
// live. We only re-point the is_current flag and hand the html back to the client.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: version, error } = await supabase
    .from('bio_page_versions')
    .select('id, html, style, version_no')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  // Re-point "current" to the restored version (best-effort).
  await supabase
    .from('bio_page_versions')
    .update({ is_current: false })
    .eq('user_id', user.id)
    .eq('is_current', true)
  await supabase
    .from('bio_page_versions')
    .update({ is_current: true })
    .eq('id', version.id)
    .eq('user_id', user.id)

  return NextResponse.json({
    html: version.html,
    style: version.style,
    version_no: version.version_no,
  })
}
