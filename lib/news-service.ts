import { filterBriefsByIndustries, MOCK_BRIEFS, type NewsBrief } from "./briefs"
import type { IndustryId } from "./industries"
import { msg } from "./messages"
import { type ParsedFeedItem, parseRssXml } from "./parse-rss"
import { MAX_ITEMS_PER_FEED, RSS_FEEDS } from "./rss-feeds"
import { detectUiLang, type UiLang } from "./ui-locale"
import { idFromUrl } from "./url-id"

const TTL_MS = 5 * 60 * 1000

type Cache = { key: string; at: number; result: NewsBrief[] }

let cache: Cache | null = null

export function clearNewsCache() {
  cache = null
}

function cacheKey(
  industries: IndustryId[],
  mockOnly: boolean,
  lang: UiLang
): string {
  return `${mockOnly ? "m" : "l"}:${lang}:${[...industries].sort().join(",")}`
}

async function fetchFeedXml(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      Accept:
        "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
    }
  })
  if (!r.ok) {
    throw new Error(`HTTP ${r.status}`)
  }
  return r.text()
}

function toNewsBriefs(
  parsed: { channelTitle: string; items: ParsedFeedItem[] },
  industry: IndustryId
): NewsBrief[] {
  const source = parsed.channelTitle.slice(0, 60) || "RSS"
  return parsed.items.slice(0, MAX_ITEMS_PER_FEED).map((it) => {
    const b: NewsBrief = {
      id: idFromUrl(it.url),
      title: it.title,
      summary: it.summary,
      url: it.url,
      source,
      publishedAt: it.publishedAt,
      industry,
      dataSource: "rss" as const
    }
    if (it.imageUrl) {
      b.imageUrl = it.imageUrl
    }
    return b
  })
}

export type LoadNewsResult = {
  items: NewsBrief[]
  source: "live" | "mock"
  error?: string
}

export type LoadNewsOptions = {
  /** 为 true 时不请求网络，仅返回过滤后的 MOCKS */
  mockOnly?: boolean
  /** 错误提示语言；默认跟随浏览器 */
  lang?: UiLang
}

/**
 * 按用户所选行业拉取白名单 RSS，合并去重、按日期排序；失败时回退演示数据。
 */
export async function loadNewsForIndustries(
  industries: IndustryId[],
  options?: LoadNewsOptions
): Promise<LoadNewsResult> {
  if (industries.length === 0) {
    return { items: [], source: "live" }
  }

  const lang = options?.lang ?? detectUiLang()
  const m = msg(lang)

  const mockOnly = options?.mockOnly === true
  if (mockOnly) {
    const mock = filterBriefsByIndustries(MOCK_BRIEFS, industries).map(
      (m) => ({ ...m, dataSource: "mock" as const })
    )
    return { items: mock, source: "mock" }
  }

  const key = cacheKey(industries, false, lang)
  const now = Date.now()
  if (cache && cache.key === key && now - cache.at < TTL_MS) {
    return { items: cache.result, source: "live" }
  }

  const all: NewsBrief[] = []
  const errors: string[] = []

  for (const ind of industries) {
    const urls = RSS_FEEDS[ind] || []
    for (const feedUrl of urls) {
      try {
        const xml = await fetchFeedXml(feedUrl)
        const parsed = parseRssXml(xml)
        if (parsed.items.length === 0) {
          errors.push(m.feedNoItems(feedUrl))
        } else {
          all.push(...toNewsBriefs(parsed, ind))
        }
      } catch (e) {
        errors.push(
          `${feedUrl}: ${e instanceof Error ? e.message : String(e)}`
        )
      }
    }
  }

  const seen = new Set<string>()
  const dedup: NewsBrief[] = []
  for (const b of all) {
    if (seen.has(b.url)) {
      continue
    }
    seen.add(b.url)
    dedup.push(b)
  }

  dedup.sort((a, b) => {
    if (a.publishedAt === b.publishedAt) {
      return 0
    }
    return a.publishedAt < b.publishedAt ? 1 : -1
  })

  if (dedup.length > 0) {
    cache = { key, at: now, result: dedup }
    return {
      items: dedup,
      source: "live",
      error:
        errors.length > 0
          ? m.rssPartialFailure(errors.slice(0, 2).join(lang === "zh" ? "； " : "; "))
          : undefined
    }
  }

  const mock = filterBriefsByIndustries(MOCK_BRIEFS, industries).map(
    (m) => ({ ...m, dataSource: "mock" as const })
  )
  return {
    items: mock,
    source: "mock",
    error: m.rssFetchFailed(errors[0] ?? "")
  }
}
