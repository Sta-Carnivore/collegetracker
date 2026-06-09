// Admin gate. Admin status is determined by email allow-list, kept server-side
// only. Override in production with the ADMIN_EMAILS env var (comma-separated).
// Defaults to the project owner so the admin tools work out of the box.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'stava.ziyi@gmail.com')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(Boolean)

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase())
}
