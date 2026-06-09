import { ApplicationType } from '@/types/database'

interface SchoolRoundData {
  rounds_offered?: string[] | null
  deadline_ea?: string | null
  deadline_ed?: string | null
  deadline_rolling?: boolean
}

export function getAvailableRounds(school: SchoolRoundData): ApplicationType[] {
  if (school.rounds_offered && school.rounds_offered.length > 0) {
    return school.rounds_offered as ApplicationType[]
  }
  const rounds: ApplicationType[] = []
  if (school.deadline_ea) rounds.push('EA')
  if (school.deadline_ed) rounds.push('ED')
  if (school.deadline_rolling) rounds.push('Rolling')
  rounds.push('RD')
  return rounds
}

interface SchoolNotificationData {
  notification_date?: string | null  // RD
  notification_ea?: string | null    // EA / REA
  notification_ed?: string | null    // ED
}

export function getNotificationDate(
  school: SchoolNotificationData,
  appType: ApplicationType | null | undefined
): string | null {
  if (appType === 'EA' || appType === 'REA') return school.notification_ea ?? null
  if (appType === 'ED') return school.notification_ed ?? null
  return school.notification_date ?? null  // RD / Rolling / unset
}

/* ── Per-user override resolution ──
   The global schools table holds official reference data (admin-only to edit).
   A student's personal edits live on their application row. These helpers resolve
   the EFFECTIVE value: the user's override when present, else the school's value. */

interface DeadlineFields {
  deadline_ea?: string | null
  deadline_ed?: string | null
  deadline_rd?: string | null
  deadline_rolling?: boolean
}
interface NotificationFields {
  notification_date?: string | null
  notification_ea?: string | null
  notification_ed?: string | null
}

export function getEffectiveDeadline(
  school: DeadlineFields,
  application: DeadlineFields | null | undefined,
  appType: ApplicationType | null | undefined,
): string | null {
  const ea = application?.deadline_ea ?? school.deadline_ea ?? null
  const ed = application?.deadline_ed ?? school.deadline_ed ?? null
  const rd = application?.deadline_rd ?? school.deadline_rd ?? null
  if (appType === 'EA' || appType === 'REA') return ea
  if (appType === 'ED') return ed
  if (appType === 'RD') return rd
  return ea ?? ed ?? rd
}

export function getEffectiveNotification(
  school: NotificationFields,
  application: NotificationFields | null | undefined,
  appType: ApplicationType | null | undefined,
): string | null {
  if (appType === 'EA' || appType === 'REA') return application?.notification_ea ?? school.notification_ea ?? null
  if (appType === 'ED') return application?.notification_ed ?? school.notification_ed ?? null
  return application?.notification_date ?? school.notification_date ?? null
}
