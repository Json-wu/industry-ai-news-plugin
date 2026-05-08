import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import {
  MAX_DIGEST_ITEMS,
  MAX_ITEMS_PER_FEED,
  RSS_FEEDS
} from "../_shared/rss-config.ts"
import { type DigestItem, parseFeedItems } from "../_shared/rss-parse.ts"

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

function buildHtmlDigest(items: DigestItem[]): string {
  const rows = items
    .map(
      (it) =>
        `<li style="margin:0.5em 0;"><a href="${escHtml(it.url)}">${escHtml(it.title)}</a><br/><span style="color:#64748b;font-size:12px;">${escHtml(it.source)} · ${escHtml(it.publishedAt || "—")}</span></li>`
    )
    .join("\n")
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;">
<h1 style="font-size:18px;">Industry AI News · 行业简报</h1>
<p style="color:#475569;font-size:14px;">以下为根据你在扩展中的<strong>关注行业</strong>拉取的公开 RSS 条目摘要列表。点击标题可阅读原文。</p>
<ol style="padding-left:1.2em;">${rows}</ol>
<p style="color:#94a3b8;font-size:12px;margin-top:2em;">本邮件由定时任务触发；若不想再收，请在扩展「设置」中关闭 Pro 接收邮箱或改为免打扰。</p>
</body></html>`
}

async function sendResend(params: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
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
      html: params.html
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
      "user_id,industry_ids,is_pro,reminder_mode,reminder_email,news_mock_only,last_email_digest_at"
    )
    .eq("is_pro", true)
    .neq("reminder_mode", "dnd")
    .eq("news_mock_only", false)

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

    const html = buildHtmlDigest(items)
    const subject = `行业资讯简报 · ${new Date().toISOString().slice(0, 10)}（${items.length} 条）`
    const res = await sendResend({
      apiKey: resendKey,
      from: emailFrom,
      to,
      subject,
      html
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
