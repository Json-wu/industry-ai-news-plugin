import type { SupabaseClient } from "@supabase/supabase-js"

import type { NewsBrief } from "./briefs"
import { getBrowserLanguageTag, normalizeSummaryLocale } from "./ui-locale"

/** 单次调用 Edge 最多处理的 RSS 条数（控制延迟与费用）。 */
export const AI_SUMMARY_MAX_ITEMS = 10

export type AiSummaryRow = { url: string; summary: string }

type InvokePayload = { summaries: AiSummaryRow[] }

/**
 * 将 Edge 返回的摘要按 URL 合并回列表；未知 URL或空摘要保持原 summary。
 */
export function mergeSummariesIntoBriefs(
  items: NewsBrief[],
  summaries: AiSummaryRow[] | undefined
): NewsBrief[] {
  if (!summaries?.length) {
    return items
  }
  const byUrl = new Map(
    summaries
      .filter((s) => s.url && typeof s.summary === "string" && s.summary.trim())
      .map((s) => [s.url, s.summary.trim()])
  )
  if (byUrl.size === 0) {
    return items
  }
  return items.map((b) => {
    if (b.dataSource !== "rss") {
      return b
    }
    const s = byUrl.get(b.url)
    if (!s) {
      return b
    }
    return { ...b, summary: s }
  })
}

/**
 * 对已登录用户调用 Supabase Edge（默认 DeepSeek）批量改写 RSS 条目的摘要；未登录或调用失败时原样返回。
 */
export async function enrichBriefsWithAiSummaries(
  supabase: SupabaseClient,
  items: NewsBrief[]
): Promise<NewsBrief[]> {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session?.access_token) {
    return items
  }

  const rss = items.filter((b) => b.dataSource === "rss" && b.url && b.title)
  if (rss.length === 0) {
    return items
  }
  const slice = rss.slice(0, AI_SUMMARY_MAX_ITEMS)
  const locale = normalizeSummaryLocale(getBrowserLanguageTag())
  const body = {
    locale,
    items: slice.map((b) => ({
      url: b.url,
      title: b.title,
      hint: b.summary.slice(0, 500)
    }))
  }

  const { data, error } = await supabase.functions.invoke<InvokePayload>(
    "summarize-article",
    { body }
  )

  if (error) {
    console.warn("[ai-summarize] invoke failed", error.message ?? error)
    return items
  }
  if (!data?.summaries) {
    return items
  }
  return mergeSummariesIntoBriefs(items, data.summaries)
}
