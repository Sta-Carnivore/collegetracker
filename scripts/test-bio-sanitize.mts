/**
 * Security checks for the public Bio page sanitizer + CSP.
 * Run: node scripts/test-bio-sanitize.mts   (Node 24 strips TS types natively)
 *
 * Covers the P2 hardening acceptance criteria:
 *  - <script> (inline + external src) is stripped
 *  - inline event handlers (onclick/onerror/…) are stripped
 *  - javascript: URLs are neutralized
 *  - dangerous tags (iframe/object/embed/form/meta-refresh/base/srcdoc) handled
 *  - sanitized good page still renders visible content + passes validation
 *  - near-empty / script-bearing pages are rejected by validation
 *  - the /u/[slug] route ships a CSP with script-src 'none'
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  sanitizeBioHtml,
  hasActiveContent,
  validateSanitizedBioHtml,
  visibleTextLength,
} from '../src/lib/bioSanitize.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ✓ ${name}`) }
  else { fail++; console.error(`  ✗ FAIL: ${name}`) }
}

console.log('\n── Sanitizer: stripping ──')

check('inline <script> removed',
  !/<script/i.test(sanitizeBioHtml('<p>hi</p><script>alert(1)</script>')))

check('script body does not leak as text',
  !sanitizeBioHtml('<p>hi</p><script>alert(1)</script>').includes('alert(1)'))

check('external script src removed',
  !/<script/i.test(sanitizeBioHtml('<script src="https://evil.com/x.js"></script><p>hi</p>')))

check('self-hosted vendor script removed too (scriptless policy)',
  !/<script/i.test(sanitizeBioHtml('<script src="/vendor/rough.js"></script><p>hi</p>')))

check('truncated/unclosed <script> tail removed',
  !/alert/i.test(sanitizeBioHtml('<p>ok</p><script>var x = 1; alert(')))

check('onclick handler removed',
  !/onclick/i.test(sanitizeBioHtml('<button onclick="steal()">x</button>')))

check('onerror handler removed',
  !/onerror/i.test(sanitizeBioHtml('<img src=x onerror="alert(1)">')))

check('onload handler removed',
  !/onload/i.test(sanitizeBioHtml('<svg onload="alert(1)"></svg>')))

check('javascript: href neutralized',
  !/javascript:/i.test(sanitizeBioHtml('<a href="javascript:alert(1)">x</a>')))

check('obfuscated java\\tscript: neutralized',
  !/javascript/i.test(sanitizeBioHtml('<a href="java\tscript:alert(1)">x</a>').replace(/\s/g, '')))

check('<iframe> removed with content',
  !/<iframe/i.test(sanitizeBioHtml('<iframe src="https://evil.com"></iframe><p>hi</p>')))

check('<object> removed',
  !/<object/i.test(sanitizeBioHtml('<object data="x.swf"></object><p>hi</p>')))

check('<embed> removed',
  !/<embed/i.test(sanitizeBioHtml('<embed src="x"><p>hi</p>')))

check('<form> unwrapped (content kept)',
  sanitizeBioHtml('<form action="/x"><p>keepme</p></form>').includes('keepme')
  && !/<form/i.test(sanitizeBioHtml('<form action="/x"><p>keepme</p></form>')))

check('<meta http-equiv=refresh> removed',
  !/refresh/i.test(sanitizeBioHtml('<meta http-equiv="refresh" content="0;url=https://evil.com"><p>hi</p>')))

check('<base> removed',
  !/<base/i.test(sanitizeBioHtml('<base href="https://evil.com/"><p>hi</p>')))

check('srcdoc attribute removed',
  !/srcdoc/i.test(sanitizeBioHtml('<div srcdoc="<script>x</script>">hi</div>')))

check('external non-font <link rel=import> removed',
  !/<link/i.test(sanitizeBioHtml('<link rel="import" href="https://evil.com/x.html">')))

console.log('\n── Sanitizer: keeping safe content ──')

const fontLink = '<link href="https://fonts.googleapis.com/css2?family=Lora" rel="stylesheet">'
check('Google Fonts <link> kept', sanitizeBioHtml(fontLink).includes('fonts.googleapis.com'))

const styled = '<style>.x{color:red}</style><p style="color:blue">hello world this is body text</p>'
check('<style> block kept', sanitizeBioHtml(styled).includes('<style>'))
check('inline style="" kept', sanitizeBioHtml(styled).includes('style="color:blue"'))

const svg = '<svg><path d="M0 0 L10 10" stroke-dashoffset="100"/><circle cx="5" cy="5" r="2"/></svg>'
check('inline SVG kept', sanitizeBioHtml(svg).includes('<svg') && sanitizeBioHtml(svg).includes('<path'))

console.log('\n── hasActiveContent ──')
check('detects residual <script>', hasActiveContent('<p>x</p><script>y</script>'))
check('detects residual onclick', hasActiveContent('<button onclick="x">y</button>'))
check('clean page reports no active content', !hasActiveContent('<p>just text</p><style>.a{}</style>'))

console.log('\n── Idempotency ──')
const messy = '<script src="/vendor/rough.js"></script><div onclick="x()"><p>Body text content here that is long enough</p></div>'
const once = sanitizeBioHtml(messy)
const twice = sanitizeBioHtml(once)
check('sanitize is idempotent', once === twice)
check('after sanitize, no active content', !hasActiveContent(once))

console.log('\n── Validation: good vs broken ──')

// A realistic good page (scriptless), > 3 sections, name present, ample text.
const lorem = 'I build tools that make hard things feel obvious and I keep iterating until they work. '
const goodPage = `<!DOCTYPE html><html><head>${fontLink}<style>body{}</style></head><body>
<h1>Maya Chen</h1>
<svg><path d="M0 0 L100 100" filter="url(#rough)"/><circle cx="50" cy="50" r="3"/></svg>
<section><h2>Given</h2><p>${lorem.repeat(4)}</p></section>
<section><h2>Evidence</h2><p>${lorem.repeat(4)}</p></section>
<section><h2>Method</h2><p>${lorem.repeat(4)}</p></section>
<section><h2>Result</h2><p>${lorem.repeat(4)}</p></section>
</body></html>`

const goodSan = sanitizeBioHtml(goodPage)
const goodCheck = validateSanitizedBioHtml(goodSan, { name: 'Maya Chen', style: 'proof_board' })
check('good page passes validation', goodCheck.ok)
check('good page keeps visible text', visibleTextLength(goodSan) > 400)
check('good page keeps the name', goodSan.includes('Maya'))

// Near-empty page → rejected.
const empty = validateSanitizedBioHtml('<html><body><p>hi</p></body></html>', { name: 'Maya Chen' })
check('near-empty page rejected', !empty.ok)

// Page that was ALL script → sanitizes to near-empty → rejected.
const allScript = sanitizeBioHtml('<html><body><script>document.write("x".repeat(9000))</script></body></html>')
const allScriptCheck = validateSanitizedBioHtml(allScript, { name: 'Maya Chen' })
check('all-script page rejected after cleanup', !allScriptCheck.ok)

// Too few sections → rejected.
const oneSection = `<html><body><h1>Maya Chen</h1><section><h2>Only</h2><p>${lorem.repeat(6)}</p></section></body></html>`
check('too-few-sections page rejected', !validateSanitizedBioHtml(oneSection, { name: 'Maya Chen' }).ok)

console.log('\n── CSP on /u/[slug] route ──')
const routeSrc = readFileSync(join(__dirname, '../src/app/u/[slug]/route.ts'), 'utf8')
check("route declares script-src 'none'", routeSrc.includes("script-src 'none'"))
check("route declares default-src 'none'", routeSrc.includes("default-src 'none'"))
check("route declares connect-src 'none'", routeSrc.includes("connect-src 'none'"))
check("route declares object-src 'none'", routeSrc.includes("object-src 'none'"))
check("route declares frame-ancestors 'self'", routeSrc.includes("frame-ancestors 'self'"))
check('script-src is none (not unsafe-inline/self)',
  routeSrc.includes(`"script-src 'none'"`) && !/script-src '(?:unsafe-inline|self)'/.test(routeSrc))
check('route sanitizes before serving', routeSrc.includes('sanitizeBioHtml'))
check('route asserts no active content', routeSrc.includes('hasActiveContent'))

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed\n`)
process.exit(fail === 0 ? 0 : 1)
