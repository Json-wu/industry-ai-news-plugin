import type { SupabaseClient } from "@supabase/supabase-js"

import {
  filterIndustryIds,
  industryIdsToDb,
  isRemoteNewerThanLocalWrite,
  rowToReminderMode,
  rowToUiTheme,
  USER_EXTENSION_PREFERENCES_TABLE,
  type UserExtensionPreferencesRow
} from "./extension-preferences"
import { type IndustryId, isIndustryId } from "./industries"
import { type ReminderMode, parseReminderMode } from "./reminders"
import { STORAGE } from "./storage-keys"
import { type UiTheme, parseUiTheme } from "./theme"

export type ExtensionPrefsState = {
  onboardingComplete: boolean
  industrySelectionIds: IndustryId[]
  isPro: boolean
  reminderMode: ReminderMode
  reminderEmail: string
  newsMockOnly: boolean
  uiTheme: UiTheme
}

export type ExtensionPrefsSyncSource =
  | "unchanged"
  | "applied_remote"
  | "pushed_local"
  | "bootstrap_insert"

export type ExtensionPrefsSyncResult = {
  state: ExtensionPrefsState
  source: ExtensionPrefsSyncSource
}

const SYNC_KEYS = [
  STORAGE.onboardingComplete,
  STORAGE.industrySelectionIds,
  STORAGE.isPro,
  STORAGE.reminderMode,
  STORAGE.reminderEmail,
  STORAGE.uiTheme,
  STORAGE.newsMockOnly,
  STORAGE.prefsLastLocalWriteAt
] as const

function getSyncArea(): typeof chrome.storage.sync {
  return chrome.storage.sync
}

function readSyncPrefs(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    getSyncArea().get([...SYNC_KEYS], (r) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(err)
        return
      }
      resolve(r)
    })
  })
}

function writeSyncPrefs(patch: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    getSyncArea().set(patch, () => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(err)
        return
      }
      resolve()
    })
  })
}

export function syncRecordToState(
  r: Record<string, unknown>
): ExtensionPrefsState {
  const ob = r[STORAGE.onboardingComplete]
  const raw = r[STORAGE.industrySelectionIds]
  const hadIndustries =
    Array.isArray(raw) &&
    raw.some((x) => typeof x === "string" && isIndustryId(x))
  const onboardingComplete = ob === true || hadIndustries
  const industrySelectionIds = filterIndustryIds(raw)
  const isPro = typeof r[STORAGE.isPro] === "boolean" ? r[STORAGE.isPro] : false
  return {
    onboardingComplete,
    industrySelectionIds,
    isPro: isPro as boolean,
    reminderMode: parseReminderMode(r[STORAGE.reminderMode]),
    reminderEmail:
      typeof r[STORAGE.reminderEmail] === "string"
        ? (r[STORAGE.reminderEmail] as string)
        : "",
    newsMockOnly: r[STORAGE.newsMockOnly] === true,
    uiTheme: parseUiTheme(r[STORAGE.uiTheme])
  }
}

function stateToUpsertPayload(
  userId: string,
  s: ExtensionPrefsState
): Record<string, unknown> {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    industry_ids: industryIdsToDb(s.industrySelectionIds),
    is_pro: s.isPro,
    reminder_mode: s.reminderMode,
    reminder_email: s.reminderEmail,
    news_mock_only: s.newsMockOnly,
    ui_theme: s.uiTheme,
    onboarding_complete: s.onboardingComplete,
    updated_at: now
  }
}

function rowToChromePatch(
  row: UserExtensionPreferencesRow
): Record<string, unknown> {
  return {
    [STORAGE.onboardingComplete]: row.onboarding_complete,
    [STORAGE.industrySelectionIds]: filterIndustryIds(row.industry_ids),
    [STORAGE.isPro]: row.is_pro,
    [STORAGE.reminderMode]: rowToReminderMode(row),
    [STORAGE.reminderEmail]: row.reminder_email,
    [STORAGE.newsMockOnly]: row.news_mock_only,
    [STORAGE.uiTheme]: rowToUiTheme(row),
    [STORAGE.prefsLastLocalWriteAt]: row.updated_at
  }
}

function isPrefsRow(x: unknown): x is UserExtensionPreferencesRow {
  if (!x || typeof x !== "object") {
    return false
  }
  const o = x as Record<string, unknown>
  return (
    typeof o.user_id === "string" &&
    Array.isArray(o.industry_ids) &&
    typeof o.is_pro === "boolean" &&
    typeof o.reminder_mode === "string" &&
    typeof o.reminder_email === "string" &&
    typeof o.news_mock_only === "boolean" &&
    typeof o.ui_theme === "string" &&
    typeof o.onboarding_complete === "boolean" &&
    typeof o.updated_at === "string"
  )
}

/**
 * 与 Supabase 对齐扩展偏好：无行则插入本地快照；有行则按 `updated_at` 与本地
 * `prefsLastLocalWriteAt` 做 LWW（服务端更新则写回 chrome.storage.sync）。
 */
export async function syncExtensionPreferencesWithSupabase(
  supabase: SupabaseClient
): Promise<ExtensionPrefsSyncResult | null> {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()
  if (sessionError || !session?.user?.id) {
    return null
  }
  const userId = session.user.id
  const localRecord = await readSyncPrefs()
  const localState = syncRecordToState(localRecord)
  const lastLocal = localRecord[STORAGE.prefsLastLocalWriteAt]
  const lastLocalWrite =
    typeof lastLocal === "string" ? lastLocal : undefined

  const { data: rawRow, error: selectError } = await supabase
    .from(USER_EXTENSION_PREFERENCES_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (selectError) {
    console.warn(
      "[extension-prefs] select failed",
      selectError.message ?? selectError
    )
    return null
  }

  if (!rawRow || !isPrefsRow(rawRow)) {
    const payload = stateToUpsertPayload(userId, localState)
    const { data: inserted, error: upsertError } = await supabase
      .from(USER_EXTENSION_PREFERENCES_TABLE)
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single()

    if (upsertError || !inserted || !isPrefsRow(inserted)) {
      console.warn(
        "[extension-prefs] bootstrap upsert failed",
        upsertError?.message ?? upsertError
      )
      return null
    }
    await writeSyncPrefs(rowToChromePatch(inserted))
    return {
      state: syncRecordToState({
        ...localRecord,
        ...rowToChromePatch(inserted)
      }),
      source: "bootstrap_insert"
    }
  }

  const row = rawRow

  if (isRemoteNewerThanLocalWrite(row.updated_at, lastLocalWrite)) {
    await writeSyncPrefs(rowToChromePatch(row))
    return {
      state: syncRecordToState({
        ...localRecord,
        ...rowToChromePatch(row)
      }),
      source: "applied_remote"
    }
  }

  if (row.updated_at === lastLocalWrite) {
    return { state: localState, source: "unchanged" }
  }

  const payload = stateToUpsertPayload(userId, localState)
  const { data: updated, error: pushError } = await supabase
    .from(USER_EXTENSION_PREFERENCES_TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (pushError || !updated || !isPrefsRow(updated)) {
    console.warn(
      "[extension-prefs] push failed",
      pushError?.message ?? pushError
    )
    return { state: localState, source: "unchanged" }
  }

  await writeSyncPrefs({
    [STORAGE.prefsLastLocalWriteAt]: updated.updated_at
  })
  return {
    state: localState,
    source: "pushed_local"
  }
}

/** 本地保存设置后推送到云端（若已登录）。 */
export async function pushExtensionPreferencesAfterLocalSave(
  supabase: SupabaseClient,
  state: ExtensionPrefsState
): Promise<void> {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()
  if (sessionError || !session?.user?.id) {
    return
  }
  const payload = stateToUpsertPayload(session.user.id, state)
  const { data: updated, error } = await supabase
    .from(USER_EXTENSION_PREFERENCES_TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single()

  if (error || !updated || !isPrefsRow(updated)) {
    console.warn(
      "[extension-prefs] push after save failed",
      error?.message ?? error
    )
    return
  }
  await writeSyncPrefs({
    [STORAGE.prefsLastLocalWriteAt]: updated.updated_at
  })
}

/** 登出后清理敏感本地字段（与云端会话解绑）。 */
export async function clearSensitiveLocalPrefsAfterSignOut(): Promise<void> {
  await writeSyncPrefs({
    [STORAGE.reminderEmail]: ""
  })
}

/**
 * 任意偏好写入后应调用，使 LWW 以本地为准直到云端有更新。
 * `iso` 建议使用 `new Date().toISOString()`。
 */
export async function bumpPrefsLastLocalWriteAt(iso: string): Promise<void> {
  await writeSyncPrefs({ [STORAGE.prefsLastLocalWriteAt]: iso })
}
