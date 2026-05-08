import { describe, expect, it } from "vitest"

import { applyIndustryToggle } from "./selection"
import { FREE_INDUSTRY_LIMIT } from "./tiers"

describe("applyIndustryToggle", () => {
  it("adds and removes", () => {
    let s = applyIndustryToggle([], "a", true)
    expect(s).toEqual(["a"])
    s = applyIndustryToggle(s, "a", true)
    expect(s).toEqual([])
  })

  it("blocks fourth pick for free tier", () => {
    const base = ["a", "b", "c"] as string[]
    const after = applyIndustryToggle(base, "d", false)
    expect(after).toEqual(base)
  })

  it("allows more than free limit for Pro", () => {
    const base = Array.from({ length: FREE_INDUSTRY_LIMIT }, (_, i) => `x${i}`)
    const after = applyIndustryToggle(base, "d", true)
    expect(after).toHaveLength(FREE_INDUSTRY_LIMIT + 1)
  })
})
