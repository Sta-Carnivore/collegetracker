-- Version history for the Bio Website builder (PROPER version system).
--
-- bio_pages       = the CURRENT canonical/published page that /u/[slug] serves.
-- bio_page_versions = the immutable history of every snapshot (this table).
-- bio_generations  = admin-only usage/cost log (tokens + $), NOT html history.
--
-- Every generate / refine / manual-edit-save / publish creates one row here, so a
-- user can browse, preview, compare, rename, delete, and RESTORE past versions.
-- Run once in the Supabase SQL editor. Snapshots are best-effort from the server;
-- if this table is missing, generation still works — there's just no history.
--
-- This table is user-facing and stores ONLY duration (no token counts, no cost).
-- Cost/token accounting lives in bio_generations and is admin-only.

create table if not exists public.bio_page_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text,                       -- the bio_pages slug this version belongs to
  version_no integer not null,     -- per-user sequential number, for display ("v3")
  label text,                      -- optional user-given name
  html text not null,
  style text,
  source text not null check (source in ('generate', 'refine', 'manual_edit', 'publish')),
  score integer,                   -- critic score at generation time, if any
  duration_seconds numeric,        -- user-facing time only
  is_published_snapshot boolean not null default false,
  is_current boolean not null default false,  -- the version currently loaded in the builder
  created_at timestamptz not null default now()
);

-- Fast "latest first" listing and next-version-number lookup per user.
create index if not exists bio_page_versions_user_idx
  on public.bio_page_versions (user_id, version_no desc);

-- One version number per user.
create unique index if not exists bio_page_versions_user_no_uniq
  on public.bio_page_versions (user_id, version_no);

-- RLS: a user may only see and manage their own versions. No cost/token columns
-- exist here, so users physically cannot read cost data through this table.
alter table public.bio_page_versions enable row level security;

drop policy if exists "bio_page_versions_select_own" on public.bio_page_versions;
create policy "bio_page_versions_select_own"
  on public.bio_page_versions for select
  using (auth.uid() = user_id);

drop policy if exists "bio_page_versions_insert_own" on public.bio_page_versions;
create policy "bio_page_versions_insert_own"
  on public.bio_page_versions for insert
  with check (auth.uid() = user_id);

drop policy if exists "bio_page_versions_update_own" on public.bio_page_versions;
create policy "bio_page_versions_update_own"
  on public.bio_page_versions for update
  using (auth.uid() = user_id);

drop policy if exists "bio_page_versions_delete_own" on public.bio_page_versions;
create policy "bio_page_versions_delete_own"
  on public.bio_page_versions for delete
  using (auth.uid() = user_id);

-- Link the admin usage/cost log to the version it produced (optional join).
-- Safe to run repeatedly. Requires bio_generations to exist already.
alter table public.bio_generations
  add column if not exists version_id uuid references public.bio_page_versions (id) on delete set null;

alter table public.bio_generations
  add column if not exists model text;
