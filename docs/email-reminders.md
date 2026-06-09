# Email reminders — staged plan

Reminders are built as the app's **risk-weight model**, not a plain calendar. One
shared severity engine drives the in-app Planner today and will drive grouped
email reminders and dashboard risk hints later. This doc is the spec for the
staged rollout.

## v1 — shipped (in-app only, no email)

- **Severity model:** `src/lib/reminderSeverity.ts` — pure, server- and
  client-safe. Computes a 0–100 urgency score and a severity band per event:
  - `score = min(100, round(base(daysUntil) × eventTypeMultiplier × roundMultiplier))`
  - **base(daysUntil)** anchors: 30d→20, 15d→45, 7d→70, 3d→90, 2d→95, 0d→100
    (linear between anchors; decays toward 0 past 30 days).
  - **event type ×:** application deadline 1.0 · essay 0.9 · decision release 0.45 · custom 0.75
  - **round ×:** ED/ED2/REA/SCEA 1.15 · EA 1.0 · RD 0.9 · Rolling 0.75
  - **bands:** 0–39 normal/green · 40–64 level 3/yellow · 65–84 level 2/orange · 85–100 level 1/red
- **Planner integration:** the "Upcoming deadlines" feed sorts by severity score
  first, then soonest due date (`sortReminderEventsByPriority`), and colours each
  card's urgency bar + when-label by `getReminderSeverity(...).color`. `source_year`
  / "please verify" labels are unchanged.
- **Exports:** `getReminderSendOffsets()`, `calculateReminderScore()`,
  `getReminderSeverity()`, `sortReminderEventsByPriority()`,
  `groupReminderEventsByDate()`, `plannerEventType()`.
- **Schema prep (created, not wired):** `scripts/reminder-email-deliveries.sql`
  adds `reminder_email_deliveries` for future per-offset idempotency.

**No email is sent in v1.** There is intentionally no user-facing copy promising
email reminders yet.

## v1.1 — after launch (grouped email)

Send batched reminder emails at the offsets `getReminderSendOffsets()` returns:
**30 / 15 / 7 / 3 / 2 / 0 days** before a deadline.

> **Pro-only.** Email deadline reminders are a **Pro** feature — only Pro
> subscribers receive emails. Free / one-time-Bio users get the in-app Planner
> severity feed only. The cron job must skip users who aren't Pro (`users.is_pro`)
> in addition to honoring the per-user `reminder_email_enabled` opt-in.

### Grouping rule

- **One email per user per day**, containing every event that has a reminder
  offset landing on that day (across all the user's schools/rounds).
- The email's overall severity = the **highest event score** in that batch
  (subject/lede reflect the most urgent item).
- Order the items inside the email with `sortReminderEventsByPriority`, and use
  `groupReminderEventsByDate` to assemble the per-day batch.

### Idempotency

- For each (user, event, offset) the job upserts a row in
  `reminder_email_deliveries` (`status: 'scheduled' → 'sent'`). The unique index
  `(user_id, event_key, offset_days)` guarantees an offset is never sent twice,
  even if the cron runs more than once.

### Components to build (NOT done yet)

1. **Resend integration** in `src/lib/email.ts` (currently a no-op stub):
   - Add the `resend` dependency.
   - Verify a sending domain in Resend (e.g. `mail.<domain>`); set up SPF/DKIM.
   - Implement `sendReminderEmail()` to actually send.
2. **`/api/cron/send-reminders`** endpoint:
   - Compute today's due offsets from the planner events, group per user/day,
     dedupe against `reminder_email_deliveries`, send, then stamp `sent_at`.
   - Protect it: require a `CRON_SECRET` (header/query) and reject otherwise.
3. **External cron** (Railway has no native cron): a scheduler (cron-job.org /
   GitHub Actions / Upstash) hits the endpoint daily with the `CRON_SECRET`.
4. **Settings UI**: a per-user email toggle + lead-days control writing to the
   existing `users.reminder_email_enabled` / `users.reminder_lead_days` columns.
   Only emit user-facing "we'll email you" copy once this is live.
5. **Unsubscribe / disable path**: every email needs a one-click unsubscribe that
   flips `reminder_email_enabled` off (and/or per-event opt-out). Required before
   sending to real users.
6. **Email template/spec** beyond this doc.

## Security / privacy requirements (v1.1)

- `RESEND_API_KEY` is **server-only** — never `NEXT_PUBLIC_`.
- `CRON_SECRET` is **server-only**; the cron endpoint must reject requests without it.
- **Do not** put raw resume text, parsed-resume fields, GPA/test scores, or other
  sensitive profile data in emails. Emails carry only: school name, round, event
  type, due date/time, and the when-label. No PII beyond what the student already
  knows about their own schools.
- Honor `reminder_email_enabled`: never email a user who hasn't opted in, and
  always include a working unsubscribe link.
- Writes to `reminder_email_deliveries` happen via the **service role** (RLS lets
  users read their own rows only).

## Open questions for v1.1

- Timezone for "day-of" offset (store user TZ, or assume a default?).
- Quiet hours / send window.
- Decision-release reminders in email, or deadlines only?
