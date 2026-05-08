import { describe, expect, it } from "vitest"

import { DEFAULT_REMINDER_MODE, parseReminderMode } from "./reminders"

describe("parseReminderMode", () => {
  it("defaults on unknown", () => {
    expect(parseReminderMode(undefined)).toBe(DEFAULT_REMINDER_MODE)
    expect(parseReminderMode("bad")).toBe(DEFAULT_REMINDER_MODE)
  })

  it("accepts valid modes", () => {
    expect(parseReminderMode("dnd")).toBe("dnd")
  })
})
