import { createClient } from '@supabase/supabase-js'

const API_KEY = 'Xtcr9cW0pRQENqmnKuuapT6OEX6azdSuRs0toYNF'
const BASE_URL = 'https://api.data.gov/ed/collegescorecard/v1/schools'

const SUPABASE_URL = 'https://qfwipqapomlbjgkqjuos.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2lwcWFwb21sYmpna3FqdW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0NzE3NSwiZXhwIjoyMDkwODIzMTc1fQ.KFuPxW30J65quh5e27Pb5gZJoFmKQ9KCmlqnEWlbIDs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const FIELDS = [
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'latest.admissions.admission_rate.overall',
  'latest.admissions.sat_scores.25th_percentile.cumulative',
  'latest.admissions.sat_scores.75th_percentile.cumulative',
  'latest.admissions.act_scores.25th_percentile.cumulative',
  'latest.admissions.act_scores.75th_percentile.cumulative',
  'latest.student.size',
].join(',')

async function fetchPage(page) {
  const params = new URLSearchParams({
    api_key: API_KEY,
    'school.degrees_awarded.predominant': '3',  // bachelor's-primary schools
    'latest.student.size__range': '300..',       // enrollment >= 300
    fields: FIELDS,
    per_page: '100',
    page: String(page),
    sort: 'latest.student.size:desc',            // largest schools first
  })

  const res = await fetch(`${BASE_URL}?${params}`)
  if (!res.ok) throw new Error(`API error: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  console.log('Fetching schools from College Scorecard API...\n')

  let page = 0
  let total = null
  const allSchools = []

  while (true) {
    const data = await fetchPage(page)

    if (total === null) {
      total = data.metadata.total
      console.log(`Total matching schools: ${total}`)
    }

    const results = data.results ?? []
    allSchools.push(...results)
    process.stdout.write(`\rFetched ${allSchools.length}/${total}...`)

    if (allSchools.length >= total || results.length === 0) break
    page++
    await new Promise(r => setTimeout(r, 150)) // be polite to the API
  }

  console.log(`\n\nMapping ${allSchools.length} schools to DB schema...`)

  const rows = allSchools
    .filter(s => s['school.name']) // skip entries with no name
    .map(s => ({
      name: s['school.name'],
      logo_url: null,
      acceptance_rate: s['latest.admissions.admission_rate.overall'] != null
        ? Math.round(s['latest.admissions.admission_rate.overall'] * 1000) / 10  // e.g. 0.0532 → 5.3
        : null,
      sat_25th: s['latest.admissions.sat_scores.25th_percentile.cumulative'] ?? null,
      sat_75th: s['latest.admissions.sat_scores.75th_percentile.cumulative'] ?? null,
      act_25th: s['latest.admissions.act_scores.25th_percentile.cumulative'] ?? null,
      act_75th: s['latest.admissions.act_scores.75th_percentile.cumulative'] ?? null,
      popular_majors: [],
      deadline_ea: null,
      deadline_ed: null,
      deadline_rd: null,
      deadline_rolling: false,
      notification_date: null,
      supplemental_essay_count: 0,
    }))

  console.log(`Inserting ${rows.length} schools into Supabase...\n`)

  // Insert in batches of 200
  const CHUNK = 200
  let inserted = 0

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error } = await supabase.from('schools').insert(chunk)
    if (error) {
      console.error(`\nError on batch ${i}–${i + CHUNK}:`, error.message)
    } else {
      inserted += chunk.length
      process.stdout.write(`\rInserted ${inserted}/${rows.length}...`)
    }
  }

  console.log(`\n\nDone! ${inserted} schools seeded into the database.`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
