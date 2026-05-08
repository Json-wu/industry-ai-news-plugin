import type { IndustryId } from "./industries"

/**
 * 各行业白名单 RSS（可随阶段 A 迭代替换为更垂直的源）。
 * 扩展在具备广泛 host_permissions 时由 Service Worker / 侧栏页 fetch，一般不受网页 CORS 限制。
 *
 * 若改 URL，请同步 `supabase/functions/_shared/rss-config.ts`（邮件简报 Edge 使用同一列表）。
 */
export const RSS_FEEDS: Record<IndustryId, readonly string[]> = {
  tech: ["https://feeds.bbci.co.uk/news/technology/rss.xml"],
  politics: ["https://feeds.bbci.co.uk/news/politics/rss.xml"],
  military: ["https://feeds.bbci.co.uk/news/world/rss.xml"],
  medical: ["https://feeds.bbci.co.uk/news/health/rss.xml"],
  biology: ["https://export.arxiv.org/rss/q-bio"],
  environment: ["https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"]
}

export const MAX_ITEMS_PER_FEED = 25
