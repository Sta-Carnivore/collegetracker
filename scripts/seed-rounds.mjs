// Run: node scripts/seed-rounds.mjs
// Requires: ALTER TABLE schools ADD COLUMN IF NOT EXISTS rounds_offered text[];

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qfwipqapomlbjgkqjuos.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2lwcWFwb21sYmpna3FqdW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0NzE3NSwiZXhwIjoyMDkwODIzMTc1fQ.KFuPxW30J65quh5e27Pb5gZJoFmKQ9KCmlqnEWlbIDs'
)

// Schools whose rounds differ from what deadline inference would produce.
// Only list exceptions — all other schools are handled by deadline inference.
const OVERRIDES = [
  // REA (Restrictive Early Action) — stored as deadline_ea in DB but shown as REA
  { name: 'Harvard University',          rounds: ['REA', 'RD'] },
  { name: 'Yale University',             rounds: ['REA', 'RD'] },  // Yale SCEA ≈ REA
  { name: 'Princeton University',        rounds: ['REA', 'RD'] },
  { name: 'Stanford University',         rounds: ['REA', 'RD'] },
  { name: 'University of Notre Dame',    rounds: ['REA', 'RD'] },
  { name: 'University of Chicago',       rounds: ['REA', 'RD'] },  // UChicago REA (no ED)
]

for (const { name, rounds } of OVERRIDES) {
  const { data, error: fetchErr } = await supabase
    .from('schools')
    .select('id')
    .eq('name', name)
    .single()

  if (fetchErr || !data) {
    console.warn(`Not found: ${name}`)
    continue
  }

  const { error } = await supabase
    .from('schools')
    .update({ rounds_offered: rounds })
    .eq('id', data.id)

  console.log(error ? `✗ ${name}: ${error.message}` : `✓ ${name} → [${rounds.join(', ')}]`)
}
