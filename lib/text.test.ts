import { describe, expect, it } from "vitest"

import { stripHtml } from "./text"

describe("stripHtml", () => {
  it("strips tags", () => {
    expect(stripHtml("<p>a</p>")).toBe("a")
  })
})
