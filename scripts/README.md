# Database setup — run order

These SQL files build the Postgres schema in a Supabase project. They are written
to be idempotent (`if not exists` / `or replace` / `drop policy if exists`), so
re-running them against an existing database is safe.

**To recreate a fresh Supabase project from zero, run the schema scripts in this
exact order** (paste each into the Supabase SQL editor). Order matters where a
later script `alter`s a table or `grant`s on columns created earlier.

## Schema (run in order)

| # | File | What it creates | Depends on |
|---|------|-----------------|------------|
| 1 | `00-base-tables.sql` | `users`, `profiles`, `schools`, `applications`, `bio_pages` base tables | `auth.users` (Supabase built-in) |
| 2 | `users-trigger.sql` | `handle_new_user` trigger + backfill (auto-creates a `users` row per signup) | 1 |
| 3 | `bio-generations-table.sql` | `bio_generations` admin cost log + RLS | 1 |
| 4 | `bio-page-versions-table.sql` | `bio_page_versions` history + RLS; **alters** `bio_generations` (adds `version_id`, `model`) | 1, 3 |
| 5 | `bio-pages-rls.sql` | `bio_pages` slug-unique index + owner/public RLS | 1 |
| 6 | `applications-overrides.sql` | per-user deadline/notification/essay override columns on `applications` | 1 |
| 7 | `bio-quota-columns.sql` | Bio quota/lock columns on `users` + `bio_increment_usage()` | 1 |
| 8 | `ai-quota-columns.sql` | Resume/Advisor quota columns on `users` + `ai_increment_usage()` | 1 |
| 9 | `planner-schema.sql` | `school_rounds`, `school_essays`, `user_essay_progress`, `reminders` + reminder columns on `users` | 1 |
| 10 | `resumes-bucket.sql` | private `resumes` storage bucket + owner-only policies | — |
| 11 | `rls-core.sql` | RLS for `users`/`profiles`/`applications`/`schools` + **column-level grants** | 1, 7, 8 (grants reference quota columns) |

> **Why `rls-core.sql` is last:** it `grant`s `update` on the specific quota/lock
> columns added by steps 7–8, so those columns must already exist.
>
> **Why `bio-generations` before `bio-page-versions`:** step 4 alters the
> `bio_generations` table created in step 3.

## Data (optional, one-time — not schema)

These populate or migrate reference data and are not needed to stand up the schema:

| File | Purpose |
|------|---------|
| `add-missing-schools.sql` | Insert schools that were missing from the `schools` table |
| `import-admissions-data.mjs` | Import round deadlines + essay prompts into `school_rounds` / `school_essays` (`node scripts/import-admissions-data.mjs --deadlines … --essays …`) |
| `shift-to-2627.sql` | One-off: shift 2025-26 deadlines forward one year to 2026-27 |

## Future (v1.1 — optional, not needed for launch)

| File | Purpose |
|------|---------|
| `reminder-email-deliveries.sql` | Creates `reminder_email_deliveries` (per-offset email idempotency log). Prep only — no email is sent until the v1.1 cron/Resend work lands. See `docs/email-reminders.md`. |

## Notes

- Running steps 1–11 against the **existing prod** database is a no-op for schema
  (base tables already exist; `if not exists` guards prevent any change). It will
  re-assert RLS policies and grants, which is harmless.
- RLS threat model: the browser uses the anon/authenticated role with RLS
  enforced. Server-side privileged actions (Stripe webhook, admin school edits,
  account deletion, the `SECURITY DEFINER` increment RPCs) use the service role
  and bypass RLS. See the header comment in `rls-core.sql`.
