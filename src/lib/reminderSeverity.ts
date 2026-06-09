import { C } from '@/lib/atlas'

/**
 * Shared reminder severity / priority model — the application's "risk weight"
 * engine, not a plain calendar.
 *
 * One source of truth, used by:
 *  - the in-app Planner feed (v1, now)
 *  - the future grouped email job (v1.1 — see docs/email-reminders.md)
 *  - future dashboard risk hints
 *
 * A reminder's urgency is a numeric 0–100 score derived from three factors:
 *   score = min(100, round(base(daysUntil) * eventTypeMultiplier * roundMultiplier))
 * Severity bands map that score to a colour/level the UI can render.
 *
 * This module is pure (no I/O, no React) so it is safe to import on both the
 * server (cron/email) and the client (Planner).
 */

export type ReminderEventType =
  | 'application_deadline'
  | 'essay'
  | 'decision_release'
  | 'custom'

export type ReminderSeverityLevel = 'normal' | 'level3' | 'level2' | 'level1'
export type ReminderTone = 'green' | 'yellow' | 'orange' | 'red'

// Accepts a bare {daysUntil,type,round} OR a Planner-style event (kind/custom) —
// `type` is derived from kind/custom when not given, so PlannerEvent can be passed
// straight in without adapting.
export interface ReminderScoreInput {
  daysUntil: number
  type?: ReminderEventType
  kind?: string
  custom?: boolean
  round?: string | null
}

export interface ReminderSeverity {
  level: ReminderSeverityLevel
  rank: number          // 1 = most urgent (level1) … 4 = normal. Handy for sorting.
  label: string         // short, neutral. Not a promise of any delivery channel.
  tone: ReminderTone
  color: string         // hex from the app palette
  score: number
}

// No orange exists in the core palette; this warm tone sits between gold and danger.
const SEVERITY_ORANGE = '#C47A3D'

/**
 * The fixed offsets (days before a deadline) at which a reminder "fires". Shared
 * so the in-app feed, the future grouped email job, and dashboard hints all agree
 * on the same cadence. 0 = day-of.
 */
export function getReminderSendOffsets(): number[] {
  return [30, 15, 7, 3, 2, 0]
}

const EVENT_TYPE_MULTIPLIER: Record<ReminderEventType, number> = {
  application_deadline: 1.0,
  essay: 0.9,
  decision_release: 0.45,
  custom: 0.75,
}

function resolveType(e: { type?: ReminderEventType; kind?: string; custom?: boolean }): ReminderEventType {
  if (e.type) return e.type
  if (e.custom) return 'custom'
  if (e.kind === 'decision') return 'decision_release'
  if (e.kind === 'essay') return 'essay'
  return 'application_deadline'
}

// Map a Planner-style event ({kind, custom}) to the model's event type. Exported
// so callers can label/group without re-implementing the mapping.
export function plannerEventType(e: { kind?: string; custom?: boolean }): ReminderEventType {
  return resolveType(e)
}

function roundMultiplier(round?: string | null): number {
  const r = String(round ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (r === 'ED' || r === 'ED0' || r === 'ED1' || r === 'ED2' || r === 'REA' || r === 'SCEA') return 1.15
  if (r === 'EA' || r === 'EA1' || r === 'EA2') return 1.0
  if (r === 'RD') return 0.9
  if (r === 'ROLLING') return 0.75
  return 1.0
}

// Base urgency from time-to-deadline alone. Hits the spec anchors exactly at
// 0/2/3/7/15/30 days and interpolates linearly between them; past 30 days it
// decays continuously toward 0 (still well inside "green").
const BASE_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 100], [2, 95], [3, 90], [7, 70], [15, 45], [30, 20],
]
function baseScore(daysUntil: number): number {
  const d = daysUntil
  if (d <= 0) return 100
  if (d >= 30) return (20 * 30) / d   // continuous with the 30-day anchor (=20 at d=30)
  for (let i = 1; i < BASE_ANCHORS.length; i++) {
    const [d0, s0] = BASE_ANCHORS[i - 1]
    const [d1, s1] = BASE_ANCHORS[i]
    if (d <= d1) {
      const t = (d - d0) / (d1 - d0)
      return s0 + (s1 - s0) * t
    }
  }
  return 20
}

/** Numeric 0–100 urgency score for an event. */
export function calculateReminderScore(event: ReminderScoreInput): number {
  const base = baseScore(event.daysUntil)
  const score = base * EVENT_TYPE_MULTIPLIER[resolveType(event)] * roundMultiplier(event.round)
  return Math.min(100, Math.round(score))
}

/** Severity band (level / colour / tone) for an event. */
export function getReminderSeverity(event: ReminderScoreInput): ReminderSeverity {
  const score = calculateReminderScore(event)
  if (score >= 85) return { level: 'level1', rank: 1, label: 'Critical', tone: 'red',    color: C.danger,        score }
  if (score >= 65) return { level: 'level2', rank: 2, label: 'High',     tone: 'orange', color: SEVERITY_ORANGE, score }
  if (score >= 40) return { level: 'level3', rank: 3, label: 'Medium',   tone: 'yellow', color: C.gold,          score }
  return                  { level: 'normal', rank: 4, label: 'Normal',   tone: 'green',  color: C.success,       score }
}

/**
 * Sort events by urgency score (highest first), then by soonest due date as a
 * tiebreak so a same-score cluster still reads chronologically.
 */
export function sortReminderEventsByPriority<T extends ReminderScoreInput & { dueAt?: string }>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const byScore = calculateReminderScore(b) - calculateReminderScore(a)
    if (byScore !== 0) return byScore
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt)
    return a.daysUntil - b.daysUntil
  })
}

/**
 * Group events by local calendar day (from `dueAt`). Useful for the future
 * "one email per user per day" grouping and for clustering same-day items in UI.
 * Returned groups are sorted by date ascending.
 */
export function groupReminderEventsByDate<T extends { dueAt: string }>(events: T[]): { date: string; events: T[] }[] {
  const map = new Map<string, T[]>()
  for (const e of events) {
    const d = new Date(e.dueAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const bucket = map.get(key)
    if (bucket) bucket.push(e)
    else map.set(key, [e])
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, evs]) => ({ date, events: evs }))
}
