import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { applyBioBaseStyles, ensureCompleteDocument } from '@/lib/bioRender'

export const dynamic = 'force-dynamic'

// GET one version's full html (for preview / compare / restore). RLS already
// restricts to the owner; the explicit user_id filter is defense in depth.
// ?render=preview returns the base-styled, completed document ready for an iframe.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bio_page_versions')
    .select('id, version_no, label, style, source, duration_seconds, html, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  const wantRender = req.nextUrl.searchParams.get('render') === 'preview'
  const html = wantRender
    ? applyBioBaseStyles(ensureCompleteDocument(data.html ?? ''), 'preview')
    : data.html

  return NextResponse.json({
    version: {
      id: data.id,
      version_no: data.version_no,
      label: data.label,
      style: data.style,
      source: data.source,
      duration_seconds: data.duration_seconds,
      created_at: data.created_at,
    },
    html,
  })
}

// Rename a version (label only).
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const rawLabel = typeof body.label === 'string' ? body.label.trim().slice(0, 80) : ''
  const label = rawLabel.length ? rawLabel : null

  const { error } = await supabase
    .from('bio_page_versions')
    .update({ label })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) { console.error('[bio version]', error.message); return NextResponse.json({ error: 'Could not update the version.' }, { status: 500 }) }
  return NextResponse.json({ ok: true, label })
}

// Delete a version from history. Does not touch bio_pages (the live page).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('bio_page_versions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) { console.error('[bio version]', error.message); return NextResponse.json({ error: 'Could not update the version.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
