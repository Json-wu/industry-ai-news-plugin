import { describe, expect, it, vi, afterEach } from "vitest"

import { nextOccurrenceMs } from "./alarms-time"

describe("nextOccurrenceMs", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns same day if time not passed", () => {
    const now = new Date("2026-04-22T08:00:00")
    const ts = nextOccurrenceMs(9, 0, now)
    expect(new Date(ts).getDate()).toBe(22)
    expect(new Date(ts).getHours()).toBe(9)
  })

  it("returns next day if time passed", () => {
    const now = new Date("2026-04-22T10:00:00")
    const ts = nextOccurrenceMs(9, 0, now)
    expect(new Date(ts).getDate()).toBe(23)
  })
})
