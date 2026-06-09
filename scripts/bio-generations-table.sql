-- Metrics log for every Bio Website generate / refine call.
-- Run once in the Supabase SQL editor. The generate route inserts into this
-- table best-effort; if the table is missing, generation still works and
-- metrics are returned to the client — they just aren't persisted.

create table if not exists public.bio_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mode text not null check (mode in ('generate', 'refine')),
  style text,
  generation_duration_seconds numeric,
  input_tokens integer,
  output_tokens integer,
  total_tokens integer,
  estimated_cost_usd numeric,
  created_at timestamptz not null default now()
);

create index if not exists bio_generations_user_id_idx
  on public.bio_generations (user_id, created_at desc);

-- RLS: a user may only read their own generation rows. Inserts happen from the
-- server with the user's session (auth.uid() = user_id), so allow that too.
alter table public.bio_generations enable row level security;

drop policy if exists "bio_generations_select_own" on public.bio_generations;
create policy "bio_generations_select_own"
  on public.bio_generations for select
  using (auth.uid() = user_id);

drop policy if exists "bio_generations_insert_own" on public.bio_generations;
create policy "bio_generations_insert_own"
  on public.bio_generations for insert
  with check (auth.uid() = user_id);
