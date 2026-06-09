/**
 * Email delivery interface — STUB.
 *
 * Reminder emails are not wired to a provider yet (per the planner skeleton plan:
 * in-app reminders first, email later). This is the single seam a future cron /
 * Resend integration plugs into, so the call sites already exist and are typed.
 *
 * To go live later: implement send() with Resend (server-only RESEND_API_KEY),
 * verify a sending domain, and call it from a scheduled job that reads upcoming
 * reminders. Do NOT expose RESEND_API_KEY with a NEXT_PUBLIC_ prefix.
 */

export interface ReminderEmail {
  to: string
  subject: string
  // Lines describing the upcoming deadlines/decisions to include in the body.
  items: { title: string; dueAt: string; whenLabel: string }[]
}

export interface EmailResult {
  sent: boolean
  reason?: string
}

export async function sendReminderEmail(email: ReminderEmail): Promise<EmailResult> {
  // No provider configured yet — log and no-op so callers don't break.
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:stub] would send "${email.subject}" to ${email.to} (${email.items.length} items)`)
    return { sent: false, reason: 'email_not_configured' }
  }
  // Placeholder for the real Resend call. Intentionally not implemented yet.
  console.log(`[email:stub] RESEND_API_KEY present but sender not implemented; skipping ${email.to}`)
  return { sent: false, reason: 'sender_not_implemented' }
}
