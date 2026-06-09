-- Planner / Reminder schema: flexible rounds, per-prompt essays, reminders,
-- per-user essay progress. Run in the Supabase SQL editor (idempotent).

-- ─────────────────────────────────────────────────────────────────────────────
-- school_rounds — ONE row per school per application round. Flexible: any round
-- label is allowed (EA, ED, ED2, REA, SCEA, RD, Rolling, ED0, EA2, …) so we are
-- not boxed into fixed deadline_ea/ed/rd columns. Times are optional; a null
-- deadline_time is treated as 23:59 local by the app.
create table if not exists public.school_rounds (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  round text not null,
  deadline_date date,
  deadline_time time,
  decision_release_date date,
  decision_release_time time,
  source_year text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, round, source_year)
);
create index if not exists school_rounds_school_idx on public.school_rounds (school_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- school_essays — ONE row per school per essay prompt.
create table if not exists public.school_essays (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  essay_prompt text not null,
  word_limit integer,
  required boolean not null default true,
  applies_to_rounds text[],          -- null/empty = applies to all rounds
  essay_group text,                  -- e.g. 'supplement' | 'honors college' | 'major-specific'
  source_year text,
  source_url text,
  created_at timestamptz not null default now()
);
create index if not exists school_essays_school_idx on public.school_essays (school_id);

-- Both reference tables: PUBLIC READ, client cannot write (service role / admin
-- import only — same posture as the schools table).
alter table public.school_rounds enable row level security;
drop policy if exists school_rounds_public_read on public.school_rounds;
create policy school_rounds_public_read on public.school_rounds
  for select to anon, authenticated using (true);
revoke insert, update, delete on public.school_rounds from authenticated, anon;

alter table public.school_essays enable row level security;
drop policy if exists school_essays_public_read on public.school_essays;
create policy school_essays_public_read on public.school_essays
  for select to anon, authenticated using (true);
revoke insert, update, delete on public.school_essays from authenticated, anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- user_essay_progress — which essays a user has finished (the checklist state).
create table if not exists public.user_essay_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  school_essay_id uuid not null references public.school_essays (id) on delete cascade,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, school_essay_id)
);
create index if not exists user_essay_progress_user_idx on public.user_essay_progress (user_id);

alter table public.user_essay_progress enable row level security;
drop policy if exists user_essay_progress_owner_all on public.user_essay_progress;
create policy user_essay_progress_owner_all on public.user_essay_progress
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- reminders — a user's interaction with a planner event (dismiss / snooze) plus
-- the hook for future email delivery. The in-app feed is DERIVED live from
-- deadlines; this table only records overrides (dismissed/done) and email state.
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  school_id uuid references public.schools (id) on delete cascade,
  round text,
  kind text not null default 'deadline',   -- 'deadline' | 'decision' | 'essay' | 'custom'
  title text not null,
  due_at timestamptz,
  status text not null default 'active',    -- 'active' | 'dismissed' | 'done'
  email_enabled boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists reminders_user_idx on public.reminders (user_id);
-- One override row per (user, event). event = school_id + round + kind.
-- NOTE: must be a FULL (non-partial) unique index — Supabase/PostgREST upsert
-- onConflict cannot target a partial index, so a `where school_id is not null`
-- predicate would make every dismiss upsert 500. NULL school_id rows simply
-- never conflict (NULLS DISTINCT), which is fine for custom reminders.
drop index if exists public.reminders_event_unique;
create unique index if not exists reminders_event_unique
  on public.reminders (user_id, school_id, round, kind);

alter table public.reminders enable row level security;
drop policy if exists reminders_owner_all on public.reminders;
create policy reminders_owner_all on public.reminders
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Master email toggle on the user (email delivery itself is not wired yet).
alter table public.users
  add column if not exists reminder_email_enabled boolean not null default false,
  add column if not exists reminder_lead_days integer not null default 7;

grant update (reminder_email_enabled, reminder_lead_days) on public.users to authenticated;
