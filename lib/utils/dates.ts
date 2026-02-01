import { formatDistanceToNow, isPast, format } from 'date-fns'

export function isRoundLocked(lockTime: Date): boolean {
  return isPast(lockTime)
}

export function getTimeUntilLock(lockTime: Date): string {
  if (isPast(lockTime)) {
    return 'Locked'
  }
  return formatDistanceToNow(lockTime, { addSuffix: true })
}

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a')
}

export function formatShortDate(date: Date): string {
  return format(date, 'MMM d, yyyy')
}
