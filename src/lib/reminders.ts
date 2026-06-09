import type { Application, School, SchoolRound } from '@/types/database'
import { getEffectiveDeadline, getEffectiveNotification } from '@/lib/rounds'

/**
 * Derives the planner timeline (deadline + decision events) for a student from
 * their applications + the flexible school_rounds reference data, falling back
 * to the per-user override / official columns when imported rounds aren't there
 * yet (pre-Codex-import).
 *
 * Timezone-safe: a date-only string is built as LOCAL midnight (new Date(y,m,d))
 * and a null time defaults to 23:59 local — NOT parsed as UTC (which shifts a day
 * in US timezones). This is the bug flagged in the audit, fixed here at the source.
 */

export type PlannerEventKind = 'deadline' | 'decision'

export interface PlannerEvent {
  key: string
  kind: PlannerEventKind
  schoolId: string
  schoolName: string
  round: string
  dueAt: string          // ISO timestamp
  daysUntil: number
  verified: boolean      // true when it comes from imported source_year data
  sourceYear: string | null
  custom?: boolean       // user-created event (stored in reminders, not derived)
  id?: string            // reminders row id — present only for custom events
}

// Build a LOCAL Date from a 'YYYY-MM-DD' date and optional 'HH:MM[:SS]' time.
function combineDateTime(dateStr: string | null, timeStr: string | null): Date | null {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return null
  let hh = 23, mm = 59
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number)
    if (Number.isFinite(h)) hh = h
    if (Number.isFinite(min)) mm = min
  }
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

export function daysFromNow(at: Date): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(at); d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

interface ComputeArgs {
  applications: Application[]
  schoolsById: Record<string, School>
  roundsBySchool: Record<string, SchoolRound[]>
}

// The student's OWN override on their application row (not falling back to the
// school) — this always wins so a manual planner/tracker edit is never masked by
// imported reference data.
function appOverrideDeadline(app: Application, appType: Application['application_type']): string | null {
  if (appType === 'EA' || appType === 'REA') return app.deadline_ea ?? null
  if (appType === 'ED') return app.deadline_ed ?? null
  if (appType === 'RD') return app.deadline_rd ?? null
  return app.deadline_ea ?? app.deadline_ed ?? app.deadline_rd ?? null
}
function appOverrideNotification(app: Application, appType: Application['application_type']): string | null {
  if (appType === 'EA' || appType === 'REA') return app.notification_ea ?? null
  if (appType === 'ED') return app.notification_ed ?? null
  return app.notification_date ?? null
}

export function computePlannerEvents({ applications, schoolsById, roundsBySchool }: ComputeArgs): PlannerEvent[] {
  const events: PlannerEvent[] = []

  for (const app of applications) {
    const school = schoolsById[app.school_id]
    if (!school) continue
    const appType = app.application_type
    const rounds = roundsBySchool[app.school_id] ?? []
    const matchRound = appType
      ? rounds.find(r => r.round.toUpperCase() === String(appType).toUpperCase())
      : undefined
    const roundLabel = matchRound?.round ?? appType ?? 'RD'

    // ── Deadline ── priority: user override > imported round > official column.
    {
      const override = appOverrideDeadline(app, appType)
      let dateStr: string | null = null, timeStr: string | null = null
      let verified = false, sourceYear: string | null = null
      if (override) {
        dateStr = override
      } else if (matchRound?.deadline_date) {
        dateStr = matchRound.deadline_date; timeStr = matchRound.deadline_time
        verified = !!matchRound.source_year; sourceYear = matchRound.source_year
      } else if (!school.deadline_rolling) {
        dateStr = getEffectiveDeadline(school, null, appType)
      }
      const dl = combineDateTime(dateStr, timeStr)
      if (dl) {
        events.push({
          key: `${school.id}:${roundLabel}:deadline`,
          kind: 'deadline', schoolId: school.id, schoolName: school.name,
          round: roundLabel, dueAt: dl.toISOString(), daysUntil: daysFromNow(dl),
          verified, sourceYear,
        })
      }
    }

    // ── Decision ── same priority order.
    {
      const override = appOverrideNotification(app, appType)
      let dateStr: string | null = null, timeStr: string | null = null
      let verified = false, sourceYear: string | null = null
      if (override) {
        dateStr = override
      } else if (matchRound?.decision_release_date) {
        dateStr = matchRound.decision_release_date; timeStr = matchRound.decision_release_time
        verified = !!matchRound.source_year; sourceYear = matchRound.source_year
      } else {
        dateStr = getEffectiveNotification(school, null, appType)
      }
      const dec = combineDateTime(dateStr, timeStr)
      if (dec) {
        events.push({
          key: `${school.id}:${roundLabel}:decision`,
          kind: 'decision', schoolId: school.id, schoolName: school.name,
          round: roundLabel, dueAt: dec.toISOString(), daysUntil: daysFromNow(dec),
          verified, sourceYear,
        })
      }
    }
  }

  return events.sort((a, b) => a.dueAt.localeCompare(b.dueAt))
}

// In-app reminder feed: upcoming, not-yet-past events the student should act on,
// minus any they've dismissed. (Email delivery of these is future work.)
export function activeReminders(events: PlannerEvent[], dismissedKeys: Set<string>, withinDays = 60): PlannerEvent[] {
  return events.filter(e =>
    e.kind === 'deadline' &&
    e.daysUntil >= 0 && e.daysUntil <= withinDays &&
    !dismissedKeys.has(e.key),
  )
}
