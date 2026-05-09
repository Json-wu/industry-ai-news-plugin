import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import { hmacSha256Hex } from "../_shared/hmac-user.ts"
import {
  MAX_DIGEST_ITEMS,
  MAX_ITEMS_PER_FEED,
  RSS_FEEDS
} from "../_shared/rss-config.ts"
import { type DigestItem, parseFeedItems } from "../_shared/rss-parse.ts"
import { canonicalUrlForSummaryCache } from "../_shared/url-cache-key.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret"
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function minIntervalMs(reminderMode: string): number {
  if (reminderMode === "twiceDaily") {
    return 10 * 60 * 60 * 1000
  }
  if (reminderMode === "every2h") {
    return 4 * 60 * 60 * 1000
  }
  return 6 * 60 * 60 * 1000
}

function validDigestEmail(s: string): boolean {
  const t = s.trim()
  return t.length > 3 && t.includes("@") && !t.includes(" ")
}

function buildSummaryByCanonFromCache(
  cacheRows: Array<{ url: string; summary: string; locale: string }>,
  canonSet: string[]
): Map<string, string> {
  const byUrl = new Map<string, Array<{ summary: string; locale: string }>>()
  for (const r of cacheRows) {
    const sum = typeof r.summary === "string" ? r.summary.trim() : ""
    if (!r.url || !sum) {
      continue
    }
    const loc = typeof r.locale === "string" ? r.locale : ""
    const list = byUrl.get(r.url) ?? []
    list.push({ summary: r.summary, locale: loc })
    byUrl.set(r.url, list)
  }
  const raw = Deno.env.get("EMAIL_DIGEST_SUMMARY_LOCALE_PRIORITY") ?? "zh,en"
  const priority = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const out = new Map<string, string>()
  for (const url of canonSet) {
    const list = byUrl.get(url)
    if (!list?.length) {
      continue
    }
    let chosen: string | undefined
    for (const loc of priority) {
      const hit = list.find((x) => x.locale === loc && x.summary.trim())
      if (hit) {
        chosen = hit.summary.trim()
        break
      }
    }
    if (!chosen) {
      const first = list.find((x) => x.summary.trim())
      if (first) {
        chosen = first.summary.trim()
      }
    }
    if (chosen) {
      out.set(url, chosen)
    }
  }
  return out
}

async function fetchXml(url: string, ms: number): Promise<string> {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*"
      }
    })
    if (!r.ok) {
      throw new Error(`HTTP ${r.status}`)
    }
    return await r.text()
  } finally {
    clearTimeout(id)
  }
}

async function collectDigestForIndustries(
  industryIds: string[]
): Promise<DigestItem[]> {
  const all: DigestItem[] = []
  for (const ind of industryIds) {
    const urls = RSS_FEEDS[ind]
    if (!urls) {
      continue
    }
    for (const feedUrl of urls) {
      try {
        const xml = await fetchXml(feedUrl, 18_000)
        const items = parseFeedItems(xml, feedUrl).slice(0, MAX_ITEMS_PER_FEED)
        all.push(...items)
      } catch (e) {
        console.warn("[email-digest] feed failed", feedUrl, e)
      }
    }
  }
  const seen = new Set<string>()
  const dedup: DigestItem[] = []
  for (const it of all) {
    if (seen.has(it.url)) {
      continue
    }
    seen.add(it.url)
    dedup.push(it)
  }
  dedup.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
  return dedup.slice(0, MAX_DIGEST_ITEMS)
}

function cachedSummaryForItem(
  it: DigestItem,
  summaryByCanon: Map<string, string>
): string | undefined {
  const canon = canonicalUrlForSummaryCache(it.url)
  const s = summaryByCanon.get(canon)?.trim()
  return s && s.length > 0 ? s : undefined
}

function buildHtmlDigest(
  items: DigestItem[],
  summaryByCanon: Map<string, string>,
  unsubHtml?: string
): string {
  const intro = `本期最多包含 <strong>${MAX_DIGEST_ITEMS}</strong> 条最新资讯（按发布时间从新到旧）。若某条曾在扩展侧栏打开并已生成 AI 摘要，我们会从云端缓存读取并显示在标题下方；尚未生成摘要的条目仅展示标题与链接。`
  const rows = items
    .map((it) => {
      const sum = cachedSummaryForItem(it, summaryByCanon)
      const sumBlock = sum
        ? `<p style="margin:0.4em 0 0;line-height:1.45;color:#334155;font-size:13px;">${escHtml(sum)}</p>`
        : ""
      return `<li style="margin:0.85em 0;"><a style="color:#0284c7;font-weight:600;text-decoration:none;" href="${escHtml(it.url)}">${escHtml(it.title)}</a>${sumBlock}<span style="display:block;color:#64748b;font-size:12px;margin-top:0.45em;">${escHtml(it.source)} · ${escHtml(it.publishedAt || "—")}</span></li>`
    })
    .join("\n")
  const foot = unsubHtml
    ? `<p style="color:#94a3b8;font-size:12px;margin-top:2em;">${unsubHtml}</p>`
    : `<p style="color:#94a3b8;font-size:12px;margin-top:2em;">若不想再收，可在扩展「设置」中关闭「订阅邮件简报」。</p>`
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/></head><body style="font-family:system-ui,sans-serif;line-height:1.55;color:#0f172a;">
<h1 style="font-size:18px;margin-bottom:0.5em;">Industry AI News · 行业简报</h1>
<p style="color:#475569;font-size:14px;margin:0 0 1em;line-height:1.6;">${intro}</p>
<ol style="padding-left:1.15em;margin:0;">${rows}</ol>
${foot}
</body></html>`
}

function buildPlainDigest(
  items: DigestItem[],
  summaryByCanon: Map<string, string>,
  unsubText?: string
): string {
  const header =
    "Industry AI News · 行业简报\n\n" +
    `本期最多 ${MAX_DIGEST_ITEMS} 条最新资讯（从新到旧）。若某条曾在扩展侧栏生成过 AI 摘要，标题下会显示摘要；否则仅有标题与链接。\n`
  const lines = items.map((it) => {
    const sum = cachedSummaryForItem(it, summaryByCanon)
    const meta = `${it.source} · ${it.publishedAt || "—"}`
    const parts = [it.title]
    if (sum) {
      parts.push(`摘要：${sum}`)
    }
    parts.push(it.url, meta)
    return parts.join("\n")
  })
  const tail = unsubText
    ? `\n\n${unsubText}`
    : "\n\n若不想再收，请在扩展设置中关闭订阅邮件简报。"
  return `${header}\n---\n\n${lines.join("\n\n---\n\n")}${tail}`
}

async function sendResend(params: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
  text: string
}): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text
    })
  })
  const body = await r.text()
  if (!r.ok) {
    return { ok: false, status: r.status, body }
  }
  return { ok: true }
}

type PrefsRow = {
  user_id: string
  industry_ids: string[]
  is_pro: boolean
  reminder_mode: string
  reminder_email: string
  news_mock_only: boolean
  last_email_digest_at: string | null
  email_digest_opt_out: boolean
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405)
  }

  const cronSecret = Deno.env.get("EMAIL_DIGEST_CRON_SECRET") ?? ""
  const headerSecret =
    req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret") ?? ""
  if (!cronSecret || headerSecret !== cronSecret) {
    return json({ error: "unauthorized" }, 401)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY") ??
    ""
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? ""
  const emailFrom =
    Deno.env.get("EMAIL_FROM") ?? "Industry AI News <onboarding@resend.dev>"

  if (!serviceKey) {
    return json(
      {
        error:
          "Set Edge secret SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY): Project Settings → API → service_role"
      },
      500
    )
  }
  if (!resendKey) {
    return json(
      { error: "Set Edge secret RESEND_API_KEY (https://resend.com)" },
      500
    )
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: rows, error: qErr } = await admin
    .from("user_extension_preferences")
    .select(
      "user_id,industry_ids,is_pro,reminder_mode,reminder_email,news_mock_only,last_email_digest_at,email_digest_opt_out"
    )
    .eq("is_pro", true)
    .neq("reminder_mode", "dnd")
    .eq("news_mock_only", false)
    .eq("email_digest_opt_out", false)

  if (qErr) {
    console.error("[email-digest] query", qErr)
    return json({ error: qErr.message }, 500)
  }

  const list = (rows ?? []) as PrefsRow[]
  const now = Date.now()
  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of list) {
    const to = row.reminder_email?.trim() ?? ""
    if (!validDigestEmail(to)) {
      skipped += 1
      continue
    }
    const industries = (row.industry_ids ?? []).filter(
      (x): x is string => typeof x === "string" && x.length > 0
    )
    if (industries.length === 0) {
      skipped += 1
      continue
    }

    const last = row.last_email_digest_at
      ? new Date(row.last_email_digest_at).getTime()
      : 0
    if (last && now - last < minIntervalMs(row.reminder_mode)) {
      skipped += 1
      continue
    }

    let items: DigestItem[]
    try {
      items = await collectDigestForIndustries(industries)
    } catch (e) {
      errors.push(`${row.user_id}:collect:${String(e)}`)
      continue
    }
    if (items.length === 0) {
      skipped += 1
      continue
    }

    const canonSet = [
      ...new Set(items.map((it) => canonicalUrlForSummaryCache(it.url)))
    ].filter(Boolean)
    const { data: cacheRows } = await admin
      .from("article_summary_cache")
      .select("url,summary,locale")
      .in("url", canonSet)

    const summaryByCanon = buildSummaryByCanonFromCache(
      (cacheRows ?? []) as Array<{ url: string; summary: string; locale: string }>,
      canonSet
    )

    const unsubSecret = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET") ?? ""
    let unsubHtml: string | undefined
    let unsubText: string | undefined
    if (unsubSecret.length >= 8) {
      const sig = await hmacSha256Hex(unsubSecret, row.user_id)
      const base = supabaseUrl.replace(/\/$/, "")
      const u = `${base}/functions/v1/email-unsubscribe?uid=${encodeURIComponent(row.user_id)}&sig=${encodeURIComponent(sig)}`
      unsubHtml = `<a href="${escHtml(u)}" style="color:#64748b;">点击退订邮件简报</a>`
      unsubText = `退订邮件简报：${u}`
    }

    const html = buildHtmlDigest(items, summaryByCanon, unsubHtml)
    const text = buildPlainDigest(items, summaryByCanon, unsubText)
    const subject = `行业资讯简报 · ${new Date().toISOString().slice(0, 10)}（${items.length} 条）`
    const res = await sendResend({
      apiKey: resendKey,
      from: emailFrom,
      to,
      subject,
      html,
      text
    })
    if (!res.ok) {
      errors.push(`${row.user_id}:resend:${res.status}:${res.body.slice(0, 200)}`)
      continue
    }

    const iso = new Date().toISOString()
    const { error: upErr } = await admin
      .from("user_extension_preferences")
      .update({ last_email_digest_at: iso })
      .eq("user_id", row.user_id)
    if (upErr) {
      errors.push(`${row.user_id}:update:${upErr.message}`)
    }
    sent += 1
  }

  return json({ sent, skipped, checked: list.length, errors })
})
