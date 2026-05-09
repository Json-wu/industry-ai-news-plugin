import { msg } from "./messages"
import type { UiLang } from "./ui-locale"

export type ReminderMode = "every2h" | "dnd" | "twiceDaily"

export const DEFAULT_REMINDER_MODE: ReminderMode = "every2h"

export function getReminderOptions(lang: UiLang): ReadonlyArray<{
  id: ReminderMode
  label: string
  description: string
}> {
  const m = msg(lang)
  return [
    { id: "every2h", label: m.reminderEvery2hLabel, description: m.reminderEvery2hDesc },
    { id: "dnd", label: m.reminderDndLabel, description: m.reminderDndDesc },
    {
      id: "twiceDaily",
      label: m.reminderTwiceLabel,
      description: m.reminderTwiceDesc
    }
  ]
}

export function parseReminderMode(v: unknown): ReminderMode {
  if (v === "every2h" || v === "dnd" || v === "twiceDaily") {
    return v
  }
  return DEFAULT_REMINDER_MODE
}
