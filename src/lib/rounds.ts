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
