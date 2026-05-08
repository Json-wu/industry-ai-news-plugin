import { describe, expect, it } from "vitest"

import type { NewsBrief } from "./briefs"
import { countNewIds, firstNewBrief, trackedNewsIds } from "./news-delta"

describe("countNewIds", () => {
  it("returns 0 when no next ids", () => {
    expect(countNewIds([], ["a"])).toBe(0)
  })

  it("counts only truly new ids", () => {
    expect(countNewIds(["a", "b", "c"], ["a", "x"])).toBe(2)
  })
})

describe("trackedNewsIds", () => {
  it("returns stable ids in original order", () => {
    const ids = trackedNewsIds([
      { id: "n1" } as never,
      { id: "n2" } as never
    ])
    expect(ids).toEqual(["n1", "n2"])
  })
})

describe("firstNewBrief", () => {
  const mk = (id: string, title: string): NewsBrief => ({
    id,
    title,
    summary: "",
    url: `https://x/${id}`,
    source: "S",
    publishedAt: "2026-01-01",
    industry: "tech"
  })

  it("returns first item whose id was not in prevIds", () => {
    const items = [mk("a", "A"), mk("b", "B")]
    expect(firstNewBrief(items, ["a"])?.title).toBe("B")
    expect(firstNewBrief(items, [])).toEqual(items[0])
  })

  it("returns undefined when none new", () => {
    expect(firstNewBrief([mk("a", "A")], ["a"])).toBeUndefined()
  })
})
