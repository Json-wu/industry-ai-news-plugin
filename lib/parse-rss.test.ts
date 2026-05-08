/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest"

import { parseRssXml } from "./parse-rss"

describe("parseRssXml", () => {
  it("parses RSS 2.0 sample", () => {
    const xml = `<?xml version="1.0"?>
    <rss><channel>
      <title>Test Channel</title>
      <item>
        <title>Hello &amp; World</title>
        <link>https://example.com/a</link>
        <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
        <description><![CDATA[<p>Summary here</p>]]></description>
      </item>
    </channel></rss>`
    const { channelTitle, items } = parseRssXml(xml)
    expect(channelTitle).toBe("Test Channel")
    expect(items).toHaveLength(1)
    expect(items[0].title).toContain("Hello")
    expect(items[0].url).toBe("https://example.com/a")
    expect(items[0].summary.length).toBeGreaterThan(0)
  })

  it("extracts media:thumbnail from RSS item", () => {
    const xml = `<?xml version="1.0"?>
    <rss xmlns:media="http://search.yahoo.com/mrss/">
    <channel><title>Test</title>
    <item>
      <title>T</title>
      <link>https://example.com/c</link>
      <pubDate>Mon, 01 Jan 2024 12:00:00 GMT</pubDate>
      <description>x</description>
      <media:thumbnail url="https://example.com/thumb.jpg" width="120" height="80"/>
    </item>
    </channel></rss>`
    const { items } = parseRssXml(xml)
    expect(items[0].imageUrl).toBe("https://example.com/thumb.jpg")
  })

  it("parses Atom sample", () => {
    const xml = `<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Atom Feed</title>
      <entry>
        <title>Atom Post</title>
        <link href="https://example.com/b"/>
        <updated>2024-02-02T10:00:00Z</updated>
        <summary>Short</summary>
      </entry>
    </feed>`
    const { channelTitle, items } = parseRssXml(xml)
    expect(channelTitle).toBe("Atom Feed")
    expect(items).toHaveLength(1)
    expect(items[0].url).toBe("https://example.com/b")
  })
})
