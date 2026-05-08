import { describe, expect, it } from "vitest"

import { canSelectIndustries, FREE_INDUSTRY_LIMIT } from "./tiers"

describe("canSelectIndustries", () => {
  it("allows unlimited for Pro", () => {
    expect(canSelectIndustries(100, true)).toBe(true)
  })

  it("allows 0, 1, 2 while under free cap", () => {
    expect(canSelectIndustries(0, false)).toBe(true)
    expect(canSelectIndustries(1, false)).toBe(true)
    expect(canSelectIndustries(2, false)).toBe(true)
  })

  it("blocks when free user already at limit", () => {
    expect(canSelectIndustries(FREE_INDUSTRY_LIMIT, false)).toBe(false)
  })
})
