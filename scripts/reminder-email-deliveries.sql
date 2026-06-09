-- ─────────────────────────────────────────────────────────────────────────────
-- reminder_email_deliveries — PREP ONLY for the future v1.1 email job.
--
-- The existing `reminders` table has a single `email_sent_at`, which cannot record
-- that we sent the 30-day notice but not yet the 7-day one. This table logs ONE
-- row per (user, event, offset) so the future cron can be idempotent: it inserts a
-- 'scheduled'/'sent' row per offset and the unique index stops a double-send if the
-- job runs twice.
--
-- NOTHING writes to this table yet. Real sending (Resend + cron) is v1.1 — see
-- docs/email-reminders.md. Safe to run now; it just creates the table + RLS.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.reminder_email_deliveries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  event_key      text not null,         -- PlannerEvent.key, e.g. '<school>:ED:deadline'
  offset_days    integer not null,      -- one of getReminderSendOffsets(): 30/15/7/3/2/0
  scheduled_for  timestamptz,           -- when this offset's email is due to go out
  sent_at        timestamptz,           -- null until actually delivered
  severity_score integer,               -- score at scheduling time (reminderSeverity model)
  status         text not null default 'scheduled',  -- 'scheduled' | 'sent' | 'skipped' | 'failed'
  created_at     timestamptz not null default now()
);

-- Idempotency: at most one delivery row per user per event per offset.
create unique index if not exists reminder_email_deliveries_unique
  on public.reminder_email_deliveries (user_id, event_key, offset_days);

create index if not exists reminder_email_deliveries_user_idx
  on public.reminder_email_deliveries (user_id);

-- RLS: a user may READ their own delivery log (for a future "reminder history" UI).
-- All WRITES happen from the cron job via the service role, which bypasses RLS —
-- the client never inserts/updates here.
alter table public.reminder_email_deliveries enable row level security;

drop policy if exists reminder_email_deliveries_select_own on public.reminder_email_deliveries;
create policy reminder_email_deliveries_select_own
  on public.reminder_email_deliveries for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.reminder_email_deliveries from authenticated, anon;
