/**
 * Import Codex-collected admissions data into school_rounds + school_essays.
 *
 * Usage:
 *   node scripts/import-admissions-data.mjs --deadlines path/to/deadlines.json --essays path/to/essays.json
 *   node scripts/import-admissions-data.mjs --deadlines deadlines.csv          (CSV also accepted)
 *
 * Either flag is optional — run just one if you only have one file.
 *
 * Expected columns (CSV header row or JSON array of objects):
 *   deadlines: school_name, round, deadline_date, deadline_time,
 *              decision_release_date, decision_release_time, source_year, source_url
 *   essays:    school_name, essay_prompt, word_limit, required,
 *              applies_to_rounds, essay_group, source_year, source_url
 *
 * Matching: school_name → schools.name (normalized). Anything that doesn't match
 * is written to scripts/unmatched.json and printed — NEVER silently dropped.
 *
 * Env: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
 * The script auto-loads .env.local if those aren't already in the environment.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/* ── env ── */
function loadEnvLocal() {
  const p = join(__dirname, '..', '.env.local')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}
loadEnvLocal()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (set them or put in .env.local)')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

/* ── args ── */
function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : null
}
const deadlinesPath = arg('deadlines')
const essaysPath = arg('essays')
if (!deadlinesPath && !essaysPath) {
  console.error('Provide --deadlines <file> and/or --essays <file>')
  process.exit(1)
}

/* ── minimal CSV parser (handles quoted fields, commas/newlines/escaped quotes) ── */
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  if (!rows.length) return []
  const header = rows[0].map(h => h.trim())
  return rows.slice(1).filter(r => r.some(c => c.trim() !== '')).map(r => {
    const o = {}
    header.forEach((h, i) => { o[h] = (r[i] ?? '').trim() })
    return o
  })
}

function loadRecords(path) {
  const raw = readFileSync(path, 'utf8')
  if (extname(path).toLowerCase() === '.json') {
    const j = JSON.parse(raw)
    return Array.isArray(j) ? j : (j.data ?? [])
  }
  return parseCSV(raw)
}

/* ── school name matching ── */
function normalize(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s*&\s*/g, ' and ')              // A&M → A and M (with spaces)
    .replace(/\s*\([^)]*\)/g, '')              // remove (Illinois), (MA), (NY) etc.
    .replace(/^(cuny|suny)\s*[-]+\s*/i, '')    // remove CUNY-- or CUNY- prefix
    .replace(/^(cuny|suny)\s+/i, '')            // remove CUNY prefix with space
    .replace(/--/g, ' ')                         // --campus → space (keep campus name)
    .replace(/[.,'''—–-]/g, ' ')                // remaining punctuation to space
    .replace(/\b(suny|cuny)\b/g, '')            // strip SUNY/CUNY suffix tags (e.g. "Binghamton U--SUNY")
    .replace(/\b(the|university|college|of|at|institute|technology)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function nullify(v) {
  const s = String(v ?? '').trim()
  return s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a' ? null : s
}
function toInt(v) {
  const s = nullify(v)
  if (s === null) return null
  const n = parseInt(String(s).replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(n) ? n : null
}
function toBool(v) {
  const s = String(v ?? '').trim().toLowerCase()
  return s === 'yes' || s === 'true' || s === '1' || s === 'required'
}
function toRounds(v) {
  const s = nullify(v)
  if (s === null || s.toLowerCase() === 'all') return null
  return s.split(/[,;/]/).map(x => x.trim()).filter(Boolean)
}

// Strip timezone suffix from time strings: "23:59 ET" → "23:59", "18:00 CT" → "18:00"
function cleanTime(v) {
  const s = nullify(v)
  if (!s) return null
  return s.replace(/\s+[A-Z]{2,4}$/, '').trim() || null
}

async function main() {
  // Build name → school_id map — paginate to bypass Supabase's 1000-row default cap.
  const schools = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('schools').select('id, name').range(from, from + 999)
    if (error) { console.error('Failed to read schools:', error.message); process.exit(1) }
    if (!data || data.length === 0) break
    schools.push(...data)
    if (data.length < 1000) break
  }
  const byNorm = new Map()
  for (const s of schools) byNorm.set(normalize(s.name), s.id)
  console.log(`Loaded ${schools.length} schools for matching.\n`)

  // Manual aliases: CSV name → canonical DB name (for main-campus vs branch-campus mismatches)
  const ALIASES = {
    'louisiana state university--baton rouge': 'Louisiana State University',
    'brigham young university--provo': 'Brigham Young University',
    'pennsylvania state university--university park': 'Pennsylvania State University-Main Campus',
  }

  const unmatched = new Set()
  const matchSchool = (name) => {
    const canonical = ALIASES[name.toLowerCase()]
    const key = canonical ? normalize(canonical) : normalize(name)
    const id = byNorm.get(key)
    if (!id) unmatched.add(name)
    return id ?? null
  }

  /* ── deadlines → school_rounds ── */
  if (deadlinesPath) {
    const recs = loadRecords(deadlinesPath)
    console.log(`Deadlines: ${recs.length} rows`)
    // Group by (school_id, source_year) so we can replace cleanly on re-import.
    const groups = new Map()
    for (const r of recs) {
      const sid = matchSchool(r.school_name)
      if (!sid) continue
      const year = nullify(r.source_year) ?? 'unknown'
      const key = `${sid}::${year}`
      if (!groups.has(key)) groups.set(key, { sid, year, rows: [] })
      groups.get(key).rows.push({
        school_id: sid,
        round: nullify(r.round) ?? 'RD',
        deadline_date: nullify(r.deadline_date),
        deadline_time: cleanTime(r.deadline_time),
        decision_release_date: nullify(r.decision_release_date),
        decision_release_time: cleanTime(r.decision_release_time),
        source_year: nullify(r.source_year),
        source_url: nullify(r.source_url),
      })
    }
    let inserted = 0
    for (const { sid, year, rows } of groups.values()) {
      // Deduplicate within the group by (round) — keep last occurrence
      const seen = new Map()
      for (const row of rows) seen.set(row.round, row)
      const deduped = [...seen.values()]
      await supabase.from('school_rounds').delete().eq('school_id', sid)
        .eq('source_year', year === 'unknown' ? null : year)
      const { error: insErr } = await supabase.from('school_rounds').insert(deduped)
      if (insErr) console.error(`  insert rounds failed for ${sid}:`, insErr.message)
      else inserted += deduped.length
    }
    console.log(`  → inserted ${inserted} round rows for ${groups.size} school/year groups\n`)
  }

  /* ── essays → school_essays ── */
  if (essaysPath) {
    const recs = loadRecords(essaysPath)
    console.log(`Essays: ${recs.length} rows`)
    const groups = new Map()
    for (const r of recs) {
      const sid = matchSchool(r.school_name)
      if (!sid) continue
      const year = nullify(r.source_year) ?? 'unknown'
      const key = `${sid}::${year}`
      if (!groups.has(key)) groups.set(key, { sid, year, rows: [] })
      groups.get(key).rows.push({
        school_id: sid,
        essay_prompt: nullify(r.essay_prompt) ?? '(untitled prompt)',
        word_limit: toInt(r.word_limit),
        required: toBool(r.required),
        applies_to_rounds: toRounds(r.applies_to_rounds),
        essay_group: nullify(r.essay_group),
        source_year: nullify(r.source_year),
        source_url: nullify(r.source_url),
      })
    }
    let inserted = 0
    for (const { sid, year, rows } of groups.values()) {
      await supabase.from('school_essays').delete().eq('school_id', sid)
        .eq('source_year', year === 'unknown' ? null : year)
      const { error: insErr } = await supabase.from('school_essays').insert(rows)
      if (insErr) console.error(`  insert essays failed for ${sid}:`, insErr.message)
      else inserted += rows.length
    }
    console.log(`  → inserted ${inserted} essay rows for ${groups.size} school/year groups\n`)
  }

  /* ── unmatched report ── */
  if (unmatched.size) {
    const list = [...unmatched].sort()
    writeFileSync(join(__dirname, 'unmatched.json'), JSON.stringify(list, null, 2))
    console.log(`⚠️  ${unmatched.size} unmatched school names (written to scripts/unmatched.json):`)
    list.slice(0, 30).forEach(n => console.log(`   - ${n}`))
    if (list.length > 30) console.log(`   … and ${list.length - 30} more`)
    console.log('\nFix: add these schools to the schools table, or correct the names in the source file, then re-run.')
  } else {
    console.log('✅ All school names matched.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
