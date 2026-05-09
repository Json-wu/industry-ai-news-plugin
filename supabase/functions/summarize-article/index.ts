import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import {
  type SummaryLocaleKey,
  normalizeSummaryLocale
} from "../_shared/summary-locale.ts"
import { canonicalUrlForSummaryCache } from "../_shared/url-cache-key.ts"

type InItem = { url?: string; title?: string; hint?: string }

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
}

const DEFAULT_DEEPSEEK_BASE = "https://api.deepseek.com"

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10)
}

function extractChatCompletionText(data: unknown): string {
  const root = data as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const text = root.choices?.[0]?.message?.content
  return typeof text === "string" ? text : ""
}

function parseSummariesFromModel(text: string): Array<{ url: string; summary: string }> {
  let t = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t)
  if (fence) {
    t = fence[1].trim()
  }
  const parsed = JSON.parse(t) as unknown
  if (!Array.isArray(parsed)) {
    return []
  }
  const out: Array<{ url: string; summary: string }> = []
  for (const row of parsed) {
    if (!row || typeof row !== "object") {
      continue
    }
    const o = row as Record<string, unknown>
    const url = typeof o.url === "string" ? o.url : ""
    const summary = typeof o.summary === "string" ? o.summary.trim() : ""
    if (url && summary) {
      out.push({ url, summary })
    }
  }
  return out
}

type CleanItem = { url: string; title: string; hint: string; canon: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization") ?? ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY") ??
    ""
  const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY") ?? ""

  const ttlHours = Math.max(
    1,
    parseInt(Deno.env.get("SUMMARY_CACHE_TTL_HOURS") ?? "168", 10)
  )
  const dailyLimit = Math.max(
    1,
    parseInt(Deno.env.get("SUMMARY_DAILY_LLM_ITEMS_PER_USER") ?? "120", 10)
  )

  if (!serviceKey) {
    return json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY required for summary cache (Edge Secrets)"
      },
      500
    )
  }

  if (!deepseekKey) {
    return json(
      {
        error:
          "DEEPSEEK_API_KEY not set on project (Supabase Dashboard → Edge Functions → Secrets)"
      },
      500
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  const admin = createClient(supabaseUrl, serviceKey)

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return json({ error: "unauthorized" }, 401)
  }

  let body: { items?: InItem[]; locale?: string }
  try {
    body = (await req.json()) as { items?: InItem[]; locale?: string }
  } catch {
    return json({ error: "invalid json" }, 400)
  }

  const summaryLocale: SummaryLocaleKey = normalizeSummaryLocale(body.locale)

  const items = body.items
  if (!Array.isArray(items) || items.length === 0 || items.length > 12) {
    return json({ error: "items must be a non-empty array (max 12)" }, 400)
  }

  const cleaned: CleanItem[] = []
  for (const it of items) {
    const url = typeof it.url === "string" ? it.url.trim() : ""
    const title = typeof it.title === "string" ? it.title.trim() : ""
    const hint = typeof it.hint === "string" ? it.hint.trim() : ""
    if (!url || !title) {
      continue
    }
    const canon = canonicalUrlForSummaryCache(url)
    if (!canon) {
      continue
    }
    cleaned.push({
      url,
      title: title.slice(0, 400),
      hint: hint.slice(0, 500),
      canon
    })
  }
  if (cleaned.length === 0) {
    return json({ error: "no valid items" }, 400)
  }

  const model = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat"
  const ttlMs = ttlHours * 3600 * 1000
  const cutoff = Date.now() - ttlMs

  const canonUrls = [...new Set(cleaned.map((c) => c.canon))]
  const { data: cacheRows, error: cacheErr } = await admin
    .from("article_summary_cache")
    .select("url,summary,model,updated_at,locale")
    .in("url", canonUrls)
    .eq("locale", summaryLocale)

  if (cacheErr) {
    console.warn("[summarize-article] cache select", cacheErr.message)
  }

  const cacheMap = new Map<
    string,
    { summary: string; model: string; updated_at: string }
  >()
  for (const row of cacheRows ?? []) {
    const r = row as {
      url: string
      summary: string
      model: string
      updated_at: string
    }
    if (r.url && r.summary) {
      cacheMap.set(r.url, {
        summary: r.summary,
        model: r.model ?? "",
        updated_at: r.updated_at
      })
    }
  }

  const cachedSummaries = new Map<string, string>()
  const needLlm: CleanItem[] = []

  for (const c of cleaned) {
    const hit = cacheMap.get(c.canon)
    const fresh =
      hit &&
      hit.model === model &&
      new Date(hit.updated_at).getTime() >= cutoff
    if (fresh && hit) {
      cachedSummaries.set(c.url, hit.summary)
    } else {
      needLlm.push(c)
    }
  }

  let toCall = needLlm
  const { data: usageRow } = await admin
    .from("user_llm_usage_daily")
    .select("summarize_calls")
    .eq("user_id", user.id)
    .eq("usage_day", utcDateString())
    .maybeSingle()

  const used = (usageRow as { summarize_calls?: number } | null)?.summarize_calls ?? 0
  const remaining = Math.max(0, dailyLimit - used)

  if (toCall.length > remaining) {
    toCall = toCall.slice(0, remaining)
  }

  const llmByUrl = new Map<string, string>()

  if (toCall.length > 0) {
    const userPayload = JSON.stringify(
      toCall.map((c) => ({
        url: c.url,
        title: c.title,
        hint: c.hint
      })),
      null,
      0
    )
    const { systemContent, userContent } =
      summaryLocale === "zh"
        ? {
            systemContent:
              "你只输出合法 JSON 数组，元素为对象含 url 与 summary 字符串，无其它文字。",
            userContent:
              `你是中文新闻编辑。根据下列 JSON 数组中的每条新闻的 url、title、hint（RSS 摘要或描述），` +
              `为每条写一句不超过 80 个汉字的中文要点，语气客观、信息密度高。\n` +
              `只输出一个 JSON 数组，不要其它说明或 Markdown。数组元素形如 {"url":"与输入完全一致","summary":"..."}，` +
              `顺序与输入一致，且 url 必须与输入逐字相同。\n\n输入：\n${userPayload}`
          }
        : {
            systemContent:
              "Output only a valid JSON array of objects with url and summary string fields. No other text.",
            userContent:
              `You are a concise news editor. For each item in the JSON array (fields url, title, hint — hint may be RSS description), ` +
              `write one objective one-line summary in English, at most about 120 characters, informative tone.\n` +
              `Output only one JSON array; no Markdown fences or explanation. Each element: {"url":"exact match from input","summary":"..."}, ` +
              `same order as input; url must match character-for-character.\n\nInput:\n${userPayload}`
          }

    const apiBase = (
      Deno.env.get("DEEPSEEK_API_BASE") ?? DEFAULT_DEEPSEEK_BASE
    ).replace(/\/$/, "")
    const chatUrl = `${apiBase}/chat/completions`

    const llmRes = await fetch(chatUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: userContent }
        ],
        temperature: 0.35,
        max_tokens: 2048
      })
    })

    if (!llmRes.ok) {
      const errText = await llmRes.text()
      console.error("[summarize-article] DeepSeek HTTP", llmRes.status, errText)
      return json({ error: "llm request failed" }, 502)
    }

    const llmJson: unknown = await llmRes.json()
    const rawText = extractChatCompletionText(llmJson)
    if (!rawText) {
      return json({ error: "empty model output" }, 502)
    }

    let parsed: Array<{ url: string; summary: string }>
    try {
      parsed = parseSummariesFromModel(rawText)
    } catch (e) {
      console.error("[summarize-article] parse", e, rawText.slice(0, 500))
      return json({ error: "invalid model json" }, 502)
    }

    const nowIso = new Date().toISOString()
    for (const row of parsed) {
      llmByUrl.set(row.url, row.summary)
      const canon = canonicalUrlForSummaryCache(row.url)
      if (canon) {
        const { error: upErr } = await admin.from("article_summary_cache").upsert(
          {
            url: canon,
            locale: summaryLocale,
            summary: row.summary,
            model,
            updated_at: nowIso
          },
          { onConflict: "url,locale" }
        )
        if (upErr) {
          console.warn("[summarize-article] cache upsert", upErr.message)
        }
      }
    }

    const delta = toCall.length
    const day = utcDateString()
    const nextCount = used + delta
    const { error: usageErr } = await admin.from("user_llm_usage_daily").upsert(
      {
        user_id: user.id,
        usage_day: day,
        summarize_calls: nextCount
      },
      { onConflict: "user_id,usage_day" }
    )
    if (usageErr) {
      console.warn("[summarize-article] usage upsert", usageErr.message)
    }
  }

  const out: Array<{ url: string; summary: string }> = []
  for (const c of cleaned) {
    const summary =
      cachedSummaries.get(c.url) ?? llmByUrl.get(c.url) ?? c.hint
    out.push({ url: c.url, summary })
  }

  return json({ summaries: out })
})
