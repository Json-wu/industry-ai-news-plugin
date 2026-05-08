/** Free plan: at most this many industries can be selected. */
export const FREE_INDUSTRY_LIMIT = 3

export function canSelectIndustries(
  selectedCount: number,
  isPro: boolean
): boolean {
  if (isPro) {
    return true
  }
  return selectedCount < FREE_INDUSTRY_LIMIT
}
