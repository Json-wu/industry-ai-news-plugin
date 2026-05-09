export type UiLang = "zh" | "en"

/** BCP-47 标签，用于传给 Edge `summarize-article` 的 `locale`。 */
export function getBrowserLanguageTag(): string {
  try {
    if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) {
      return chrome.i18n.getUILanguage()
    }
  } catch {
    /* ignore */
  }
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    return navigator.language
  }
  return "en"
}

/** 侧栏 / 选项页 UI 文案语言（非中文浏览器默认英文）。 */
export function detectUiLang(): UiLang {
  return getBrowserLanguageTag().toLowerCase().startsWith("zh") ? "zh" : "en"
}

/** 与 Edge `normalizeSummaryLocale` 对齐。 */
export function normalizeSummaryLocale(tag: string): "zh" | "en" {
  return tag.trim().toLowerCase().startsWith("zh") ? "zh" : "en"
}
