/**
 * 与仓库 `lib/rss-feeds.ts` 保持一致的源列表（Edge 内无法 import 扩展源码）。
 * 若修改一方，请同步另一方。
 */
export const RSS_FEEDS: Record<string, readonly string[]> = {
  tech: ["https://feeds.bbci.co.uk/news/technology/rss.xml"],
  politics: ["https://feeds.bbci.co.uk/news/politics/rss.xml"],
  military: ["https://feeds.bbci.co.uk/news/world/rss.xml"],
  medical: ["https://feeds.bbci.co.uk/news/health/rss.xml"],
  biology: ["https://export.arxiv.org/rss/q-bio"],
  environment: ["https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"]
}

/** 单用户邮件内最多展示的条目数 */
export const MAX_DIGEST_ITEMS = 12

/** 每个 feed 最多抓取条目再合并排序 */
export const MAX_ITEMS_PER_FEED = 15
