import { FREE_INDUSTRY_LIMIT } from "./tiers"

/** Toggle an id; free users cannot exceed FREE_INDUSTRY_LIMIT. */
export function applyIndustryToggle(
  current: string[],
  id: string,
  isPro: boolean
): string[] {
  const next = new Set(current)
  if (next.has(id)) {
    next.delete(id)
  } else {
    if (!isPro && next.size >= FREE_INDUSTRY_LIMIT) {
      return current
    }
    next.add(id)
  }
  return Array.from(next)
}
