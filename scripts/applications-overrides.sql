-- Per-user deadline / notification / essay-count overrides on applications.
-- Run in the Supabase SQL editor.
--
-- WHY: the global `schools` table is shared reference data. Students must not be
-- able to write to it (that PATCH route is now admin-only). A student's personal
-- deadline edits live here, on their own application row, and the UI prefers the
-- override when present, falling back to the school's official value.

alter table public.applications
  add column if not exists deadline_ea date,
  add column if not exists deadline_ed date,
  add column if not exists deadline_rd date,
  add column if not exists notification_date date,
  add column if not exists notification_ea date,
  add column if not exists notification_ed date,
  add column if not exists supplemental_essays_total integer;
