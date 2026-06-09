/**
 * Render-time normalization injected into every generated bio page.
 *
 * Two guarantees:
 *  1. Full-bleed defaults so pages fill the viewport instead of a narrow column.
 *  2. Text is NEVER permanently hidden because a reveal animation's JS failed or
 *     the document was truncated. Some older generations gate content visibility
 *     on `el.style.opacity = '1'` set inside a script; if that script is cut off
 *     (truncation) or errors, the page goes blank.
 *
 * The reveal here is ANIMATION-AWARE and runs IMMEDIATELY (DOMContentLoaded +
 * rAF), not on a 2.5s timer. It only force-reveals in-flow elements stuck at
 * opacity:0 that have NO running CSS animation — i.e. the broken/legacy case.
 * Healthy new pages reveal content with pure-CSS autoplay @keyframes, so their
 * animating elements have a real animation-name and are left to play normally:
 * the reveal is a no-op for them and there is no blank delay. A single late
 * unconditional sweep stays as a last-resort rescue for legacy pages whose
 * reveal was tied to a keyframe that a broken script was supposed to trigger.
 *
 * `mode: 'preview'` additionally intercepts anchor clicks. Inside a srcDoc
 * iframe the base URL is about:srcdoc, so a `#section` link navigates the iframe
 * to about:srcdoc#section and blanks it. In preview we smooth-scroll hash links
 * within the iframe and disable navigations that would break the builder. The
 * public page (default mode) is a real document where native hash links work,
 * so it is not injected there.
 */

const BIO_BASE_STYLE = `<style id="bio-base">
  *,*::before,*::after{box-sizing:border-box}
  html,body{margin:0;padding:0;width:100%;max-width:none;overflow-x:hidden}
  body{min-height:100vh}
  img,svg,canvas,video{max-width:100%}
</style>`

const BIO_REVEAL_SCRIPT = `<script id="bio-failsafe">
(function(){
  function isStuck(el, s){
    // Only rescue in-flow content. Skip absolute/fixed overlays (hover notes,
    // popovers, curator stickies) that are intentionally hidden until hover.
    if(s.position === 'absolute' || s.position === 'fixed') return false;
    return parseFloat(s.opacity) === 0;
  }
  function sweep(respectAnimation){
    try{
      var els = document.body ? document.body.querySelectorAll('*') : [];
      for(var i=0;i<els.length;i++){
        var el = els[i];
        var s = window.getComputedStyle(el);
        if(!isStuck(el, s)) continue;
        // When respecting animation, leave elements that are mid CSS animation
        // alone so pure-CSS autoplay entrances play normally. Broken pages that
        // reveal via JS have no animation-name and get fixed right away.
        if(respectAnimation && s.animationName && s.animationName !== 'none') continue;
        el.style.setProperty('opacity','1','important');
        el.style.setProperty('transform','none','important');
        el.style.setProperty('visibility','visible','important');
      }
    }catch(e){}
  }
  function immediate(){ sweep(true); requestAnimationFrame(function(){ sweep(true); }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', immediate);
  else immediate();
  // Last-resort rescue for anything still hidden after entrance animations would
  // have finished (healthy pages are already opaque, so this is a no-op). Late
  // enough that it never clips a legitimate hero entrance.
  setTimeout(function(){ sweep(false); }, 3500);
})();
</script>`

const BIO_NAV_SCRIPT = `<script id="bio-nav-guard">
(function(){
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if(!a) return;
    var href = a.getAttribute('href');
    if(href === null) return;
    if(href.charAt(0) === '#'){
      e.preventDefault();
      var id = href.slice(1);
      var t = id ? (document.getElementById(id) || document.querySelector('[name="'+id+'"]')) : null;
      if(t && t.scrollIntoView) t.scrollIntoView({behavior:'smooth', block:'start'});
      else window.scrollTo({top:0, behavior:'smooth'});
      return;
    }
    // Any other navigation would blank the srcdoc preview iframe — disable it
    // here (links stay live on the published public page).
    e.preventDefault();
  }, true);
})();
</script>`

/**
 * Deterministically finish a truncated generation so it parses as a complete
 * document. No regeneration — purely structural repair of HTML we already have:
 *
 *  - If a `<script>` was left open (the model stopped mid-statement, e.g. the
 *    trailing proof-point reveal that ends at `lbl.style`), drop that final
 *    unterminated script. Leaving it would put the parser in "script data" state
 *    and the dangling expression throws a SyntaxError; either way the JS reveal
 *    never runs. We remove it and let the injected animation-aware reveal in
 *    BIO_REVEAL_SCRIPT make those opacity:0 elements visible instead.
 *  - Ensure the document closes with </body></html>.
 *
 * A complete document (already has </html>) is returned untouched — this is a
 * no-op for healthy pages, so it never changes how a good page renders.
 */
export function ensureCompleteDocument(html: string): string {
  if (!html) return html
  if (/<\/html\s*>/i.test(html)) return html

  let out = html
  const opens = (out.match(/<script\b/gi) || []).length
  const closes = (out.match(/<\/script\s*>/gi) || []).length
  if (opens > closes) {
    // The last <script> is the unmatched one (all earlier ones are closed).
    const cut = out.toLowerCase().lastIndexOf('<script')
    if (cut !== -1) out = out.slice(0, cut)
  }

  if (!/<\/body\s*>/i.test(out)) out += '\n</body>'
  out += '\n</html>'
  return out
}

/**
 * Point every rough.js <script src> at our self-hosted copy (/vendor/rough.js).
 *
 * Why: the generator was emitting `unpkg.com/roughjs@4.6.6/bundler/rough.js`,
 * which does NOT exist (the package only ships `bundled/rough.js`, the UMD that
 * defines the global `rough`). The 404 meant `typeof rough === 'undefined'`, so
 * every proof_board hero script bailed out at its first line and drew NOTHING —
 * just the static axes/labels. Self-hosting also dodges flaky CDN access.
 *
 * Same-origin works in both contexts: a srcDoc preview iframe inherits the app
 * origin, and the public /u/[slug] page is served from it too. This runs at
 * render time, so existing stored pages are fixed without regenerating.
 */
export function fixRoughJsSource(html: string): string {
  if (!html) return html
  return html.replace(
    /(<script\b[^>]*\bsrc\s*=\s*)(["'])[^"']*roughjs[^"']*\2/gi,
    `$1$2/vendor/rough.js$2`,
  )
}

/**
 * Inject the base styles (and, for builder contexts only, helper scripts).
 *
 * Modes:
 *  - 'public'    → CSS ONLY. No <script> injected. Used by /u/[slug], which
 *                  serves under a strict CSP (script-src 'none'). The page is
 *                  designed to be fully visible and animated with CSS/SVG alone,
 *                  so the reveal failsafe is unnecessary and would be CSP-blocked.
 *  - 'preview'   → CSS + reveal failsafe + in-iframe nav guard (builder srcDoc
 *                  iframe runs with allow-scripts; these are OUR controlled
 *                  helpers, not page-generated code).
 *  - 'published' → legacy alias kept for callers; CSS + reveal failsafe only.
 */
export function applyBioBaseStyles(
  html: string,
  mode: 'public' | 'published' | 'preview' = 'published',
): string {
  if (!html) return html
  html = fixRoughJsSource(html)
  const scripts =
    mode === 'public'
      ? ''
      : BIO_REVEAL_SCRIPT + (mode === 'preview' ? BIO_NAV_SCRIPT : '')
  const inject = BIO_BASE_STYLE + scripts
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${inject}</head>`)
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)/i, `$1${inject}`)
  }
  return inject + html
}
