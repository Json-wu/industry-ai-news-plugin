import { formatDateYmd, stripHtml } from "./text"

export type ParsedFeedItem = {
  title: string
  url: string
  summary: string
  publishedAt: string
  /** RSS media:thumbnail、enclosure 等 */
  imageUrl?: string
}

export type ParsedFeed = {
  channelTitle: string
  items: ParsedFeedItem[]
}

function firstText(el: Element | null, ...tagNames: string[]): string {
  if (!el) {
    return ""
  }
  for (const t of tagNames) {
    const nodes = el.getElementsByTagName(t)
    if (nodes.length > 0) {
      const x = nodes[0]?.textContent?.trim()
      if (x) {
        return x
      }
    }
  }
  return ""
}

function linkFromItemRss(item: Element): string {
  const linkNodes = item.getElementsByTagName("link")
  if (linkNodes.length > 0) {
    const t = linkNodes[0]?.textContent?.trim()
    if (t) {
      return t
    }
  }
  return ""
}

function linkFromEntryAtom(entry: Element): string {
  const links = entry.getElementsByTagName("link")
  for (let i = 0; i < links.length; i++) {
    const L = links[i]
    const href = L.getAttribute("href")
    if (href) {
      return href
    }
    const t = L.textContent?.trim()
    if (t) {
      return t
    }
  }
  return ""
}

function parseDate(s: string): Date {
  const d = new Date(s)
  return d
}

export function findMediaUrlInElement(root: Element | null): string | undefined {
  if (!root) {
    return undefined
  }
  const all = root.getElementsByTagName("*")
  for (let i = 0; i < all.length; i++) {
    const node = all[i]
    const ln = (node.localName || "").toLowerCase()
    if (ln === "thumbnail") {
      const u = node.getAttribute("url")
      if (u && /^https?:/i.test(u)) {
        return u
      }
    }
    if (ln === "enclosure") {
      const u = node.getAttribute("url")
      const type = (node.getAttribute("type") || "").toLowerCase()
      if (
        u &&
        (type.startsWith("image/") || /\.(jpe?g|png|gif|webp)(\?|$)/i.test(u))
      ) {
        return u
      }
    }
  }
  return undefined
}

function pushItem(
  out: ParsedFeedItem[],
  title: string,
  url: string,
  rawSummary: string,
  dateStr: string,
  imageUrl?: string
) {
  const t = stripHtml(title)
  const u = url.trim()
  if (!t || !u) {
    return
  }
  const summary = stripHtml(rawSummary).slice(0, 400)
  const d = parseDate(dateStr || Date.now().toString())
  const item: ParsedFeedItem = {
    title: t.slice(0, 500),
    url: u,
    summary: summary || t,
    publishedAt: formatDateYmd(d)
  }
  if (imageUrl && /^https?:/i.test(imageUrl)) {
    item.imageUrl = imageUrl
  }
  out.push(item)
}

export function parseRssXml(xml: string): ParsedFeed {
  const doc = new DOMParser().parseFromString(xml, "text/xml")
  const pe = doc.querySelector("parsererror")
  if (pe) {
    return { channelTitle: "", items: [] }
  }

  const channel = doc.getElementsByTagName("channel")[0]
  if (channel) {
    const channelTitle =
      firstText(channel, "title") || "RSS"
    const items: ParsedFeedItem[] = []
    const itemEls = channel.getElementsByTagName("item")
    const n = itemEls.length
    for (let i = 0; i < n; i++) {
      const item = itemEls[i]
      const title = firstText(item, "title")
      const link = linkFromItemRss(item) || firstText(item, "guid")
      const pub =
        firstText(item, "pubDate") ||
        firstText(item, "dc:date") ||
        firstText(item, "updated") ||
        ""
      const desc =
        firstText(item, "description") ||
        firstText(item, "content:encoded") ||
        firstText(item, "summary") ||
        ""
      const thumb = findMediaUrlInElement(item)
      pushItem(items, title, link, desc, pub, thumb)
    }
    return { channelTitle, items }
  }

  const feed = doc.getElementsByTagName("feed")[0]
  if (feed) {
    const channelTitle = firstText(feed, "title") || "Atom"
    const items: ParsedFeedItem[] = []
    const entries = feed.getElementsByTagName("entry")
    const n = entries.length
    for (let i = 0; i < n; i++) {
      const entry = entries[i]
      const title = firstText(entry, "title")
      const link = linkFromEntryAtom(entry)
      const pub =
        firstText(entry, "updated") || firstText(entry, "published") || ""
      const desc =
        firstText(entry, "summary") || firstText(entry, "content") || ""
      const thumb = findMediaUrlInElement(entry)
      pushItem(items, title, link, desc, pub, thumb)
    }
    return { channelTitle, items }
  }

  return { channelTitle: "", items: [] }
}
