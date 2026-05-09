import { describe, expect, it } from "vitest"

import { normalizeSummaryLocale } from "./ui-locale"

describe("normalizeSummaryLocale", () => {
  it("maps zh variants", () => {
    expect(normalizeSummaryLocale("zh-CN")).toBe("zh")
    expect(normalizeSummaryLocale("ZH-hans")).toBe("zh")
  })

  it("defaults non-zh to en", () => {
    expect(normalizeSummaryLocale("en-US")).toBe("en")
    expect(normalizeSummaryLocale("ja")).toBe("en")
  })
})
