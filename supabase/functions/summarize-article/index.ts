import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

type InItem = { url?: string; title?: string; hint?: string }

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
}

/** DeepSeek 官方 OpenAI 兼容端点；也可用 DEEPSEEK_API_BASE 覆盖。 */
const DEFAULT_DEEPSEEK_BASE = "https://api.deepseek.com"

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  })
}

/** OpenAI / DeepSeek chat.completions 响应里的 assistant 文本 */
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
  const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY") ?? ""

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
  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    return json({ error: "unauthorized" }, 401)
  }

  let body: { items?: InItem[] }
  try {
    body = (await req.json()) as { items?: InItem[] }
  } catch {
    return json({ error: "invalid json" }, 400)
  }

  const items = body.items
  if (!Array.isArray(items) || items.length === 0 || items.length > 12) {
    return json({ error: "items must be a non-empty array (max 12)" }, 400)
  }

  const cleaned: { url: string; title: string; hint: string }[] = []
  for (const it of items) {
    const url = typeof it.url === "string" ? it.url.trim() : ""
    const title = typeof it.title === "string" ? it.title.trim() : ""
    const hint = typeof it.hint === "string" ? it.hint.trim() : ""
    if (!url || !title) {
      continue
    }
    cleaned.push({
      url,
      title: title.slice(0, 400),
      hint: hint.slice(0, 500)
    })
  }
  if (cleaned.length === 0) {
    return json({ error: "no valid items" }, 400)
  }

  const userPayload = JSON.stringify(cleaned, null, 0)
  const prompt =
    `你是中文新闻编辑。根据下列 JSON 数组中的每条新闻的 url、title、hint（RSS 摘要或描述），` +
    `为每条写一句不超过 80 个汉字的中文要点，语气客观、信息密度高。\n` +
    `只输出一个 JSON 数组，不要其它说明或 Markdown。数组元素形如 {"url":"与输入完全一致","summary":"..."}，` +
    `顺序与输入一致，且 url 必须与输入逐字相同。\n\n输入：\n${userPayload}`

  const apiBase = (
    Deno.env.get("DEEPSEEK_API_BASE") ?? DEFAULT_DEEPSEEK_BASE
  ).replace(/\/$/, "")
  const model = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat"
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
        {
          role: "system",
          content:
            "你只输出合法 JSON 数组，元素为对象含 url 与 summary 字符串，无其它文字。"
        },
        { role: "user", content: prompt }
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

  let summaries: Array<{ url: string; summary: string }>
  try {
    summaries = parseSummariesFromModel(rawText)
  } catch (e) {
    console.error("[summarize-article] parse", e, rawText.slice(0, 500))
    return json({ error: "invalid model json" }, 502)
  }

  return json({ summaries })
})
