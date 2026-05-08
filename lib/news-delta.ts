import type { NewsBrief } from "./briefs"

export const MAX_TRACKED_NEWS_IDS = 60

export function trackedNewsIds(items: NewsBrief[]): string[] {
  return items.slice(0, MAX_TRACKED_NEWS_IDS).map((x) => x.id)
}

export function countNewIds(nextIds: string[], prevIds: string[]): number {
  if (nextIds.length === 0) {
    return 0
  }
  const prev = new Set(prevIds)
  let count = 0
  for (const id of nextIds) {
    if (!prev.has(id)) {
      count += 1
    }
  }
  return count
}

/** 按列表顺序返回第一条「上一批未见过的」简报（用于通知文案）。 */
export function firstNewBrief(
  items: NewsBrief[],
  prevIds: string[]
): NewsBrief | undefined {
  const prev = new Set(prevIds)
  for (const b of items) {
    if (!prev.has(b.id)) {
      return b
    }
  }
  return undefined
}
