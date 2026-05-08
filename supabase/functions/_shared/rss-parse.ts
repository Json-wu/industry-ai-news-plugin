import { XMLParser } from "https://esm.sh/fast-xml-parser@4.3.6"

export type DigestItem = {
  title: string
  url: string
  publishedAt: string
  source: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_"
})

function toArr<T>(x: T | T[] | undefined | null): T[] {
  if (x === undefined || x === null) {
    return []
  }
  return Array.isArray(x) ? x : [x]
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function textFromMaybeObject(v: unknown): string {
  if (typeof v === "string") {
    return stripHtml(v)
  }
  if (v && typeof v === "object" && "#text" in (v as object)) {
    return stripHtml(String((v as Record<string, unknown>)["#text"]))
  }
  return ""
}

function firstAtomHref(entry: Record<string, unknown>): string {
  const links = toArr<Record<string, unknown>>(entry.link as never)
  for (const L of links) {
    const hrefAttr =
      typeof L?.["@_href"] === "string"
        ? (L["@_href"] as string)
        : typeof L?.href === "string"
          ? (L.href as string)
          : ""
    if (hrefAttr && /^https?:/i.test(hrefAttr)) {
      return hrefAttr
    }
    const t = textFromMaybeObject(L)
    if (t && /^https?:/i.test(t)) {
      return t.trim()
    }
  }
  const id = entry.id
  if (typeof id === "string" && /^https?:/i.test(id)) {
    return id.trim()
  }
  return ""
}

/** 从 RSS 2.0 / Atom 提取条目（够用 BBC + arXiv）。 */
export function parseFeedItems(
  xml: string,
  fallbackSource: string
): DigestItem[] {
  const root = parser.parse(xml) as Record<string, unknown>
  const out: DigestItem[] = []

  const rss = root.rss as Record<string, unknown> | undefined
  const channel = rss?.channel as Record<string, unknown> | undefined
  if (channel) {
    const channelTitle =
      typeof channel.title === "string"
        ? stripHtml(channel.title).slice(0, 80)
        : textFromMaybeObject(channel.title).slice(0, 80) || fallbackSource
    for (const raw of toArr<Record<string, unknown>>(channel.item as never)) {
      const title = textFromMaybeObject(raw.title).slice(0, 300)
      let url = ""
      if (typeof raw.link === "string") {
        url = raw.link.trim()
      } else {
        url = textFromMaybeObject(raw.link).trim()
      }
      const pub =
        typeof raw.pubDate === "string"
          ? raw.pubDate
          : typeof raw["dc:date"] === "string"
            ? (raw["dc:date"] as string)
            : ""
      if (title && url && /^https?:/i.test(url)) {
        out.push({
          title,
          url,
          publishedAt: pub.slice(0, 32),
          source: channelTitle || fallbackSource
        })
      }
    }
    return out
  }

  const feed = root.feed as Record<string, unknown> | undefined
  if (feed?.entry) {
    const feedTitle =
      typeof feed.title === "string"
        ? stripHtml(feed.title).slice(0, 80)
        : textFromMaybeObject(feed.title).slice(0, 80) || fallbackSource
    for (const entry of toArr<Record<string, unknown>>(feed.entry as never)) {
      const title = textFromMaybeObject(entry.title).slice(0, 300)
      const url = firstAtomHref(entry)
      let pub = ""
      if (typeof entry.updated === "string") {
        pub = entry.updated
      }
      if (typeof entry.published === "string") {
        pub = pub || entry.published
      }
      if (title && url) {
        out.push({
          title,
          url,
          publishedAt: pub.slice(0, 32),
          source: feedTitle || fallbackSource
        })
      }
    }
  }

  return out
}
