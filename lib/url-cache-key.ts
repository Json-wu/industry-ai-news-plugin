/**
 * 将文章 URL 规范为摘要缓存键（与 Edge `summarize-article` / `article_summary_cache` 一致）。
 */
export function canonicalUrlForSummaryCache(raw: string): string {
  const s = raw.trim()
  if (!s) {
    return ""
  }
  try {
    const u = new URL(s)
    u.hash = ""
    if (u.pathname !== "/" && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.replace(/\/+$/, "") || "/"
    }
    return u.toString()
  } catch {
    return s
  }
}
