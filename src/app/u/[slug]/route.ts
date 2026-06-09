import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { applyBioBaseStyles, ensureCompleteDocument } from '@/lib/bioRender'
import { sanitizeBioHtml, hasActiveContent, visibleTextLength } from '@/lib/bioSanitize'

export const dynamic = 'force-dynamic'

/**
 * Strict Content-Security-Policy for publicly-served, user-generated Bio HTML.
 *
 * The page is treated as fully untrusted. JavaScript is categorically disallowed
 * (script-src 'none') — generated pages render and animate with CSS/SVG only.
 * connect-src 'none' means even a CSS/markup trick can't exfiltrate data; the
 * page cannot reach any app API. Only the visual surfaces (inline CSS, fonts,
 * images) are permitted.
 *
 * NOTE (future hardening): the strongest production posture is to serve these
 * pages from a separate cookieless sandbox domain (e.g. u.applytracker.com) so a
 * hypothetical CSP bypass still can't touch app cookies / same-origin state.
 * For now we run scriptless sanitization + this strict CSP on the same origin.
 */
const CSP = [
  "default-src 'none'",
  "script-src 'none'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: https:",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https: https://fonts.gstatic.com",
].join('; ')

const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
}

function errorPage(title: string, detail: string, status: number) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:#FBFAF8;color:#2A2724}.box{text-align:center;padding:40px;max-width:420px}h1{font-size:20px;margin:0 0 8px}p{color:#6B6560;font-size:14px;line-height:1.5;margin:0}</style></head><body><div class="box"><h1>${title}</h1><p>${detail}</p></div></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        ...SECURITY_HEADERS,
      },
    },
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // One row per user (slug is stable per user). If duplicates ever exist, take
  // the most recently updated published one so we never serve a stale draft.
  const { data, error } = await supabase
    .from('bio_pages')
    .select('html, published, updated_at')
    .eq('slug', slug)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data || !data.published) {
    return errorPage('Page not found', "This page doesn't exist or isn't published.", 404)
  }

  // Defence in depth: sanitize to scriptless HTML again at serve time (the
  // stored copy is already sanitized at publish, but never trust storage).
  const sanitized = sanitizeBioHtml(data.html ?? '')
  const completed = ensureCompleteDocument(sanitized)

  // Hard assert: nothing executable may reach the response. If somehow it does,
  // refuse rather than serve active content on the app origin.
  if (hasActiveContent(completed)) {
    return errorPage(
      'This page is temporarily unavailable',
      'The published version failed a security check. Open the builder and re-publish to fix it.',
      200,
    )
  }

  const visible = visibleTextLength(completed)
  if (visible < 300) {
    return errorPage(
      'This page is still being built',
      'The published version looks empty. Open the builder and re-publish to fix it.',
      200,
    )
  }

  // Public render = CSS-only base styles, no injected scripts.
  const rendered = applyBioBaseStyles(completed, 'public')

  return new NextResponse(rendered, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      ...SECURITY_HEADERS,
    },
  })
}
