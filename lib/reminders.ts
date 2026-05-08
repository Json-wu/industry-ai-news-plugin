export type ReminderMode = "every2h" | "dnd" | "twiceDaily"

export const DEFAULT_REMINDER_MODE: ReminderMode = "every2h"

export const REMINDER_OPTIONS: ReadonlyArray<{
  id: ReminderMode
  label: string
  description: string
}> = [
  { id: "every2h", label: "每 2 小时", description: "默认，定时提醒" },
  { id: "dnd", label: "免打扰", description: "不推送系统提醒" },
  { id: "twiceDaily", label: "每天 2 次", description: "约 9:00 与 18:00" }
]

export function parseReminderMode(v: unknown): ReminderMode {
  if (v === "every2h" || v === "dnd" || v === "twiceDaily") {
    return v
  }
  return DEFAULT_REMINDER_MODE
}
