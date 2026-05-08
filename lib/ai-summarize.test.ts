import { describe, expect, it } from "vitest"

import type { NewsBrief } from "./briefs"
import { mergeSummariesIntoBriefs } from "./ai-summarize"

describe("mergeSummariesIntoBriefs", () => {
  const base: NewsBrief[] = [
    {
      id: "a",
      title: "T1",
      summary: "old1",
      url: "https://x.com/1",
      source: "S",
      publishedAt: "2026-01-01",
      industry: "tech",
      dataSource: "rss"
    },
    {
      id: "b",
      title: "T2",
      summary: "old2",
      url: "https://x.com/2",
      source: "S",
      publishedAt: "2026-01-01",
      industry: "tech",
      dataSource: "mock"
    }
  ]

  it("只更新 rss 且 URL 命中的条目", () => {
    const out = mergeSummariesIntoBriefs(base, [
      { url: "https://x.com/1", summary: "  new1  " },
      { url: "https://unknown", summary: "x" }
    ])
    expect(out[0].summary).toBe("new1")
    expect(out[1].summary).toBe("old2")
  })

  it("summaries 为空时不变", () => {
    expect(mergeSummariesIntoBriefs(base, undefined)).toEqual(base)
    expect(mergeSummariesIntoBriefs(base, [])).toEqual(base)
  })
})
