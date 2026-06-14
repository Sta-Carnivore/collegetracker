import { Resend } from 'resend'
import { getReminderSeverity } from './reminderSeverity'

export interface ReminderEmail {
  to: string
  subject: string
  items: { title: string; dueAt: string; whenLabel: string }[]
}

export interface EmailResult {
  sent: boolean
  reason?: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://applytracker.io'
const FROM = 'ApplyTracker <reminders@applytracker.io>'

const TEAL = '#2D9E94'
const INK  = '#1A2330'
const MUTED = '#64748B'
const BG   = '#F8FAFC'
const BORDER = '#E2E8F0'

function urgencyBadge(daysUntil: number): { color: string; label: string } {
  const sev = getReminderSeverity({ daysUntil, kind: 'deadline' })
  return { color: sev.color, label: sev.label }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function daysFromIso(iso: string): number {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(iso); d.setHours(0,0,0,0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

function buildHtml(email: ReminderEmail): string {
  const rows = email.items.map(item => {
    const days = daysFromIso(item.dueAt)
    const { color, label } = urgencyBadge(days)
    return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-size:15px;font-weight:600;color:${INK};margin-bottom:3px;">${item.title}</div>
                <div style="font-size:13px;color:${MUTED};">${formatDate(item.dueAt)} &nbsp;·&nbsp; ${item.whenLabel}</div>
              </td>
              <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
                <span style="display:inline-block;background:${color}18;color:${color};font-size:11px;font-weight:700;letter-spacing:0.04em;padding:3px 9px;border-radius:20px;border:1px solid ${color}40;">${label}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
  }).join('')

  const count = email.items.length
  const intro = count === 1
    ? 'You have <strong>1 upcoming deadline</strong>.'
    : `You have <strong>${count} upcoming deadlines</strong>.`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding-bottom:28px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:28px;height:28px;background:${TEAL};border-radius:7px;text-align:center;vertical-align:middle;">
                  <span style="color:white;font-size:14px;font-weight:700;line-height:28px;">A</span>
                </td>
                <td style="padding-left:10px;font-size:15px;font-weight:600;color:${INK};vertical-align:middle;">ApplyTracker</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:white;border-radius:14px;border:1px solid ${BORDER};padding:32px 32px 24px;">

            <div style="font-size:22px;font-weight:700;color:${INK};margin-bottom:8px;line-height:1.3;">
              Deadline reminder
            </div>
            <div style="font-size:14px;color:${MUTED};margin-bottom:28px;line-height:1.6;">
              ${intro} Stay on track — you've got this.
            </div>

            <!-- Deadline list -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${rows}
            </table>

            <!-- CTA -->
            <div style="margin-top:28px;text-align:center;">
              <a href="${APP_URL}/tracker" style="display:inline-block;background:${TEAL};color:white;font-size:14px;font-weight:600;padding:13px 28px;border-radius:9px;text-decoration:none;">
                Open ApplyTracker →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:20px;text-align:center;">
            <div style="font-size:12px;color:#94A3B8;line-height:1.6;">
              You're receiving this because you have an active ApplyTracker account.<br>
              <a href="${APP_URL}/settings" style="color:#94A3B8;text-decoration:underline;">Manage notifications</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendReminderEmail(email: ReminderEmail): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:stub] would send "${email.subject}" to ${email.to} (${email.items.length} items)`)
    return { sent: false, reason: 'email_not_configured' }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: FROM,
    to: email.to,
    subject: email.subject,
    html: buildHtml(email),
  })

  if (error) {
    console.error('[email] Resend error:', error)
    return { sent: false, reason: error.message }
  }

  return { sent: true }
}
