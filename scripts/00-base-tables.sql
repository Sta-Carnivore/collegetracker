-- ─────────────────────────────────────────────────────────────────────────────
-- BASE TABLES — run FIRST when standing up a fresh Supabase project.
--
-- These are the core tables the app assumes already exist. In the original prod
-- project they were created manually / by an earlier migration, so they were not
-- captured in scripts/. This file reconstructs them so a NEW environment can be
-- rebuilt from scripts alone. See scripts/README.md for the full run order.
--
-- Idempotent: every statement uses IF NOT EXISTS. Running this against the
-- EXISTING prod database is a safe no-op (it will not drop or alter live columns;
-- the feature/quota columns are added by the later alter scripts).
--
-- The quota/lock/override columns are intentionally NOT defined here — they are
-- added by the feature scripts (bio-quota-columns, ai-quota-columns,
-- applications-overrides, planner-schema) so the column ownership stays clear.
-- RLS policies are applied by rls-core.sql / the per-feature scripts, NOT here.
-- ─────────────────────────────────────────────────────────────────────────────

-- users — one row per auth user (mirrors auth.users for app-level state). The
-- handle_new_user trigger (users-trigger.sql) inserts a row on signup. FK with
-- ON DELETE CASCADE so deleting the auth user removes this row.
create table if not exists public.users (
  id                          uuid primary key references auth.users (id) on delete cascade,
  email                       text,
  is_pro                      boolean not null default false,
  stripe_customer_id          text,
  stripe_subscription_id      text,
  subscription_period         text,        -- 'monthly' | 'quarterly' | null
  bio_generations_this_month  integer not null default 0,
  ai_resume_calls_this_month  integer not null default 0,
  created_at                  timestamptz not null default now()
);

-- profiles — the student's onboarding + resume-derived profile. One per user.
create table if not exists public.profiles (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  full_name            text,
  graduation_year      integer,
  gpa                  numeric,
  sat_score            integer,
  act_score            integer,
  intended_major       text,
  intended_majors      text[],
  activities           jsonb not null default '[]'::jsonb,
  awards               jsonb not null default '[]'::jsonb,
  resume_raw_text      text,
  resume_parsed        jsonb,
  onboarding_completed boolean not null default false,
  updated_at           timestamptz not null default now(),
  created_at           timestamptz not null default now()
);

-- schools — GLOBAL reference data (public read; client cannot write). Deadline /
-- notification / essay-count fields are the official values the UI falls back to
-- when a user has no personal override on their application row.
create table if not exists public.schools (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  logo_url                 text,
  acceptance_rate          numeric,
  sat_25th                 integer,
  sat_75th                 integer,
  act_25th                 integer,
  act_75th                 integer,
  popular_majors           text[] not null default '{}',
  deadline_ea              date,
  deadline_ed              date,
  deadline_rd              date,
  deadline_rolling         boolean not null default false,
  notification_date        date,
  notification_ea          date,
  notification_ed          date,
  supplemental_essay_count integer not null default 0,
  test_policy              text,            -- 'required' | 'optional' | 'blind' | null
  rounds_offered           text[],
  created_at               timestamptz not null default now()
);
create index if not exists schools_name_idx on public.schools (name);

-- applications — a student's per-school application row. One per (user, school).
-- The per-user deadline/notification/essay overrides are added by
-- applications-overrides.sql. FK to schools cascades if a school is removed.
create table if not exists public.applications (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  school_id                uuid not null references public.schools (id) on delete cascade,
  status                   text not null default 'not_started',
  application_type         text,            -- 'EA' | 'ED' | 'REA' | 'RD' | 'Rolling' | null
  intended_major           text,
  supplemental_essays_done integer not null default 0,
  portal_url               text,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, school_id)
);
create index if not exists applications_user_idx on public.applications (user_id);

-- bio_pages — the CURRENT canonical Bio page that /u/[slug] serves. One per user
-- (slug unique index + RLS are applied in bio-pages-rls.sql). FK cascades so the
-- public page is removed when the auth user is deleted (the account-delete route
-- also deletes it explicitly as belt-and-braces).
create table if not exists public.bio_pages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  html       text,
  style      text,
  slug       text,
  published  boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);
