// ABOUTME: Client component that shows a live countdown to a round's lock time.
// Updates every 60 seconds. Colors shift from default → orange (<24h) → red+pulse (<2h).
'use client'

import { useState, useEffect } from 'react'

function formatCountdown(lockTime: Date): { text: string; urgency: 'normal' | 'soon' | 'urgent' | 'locked' } {
  const now = new Date()
  const diff = lockTime.getTime() - now.getTime()

  if (diff <= 0) {
    return { text: 'Locked', urgency: 'locked' }
  }

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    const remainingHours = hours % 24
    return { text: `${days}d ${remainingHours}h remaining`, urgency: 'normal' }
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60
    return { text: `${hours}h ${remainingMinutes}m remaining`, urgency: hours < 2 ? 'urgent' : 'soon' }
  }

  return { text: minutes > 0 ? `${minutes}m remaining` : '< 1m remaining', urgency: 'urgent' }
}

export function CountdownTimer({
  lockTime,
  className = '',
}: {
  lockTime: string
  className?: string
}) {
  const [countdown, setCountdown] = useState(() => formatCountdown(new Date(lockTime)))

  useEffect(() => {
    const update = () => setCountdown(formatCountdown(new Date(lockTime)))
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [lockTime])

  const colorClass =
    countdown.urgency === 'locked'
      ? 'text-gray-400'
      : countdown.urgency === 'urgent'
        ? 'text-red-500 animate-pulse'
        : countdown.urgency === 'soon'
          ? 'text-orange-500'
          : ''

  return <span className={`${colorClass} ${className}`}>{countdown.text}</span>
}
