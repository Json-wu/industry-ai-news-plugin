import { describe, expect, it } from "vitest"

import { parseUiTheme } from "./theme"

describe("parseUiTheme", () => {
  it("defaults", () => {
    expect(parseUiTheme(undefined)).toBe("light")
  })
  it("accepts dark", () => {
    expect(parseUiTheme("dark")).toBe("dark")
  })
})
