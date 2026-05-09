import type { IndustryId } from "./industries"
import { isIndustryId } from "./industries"
import type { ReminderMode } from "./reminders"
import { parseReminderMode } from "./reminders"
import type { UiTheme } from "./theme"
import { parseUiTheme } from "./theme"

export const USER_EXTENSION_PREFERENCES_TABLE =
  "user_extension_preferences" as const

export type UserExtensionPreferencesRow = {
  user_id: string
  industry_ids: string[]
  is_pro: boolean
  reminder_mode: string
  reminder_email: string
  news_mock_only: boolean
  ui_theme: string
  onboarding_complete: boolean
  updated_at: string
  email_digest_opt_out?: boolean
}

/** Lexicographic ISO compare; Postgres timestamptz round-trips as ISO. */
export function isRemoteNewerThanLocalWrite(
  remoteUpdatedAt: string,
  prefsLastLocalWriteAt: string | undefined
): boolean {
  const local = prefsLastLocalWriteAt ?? "1970-01-01T00:00:00.000Z"
  return remoteUpdatedAt > local
}

export function filterIndustryIds(raw: unknown): IndustryId[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.filter((x): x is IndustryId => typeof x === "string" && isIndustryId(x))
}

export function rowToReminderMode(row: UserExtensionPreferencesRow): ReminderMode {
  return parseReminderMode(row.reminder_mode)
}

export function rowToUiTheme(row: UserExtensionPreferencesRow): UiTheme {
  return parseUiTheme(row.ui_theme)
}

export function industryIdsToDb(ids: IndustryId[]): string[] {
  return [...ids]
}
