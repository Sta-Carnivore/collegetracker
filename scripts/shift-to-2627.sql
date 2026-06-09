-- Shift all school_rounds dates from 2025-26 cycle to 2026-27 cycle.
-- Run once now; re-import from fresh Codex data when Common App opens 8/1.

UPDATE public.school_rounds
SET
  deadline_date          = deadline_date + interval '1 year',
  decision_release_date  = CASE
                             WHEN decision_release_date IS NOT NULL
                             THEN decision_release_date + interval '1 year'
                           END,
  source_year            = REPLACE(
                             REPLACE(source_year, '2025-2026', '2026-2027'),
                             '2025-26', '2026-27'
                           ),
  updated_at             = now()
WHERE deadline_date IS NOT NULL
   OR decision_release_date IS NOT NULL;
