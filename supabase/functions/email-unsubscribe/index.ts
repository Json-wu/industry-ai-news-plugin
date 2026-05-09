import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

import { hmacSha256Hex } from "../_shared/hmac-user.ts"

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
}

function htmlPage(title: string, body: string): Response {
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="font-family:system-ui,sans-serif;padding:2rem;max-width:40rem;line-height:1.6;">${body}</body></html>`
  const bytes = new TextEncoder().encode(html)
  return new Response(bytes, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=UTF-8",
      "Content-Language": "zh-CN",
      "Cache-Control": "no-store"
    }
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "GET") {
    return htmlPage("405", "<p>Method not allowed.</p>")
  }

  const secret = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET") ?? ""
  const serviceKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
    Deno.env.get("SERVICE_ROLE_KEY") ??
    ""
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""

  if (!secret || !serviceKey) {
    return htmlPage(
      "未配置",
      "<p>服务器未配置退订密钥，请联系管理员。</p>"
    )
  }

  const url = new URL(req.url)
  const uid = url.searchParams.get("uid")?.trim() ?? ""
  const sig = url.searchParams.get("sig")?.trim() ?? ""

  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uid || !uuidRe.test(uid) || !sig) {
    return htmlPage("链接无效", "<p>退订链接无效或已损坏。</p>")
  }

  const expected = await hmacSha256Hex(secret, uid)
  if (sig.length !== expected.length || sig !== expected) {
    return htmlPage("验证失败", "<p>无法验证退订请求。</p>")
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { error } = await admin
    .from("user_extension_preferences")
    .update({
      email_digest_opt_out: true,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", uid)

  if (error) {
    console.error("[email-unsubscribe]", error)
    return htmlPage("错误", `<p>更新失败：${error.message}</p>`)
  }

  return htmlPage(
    "已退订",
    "<h1>已退订邮件简报</h1><p>将不再向你发送 Industry AI News 行业资讯邮件。若要重新订阅，请在扩展「设置」中开启订阅邮件简报。</p>"
  )
})
