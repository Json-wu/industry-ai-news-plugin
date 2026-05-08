import { describe, expect, it } from "vitest"

import {
  filterBriefsByIndustries,
  imageUrlForBrief,
  MOCK_BRIEFS
} from "./briefs"

describe("filterBriefsByIndustries", () => {
  it("returns empty if no industries", () => {
    expect(filterBriefsByIndustries(MOCK_BRIEFS, [])).toEqual([])
  })

  it("filters by single industry", () => {
    const r = filterBriefsByIndustries(MOCK_BRIEFS, ["tech"])
    expect(r.length).toBeGreaterThan(0)
    expect(r[0].industry).toBe("tech")
  })
})

describe("imageUrlForBrief", () => {
  it("uses custom url when set", () => {
    const u = imageUrlForBrief({
      id: "x",
      title: "t",
      summary: "s",
      url: "https://a",
      source: "z",
      publishedAt: "d",
      industry: "tech",
      imageUrl: "https://custom/img.png"
    })
    expect(u).toBe("https://custom/img.png")
  })

  it("derives from id when missing", () => {
    const u = imageUrlForBrief({
      id: "99",
      title: "t",
      summary: "s",
      url: "https://a",
      source: "z",
      publishedAt: "d",
      industry: "tech"
    })
    expect(u).toContain("picsum.photos")
  })
})
