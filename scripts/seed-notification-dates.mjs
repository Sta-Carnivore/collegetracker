// node scripts/seed-notification-dates.mjs
// Run AFTER: ALTER TABLE schools ADD COLUMN IF NOT EXISTS notification_ea text;
//            ALTER TABLE schools ADD COLUMN IF NOT EXISTS notification_ed text;

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qfwipqapomlbjgkqjuos.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmd2lwcWFwb21sYmpna3FqdW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI0NzE3NSwiZXhwIjoyMDkwODIzMTc1fQ.KFuPxW30J65quh5e27Pb5gZJoFmKQ9KCmlqnEWlbIDs'
)

// notification_ea = EA / REA decision date
// notification_ed = ED decision date  (Dec 15 for almost all)
// notification_date (already seeded) = RD decision date
const data = [
  // ── REA schools ─────────────────────────────────────────────────────────────
  { name: 'Harvard University',                    notification_ea: '2025-12-28', notification_ed: null },
  { name: 'Yale University',                       notification_ea: '2025-12-24', notification_ed: null },
  { name: 'Princeton University',                  notification_ea: '2025-12-28', notification_ed: null },
  { name: 'Stanford University',                   notification_ea: '2025-12-28', notification_ed: null },
  { name: 'University of Notre Dame',              notification_ea: '2025-12-20', notification_ed: null },
  { name: 'University of Chicago',                 notification_ea: '2025-12-20', notification_ed: null },

  // ── EA only ─────────────────────────────────────────────────────────────────
  { name: 'Massachusetts Institute of Technology', notification_ea: '2025-12-14', notification_ed: null },
  { name: 'California Institute of Technology',    notification_ea: '2025-12-14', notification_ed: null },
  { name: 'Georgetown University',                 notification_ea: '2025-12-15', notification_ed: null },

  // ── ED only ─────────────────────────────────────────────────────────────────
  { name: 'Columbia University',                   notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'University of Pennsylvania',            notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Brown University',                      notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Dartmouth College',                     notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Cornell University',                    notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Duke University',                       notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Northwestern University',               notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Vanderbilt University',                 notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Rice University',                       notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Washington University in St. Louis',    notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Johns Hopkins University',              notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Carnegie Mellon University',            notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Tufts University',                      notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Wake Forest University',                notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'Lehigh University',                     notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'New York University',                   notification_ea: null, notification_ed: '2025-12-15' },
  { name: 'George Washington University',          notification_ea: null, notification_ed: '2025-12-15' },

  // ── Both EA + ED ─────────────────────────────────────────────────────────────
  { name: 'Emory University',                      notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Tulane University of Louisiana',        notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Brandeis University',                   notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Case Western Reserve University',       notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'University of Rochester',               notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Rensselaer Polytechnic Institute',      notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Stevens Institute of Technology',       notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Boston University',                     notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Boston College',                        notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Northeastern University',               notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Fordham University',                    notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Syracuse University',                   notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'Drexel University',                     notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
  { name: 'American University',                   notification_ea: '2025-12-15', notification_ed: '2025-12-15' },
]

let ok = 0
let fail = 0

for (const { name, notification_ea, notification_ed } of data) {
  const { data: school } = await supabase
    .from('schools').select('id').eq('name', name).single()

  if (!school) { console.warn(`Not found: ${name}`); fail++; continue }

  const update = {}
  if (notification_ea !== undefined) update.notification_ea = notification_ea
  if (notification_ed !== undefined) update.notification_ed = notification_ed

  const { error } = await supabase.from('schools').update(update).eq('id', school.id)
  if (error) { console.error(`✗ ${name}: ${error.message}`); fail++ }
  else { console.log(`✓ ${name}`); ok++ }
}

console.log(`\nDone: ${ok} updated, ${fail} failed`)
