-- Row-Level Security for the core user-data tables. Run in the Supabase SQL editor.
-- Idempotent (drop-if-exists before create).
--
-- Threat model: the browser uses the anon/authenticated role with RLS enforced.
-- The server's privileged actions (Stripe webhook, admin school edits, the
-- SECURITY DEFINER increment functions) use the service role and bypass RLS.

-- ─────────────────────────────────────────────────────────────────────────────
-- users — a user may READ their own row and WRITE ONLY their usage counters/locks.
-- They must NOT be able to set is_pro / has_bio_purchase / stripe_* themselves
-- (that would be free Pro). Those are written only by the Stripe webhook (service
-- role). Counter increments run through SECURITY DEFINER RPCs and also bypass RLS;
-- the column grants below cover the lock/reset writes done with the user session.
alter table public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Column-level privileges: lock out everything except the usage/lock columns.
revoke update on public.users from authenticated;
grant update (
  ai_resume_calls_this_month,
  resume_period_start, resume_active_job, resume_last_job_at,
  advisor_calls_used, advisor_period_start, advisor_active_job, advisor_last_job_at,
  bio_generations_this_month,
  bio_generates_used, bio_refines_used, bio_css_tweaks_used,
  bio_usage_period_start, bio_active_job, bio_last_job_start_at,
  reminder_email_enabled, reminder_lead_days
) on public.users to authenticated;
-- No INSERT/DELETE for authenticated: rows are created by the handle_new_user
-- trigger and account deletion goes through the admin API (service role).
revoke insert, delete on public.users from authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles — full owner access (no privilege columns here).
alter table public.profiles enable row level security;
drop policy if exists profiles_owner_all on public.profiles;
create policy profiles_owner_all on public.profiles
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- applications — full owner access (includes the per-user deadline overrides).
alter table public.applications enable row level security;
drop policy if exists applications_owner_all on public.applications;
create policy applications_owner_all on public.applications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- schools — GLOBAL reference data: everyone reads, NOBODY writes via the client.
-- Writes happen only through the admin API route (service role, bypasses RLS).
alter table public.schools enable row level security;
drop policy if exists schools_public_read on public.schools;
create policy schools_public_read on public.schools
  for select to anon, authenticated
  using (true);
revoke insert, update, delete on public.schools from authenticated, anon;
