import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ensureCompleteDocument } from '@/lib/bioRender'
import { saveBioVersion } from '@/lib/bioVersions'
import { sanitizeBioHtml, validateSanitizedBioHtml } from '@/lib/bioSanitize'

export const dynamic = 'force-dynamic'

function visibleTextLength(html: string): number {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

function generateSlug(name: string): string {
  const base = (name || 'student')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { html: rawHtml, style, published: publishedFlag, snapshot } = await request.json()
  if (!rawHtml) return NextResponse.json({ error: 'No HTML provided' }, { status: 400 })
  const isPublished = publishedFlag !== false
  // Only explicit Publish / "Save to history" requests snapshot a version.
  // Frequent autosave drafts (persistDraft / generate auto-save) do not, to avoid
  // flooding the history with near-identical rows.
  const wantSnapshot = snapshot === true

  // SANITIZE FIRST (defence in depth): strip all scripts, event handlers,
  // javascript: URLs, and dangerous tags so what we STORE is already scriptless.
  // The public /u/[slug] route sanitizes again at serve time, but storing the
  // safe version means the builder preview and the public page stay in parity.
  const sanitized = sanitizeBioHtml(String(rawHtml))

  // Normalize to a complete document. This deterministically closes a generation
  // that was truncated mid-script (no regeneration), so what we store is always a
  // closed, self-healing document — the exact thing the public route will serve.
  const html = ensureCompleteDocument(sanitized)

  // Pull the user's name so validation can confirm it survived sanitization.
  const { data: nameRow } = await supabase
    .from('profiles').select('full_name').eq('user_id', user.id).single()

  // Reject if security cleanup broke the page (empty, lost name/sections, or —
  // impossibly — still has active content) rather than publishing a broken page.
  const check = validateSanitizedBioHtml(html, { name: nameRow?.full_name ?? null, style })
  if (!check.ok) {
    return NextResponse.json(
      { error: `${check.reason} Please regenerate or refine before publishing.` },
      { status: 422 },
    )
  }

  // Belt-and-braces: also keep the original blank/incomplete guard.
  const visibleText = visibleTextLength(html)
  const complete = /<\/html\s*>/i.test(html) || /<\/body\s*>/i.test(html)
  if (visibleText < 400 || !complete) {
    return NextResponse.json(
      { error: 'This page looks empty or incomplete, so it was not saved. Please regenerate before publishing.' },
      { status: 422 },
    )
  }

  // Reuse the existing slug if this user already has a bio page — keeps the
  // public URL stable across drafts, refinements, and re-publishes.
  const { data: existing } = await supabase
    .from('bio_pages').select('slug').eq('user_id', user.id).single()

  let slug = existing?.slug
  if (!slug) {
    const { data: profile } = await supabase
      .from('profiles').select('full_name').eq('user_id', user.id).single()
    slug = generateSlug(profile?.full_name ?? user.id.slice(0, 8))
  }

  // Upsert — one bio page per user
  const { data, error } = await supabase
    .from('bio_pages')
    .upsert({
      user_id: user.id,
      html,
      style,
      slug,
      published: isPublished,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('slug')
    .single()

  if (error) { console.error('[bio publish]', error.message); return NextResponse.json({ error: 'Could not publish the page.' }, { status: 500 }) }

  // Snapshot to version history when explicitly requested. A real Publish is a
  // 'publish' snapshot (and a published snapshot); a manual-edit save is a
  // 'manual_edit' draft snapshot.
  let versionId: string | null = null
  if (wantSnapshot) {
    const snap = await saveBioVersion(supabase, user.id, {
      html,
      style,
      slug: data.slug,
      source: isPublished ? 'publish' : 'manual_edit',
      isPublishedSnapshot: isPublished,
    })
    versionId = snap?.id ?? null
  }

  return NextResponse.json({ slug: data.slug, version_id: versionId })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('bio_pages').update({ published: false }).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}
