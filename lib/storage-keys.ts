export const STORAGE = {
  onboardingComplete: "onboardingComplete",
  industrySelectionIds: "industrySelectionIds",
  isPro: "isPro",
  /** every2h | dnd | twiceDaily */
  reminderMode: "reminderMode",
  reminderEmail: "reminderEmail",
  /** "light" | "dark" */
  uiTheme: "uiTheme",
  /** 为 true 时不请求 RSS，仅用本地演示数据 */
  newsMockOnly: "newsMockOnly",
  /**
   * ISO 时间戳：本地最后一次写入偏好 bundle 的时间，用于与云端 `updated_at` 做 LWW。
   * 缺省时在比较中视为 1970-01-01，以便新设备拉取已有云端数据。
   */
  prefsLastLocalWriteAt: "prefsLastLocalWriteAt",
  /** 后台提醒使用：最近一批已见资讯 id（避免重复提醒） */
  latestSeenNewsIds: "latestSeenNewsIds"
} as const

export type StorageKey = (typeof STORAGE)[keyof typeof STORAGE]
