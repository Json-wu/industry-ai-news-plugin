/**
 * Next local time occurrence of (hour, minute). If that moment has passed today, use tomorrow.
 */
export function nextOccurrenceMs(hour: number, minute: number, now: Date = new Date()): number {
  const t = new Date(now)
  t.setSeconds(0, 0)
  t.setMilliseconds(0)
  t.setHours(hour, minute, 0, 0)
  if (t.getTime() <= now.getTime()) {
    t.setDate(t.getDate() + 1)
  }
  return t.getTime()
}
