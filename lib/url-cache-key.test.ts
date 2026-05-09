import { describe, expect, it } from "vitest"

import { canonicalUrlForSummaryCache } from "./url-cache-key"

describe("canonicalUrlForSummaryCache", () => {
  it("strips hash and trailing slash on path", () => {
    expect(
      canonicalUrlForSummaryCache("https://ex.com/a/b/#x")
    ).toBe("https://ex.com/a/b")
  })

  it("keeps root path", () => {
    expect(canonicalUrlForSummaryCache("https://ex.com/")).toBe(
      "https://ex.com/"
    )
  })
})
