import { useEffect, useState } from "react"

import { syncExtensionPreferencesWithSupabase } from "./lib/extension-preferences-sync"
import { getSupabase, isSupabaseEnvConfigured } from "./lib/supabase"

import "./style.css"

/**
 * 邮件 Magic Link 登录回调页：与侧栏使用相同的 chrome.storage.local 存储会话。
 */
function Options() {
  const [line, setLine] = useState("正在处理登录信息…")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseEnvConfigured()) {
      setLine("未配置 Supabase 环境变量，请设置 PLASMO_PUBLIC_SUPABASE_URL 与 PLASMO_PUBLIC_SUPABASE_ANON_KEY 后重新构建。")
      return
    }
    const s = getSupabase()
    if (!s) {
      setLine("无法初始化 Supabase 客户端。")
      return
    }
    const {
      data: { subscription }
    } = s.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email) {
        setError(null)
        const mail = session.user.email
        setLine(`已登录：${mail}。可关闭本页并返回侧栏。`)
        void syncExtensionPreferencesWithSupabase(s).then((res) => {
          if (res && res.source !== "unchanged") {
            setLine(
              `已登录：${mail}。可关闭本页并返回侧栏。偏好已写入本机并与云端对齐。`
            )
          }
        })
        return
      }
      if (event === "INITIAL_SESSION") {
        if (session?.user?.email) {
          setError(null)
          const mail = session.user.email
          setLine(`已登录：${mail}。可关闭本页并返回侧栏。`)
          void syncExtensionPreferencesWithSupabase(s).then((res) => {
            if (res && res.source !== "unchanged") {
              setLine(
                `已登录：${mail}。可关闭本页并返回侧栏。偏好已写入本机并与云端对齐。`
              )
            }
          })
        } else {
          setLine("未识别到有效会话。若你刚刚点击了邮件中的链接，请重试；否则请从侧栏重新发送登录邮件。")
        }
      }
    })

    void s.auth
      .getSession()
      .then(({ data, error: e }) => {
        if (e) {
          setError(e.message)
          setLine("读取会话时出错。")
        } else if (data.session?.user?.email) {
          const mail = data.session.user.email
          setLine(`已登录：${mail}。可关闭本页并返回侧栏。`)
          void syncExtensionPreferencesWithSupabase(s).then((res) => {
            if (res && res.source !== "unchanged") {
              setLine(
                `已登录：${mail}。可关闭本页并返回侧栏。偏好已写入本机并与云端对齐。`
              )
            }
          })
        }
      })
      .catch((err: unknown) => {
        setError(String(err))
        setLine("读取会话时出错。")
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div className="min-h-0 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <h1 className="mb-2 text-base font-semibold">Industry AI News</h1>
      <p className="text-slate-700 dark:text-slate-300">{line}</p>
      {error ? <p className="mt-2 text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  )
}

export default Options
