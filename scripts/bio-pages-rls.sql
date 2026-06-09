-- bio_pages RLS + slug uniqueness.
-- Run in the Supabase SQL editor.
-- Safe to run multiple times (all statements use IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).

-- Ensure RLS is on.
alter table public.bio_pages enable row level security;

-- One slug per user (stable public URL). The upsert in publish/route.ts uses
-- onConflict:'user_id', so this doesn't conflict with existing rows.
create unique index if not exists bio_pages_slug_unique
  on public.bio_pages (slug)
  where slug is not null;

-- Drop old policies before recreating (idempotent).
drop policy if exists "bio_pages_owner_all"     on public.bio_pages;
drop policy if exists "bio_pages_public_read"   on public.bio_pages;

-- Authenticated owner: full access to own rows.
create policy "bio_pages_owner_all"
  on public.bio_pages
  for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public (anon + authenticated): read published pages only.
-- The /u/[slug] route uses an anon-role SSR client when the visitor isn't logged in.
create policy "bio_pages_public_read"
  on public.bio_pages
  for select
  to anon, authenticated
  using (published = true);
