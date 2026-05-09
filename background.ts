import { nextOccurrenceMs } from "./lib/alarms-time"
import { type IndustryId, isIndustryId } from "./lib/industries"
import { msg } from "./lib/messages"
import { countNewIds, firstNewBrief, trackedNewsIds } from "./lib/news-delta"
import { loadNewsForIndustries } from "./lib/news-service"
import { parseReminderMode } from "./lib/reminders"
import { STORAGE } from "./lib/storage-keys"
import { detectUiLang } from "./lib/ui-locale"

void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

const ALARM_NAMES = ["digest-2h", "digest-9", "digest-18"] as const

async function clearDigestAlarms() {
  for (const n of ALARM_NAMES) {
    await chrome.alarms.clear(n)
  }
}

async function syncAlarms() {
  await clearDigestAlarms()
  const r = await chrome.storage.sync.get(STORAGE.reminderMode)
  const mode = parseReminderMode(r[STORAGE.reminderMode])
  if (mode === "dnd") {
    return
  }
  if (mode === "every2h") {
    await chrome.alarms.create("digest-2h", { periodInMinutes: 120 })
    return
  }
  if (mode === "twiceDaily") {
    const now = new Date()
    const t9 = nextOccurrenceMs(9, 0, now)
    const t18 = nextOccurrenceMs(18, 0, now)
    await chrome.alarms.create("digest-9", {
      when: t9,
      periodInMinutes: 24 * 60
    })
    await chrome.alarms.create("digest-18", {
      when: t18,
      periodInMinutes: 24 * 60
    })
  }
}

function notificationIconUrl(): string | undefined {
  const m = chrome.runtime.getManifest()
  const path = m.icons?.["64"] ?? m.icons?.["128"] ?? m.icons?.["48"]
  return path ? chrome.runtime.getURL(path) : undefined
}

const DIGEST_NOTIFICATION_ID_PREFIX = "digest-news-"

async function openSidePanelForActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true
  })
  const activeTab = tabs[0]
  if (!activeTab?.id) {
    return
  }
  await chrome.sidePanel.open({ tabId: activeTab.id })
}

async function maybeNotifyForFreshBriefs() {
  const syncData = await chrome.storage.sync.get([
    STORAGE.reminderMode,
    STORAGE.industrySelectionIds,
    STORAGE.newsMockOnly
  ])
  if (parseReminderMode(syncData[STORAGE.reminderMode]) === "dnd") {
    return
  }

  const rawIndustries = syncData[STORAGE.industrySelectionIds]
  const industryIds = Array.isArray(rawIndustries)
    ? rawIndustries.filter(
        (x): x is IndustryId => typeof x === "string" && isIndustryId(x)
      )
    : []
  if (industryIds.length === 0) {
    return
  }

  const news = await loadNewsForIndustries(industryIds, {
    mockOnly: syncData[STORAGE.newsMockOnly] === true
  })
  const nextIds = trackedNewsIds(news.items)
  if (nextIds.length === 0) {
    return
  }

  const localData = await chrome.storage.local.get(STORAGE.latestSeenNewsIds)
  const rawPrev = localData[STORAGE.latestSeenNewsIds]
  const prevIds =
    Array.isArray(rawPrev) && rawPrev.every((x) => typeof x === "string")
      ? (rawPrev as string[])
      : []

  const nextNewCount = countNewIds(nextIds, prevIds)
  await chrome.storage.local.set({ [STORAGE.latestSeenNewsIds]: nextIds })

  // 首次建立基线不提醒，避免安装后立即打扰。
  if (prevIds.length === 0 || nextNewCount === 0) {
    return
  }

  const icon = notificationIconUrl()
  const head = firstNewBrief(news.items, prevIds)
  const lang = detectUiLang()
  const m = msg(lang)
  let titleQuoted = ""
  if (head?.title && head.title.length > 0) {
    const t = `${head.title.slice(0, 48)}${head.title.length > 48 ? "…" : ""}`
    titleQuoted = lang === "zh" ? `「${t}」` : `"${t}" `
  }
  const message =
    nextNewCount === 1
      ? titleQuoted
        ? m.notificationSingleWithTitle(titleQuoted)
        : m.notificationSingleNoTitle
      : titleQuoted
        ? m.notificationMultiWithTitle(nextNewCount, titleQuoted)
        : m.notificationMultiNoTitle(nextNewCount)
  if (head?.id) {
    await chrome.storage.local.set({
      [STORAGE.pendingDigestFocusNewsId]: head.id
    })
  }

  const notificationId = `${DIGEST_NOTIFICATION_ID_PREFIX}${Date.now()}`
  await chrome.notifications.create(notificationId, {
    type: "basic",
    title: "Industry AI News",
    message,
    ...(icon ? { iconUrl: icon } : {})
  })
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith("digest-")) {
    return
  }
  void maybeNotifyForFreshBriefs()
})

chrome.notifications.onClicked.addListener((notificationId) => {
  if (!notificationId.startsWith(DIGEST_NOTIFICATION_ID_PREFIX)) {
    return
  }
  void openSidePanelForActiveTab()
  void chrome.notifications.clear(notificationId)
})

chrome.runtime.onInstalled.addListener(() => {
  void syncAlarms()
})

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") {
    return
  }
  // 字面量 key，避免与 bundler 对 STORAGE 的转换冲突
  if (changes["reminderMode"]) {
    void syncAlarms()
  }
  if (changes["industrySelectionIds"] || changes["newsMockOnly"]) {
    void chrome.storage.local.remove(STORAGE.latestSeenNewsIds)
  }
})

void syncAlarms()
