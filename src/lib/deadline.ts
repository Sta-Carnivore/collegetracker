export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - today.getTime()) / 86400000)
}

export function deadlineUrgency(days: number | null): string {
  if (days === null || days < 0) return '#95A3A1'
  if (days <= 7)  return '#BA5A55'
  if (days <= 30) return '#C8A45A'
  return '#687B7C'
}

export function formatDays(days: number | null): string | null {
  if (days === null) return null
  if (days < 0)  return 'Past'
  if (days === 0) return 'Today'
  if (days === 1) return '1d left'
  return `${days}d left`
}
