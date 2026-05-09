import { useEffect, useState } from "react"

import { UiLangProvider, useUiLang } from "./components/UiLangContext"
import { syncExtensionPreferencesWithSupabase } from "./lib/extension-preferences-sync"
import { msg } from "./lib/messages"
import { getSupabase, isSupabaseEnvConfigured } from "./lib/supabase"

import "./style.css"

/**
 * 邮件 Magic Link 登录回调页：与侧栏使用相同的 chrome.storage.local 存储会话。
 */
function OptionsInner() {
  const lang = useUiLang()
  const [line, setLine] = useState(() => msg(lang).optionsProcessing)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const m = msg(lang)
    if (!isSupabaseEnvConfigured()) {
      setLine(m.optionsEnvMissing)
      return
    }
    const s = getSupabase()
    if (!s) {
      setLine(m.optionsSupabaseInitFail)
      return
    }
    const {
      data: { subscription }
    } = s.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.email) {
        setError(null)
        const mail = session.user.email
        setLine(m.optionsSignedIn(mail))
        void syncExtensionPreferencesWithSupabase(s).then((res) => {
          if (res && res.source !== "unchanged") {
            setLine(m.optionsSignedInSynced(mail))
          }
        })
        return
      }
      if (event === "INITIAL_SESSION") {
        if (session?.user?.email) {
          setError(null)
          const mail = session.user.email
          setLine(m.optionsSignedIn(mail))
          void syncExtensionPreferencesWithSupabase(s).then((res) => {
            if (res && res.source !== "unchanged") {
              setLine(m.optionsSignedInSynced(mail))
            }
          })
        } else {
          setLine(m.optionsNoSession)
        }
      }
    })

    void s.auth
      .getSession()
      .then(({ data, error: e }) => {
        if (e) {
          setError(e.message)
          setLine(m.optionsSessionReadError)
        } else if (data.session?.user?.email) {
          const mail = data.session.user.email
          setLine(m.optionsSignedIn(mail))
          void syncExtensionPreferencesWithSupabase(s).then((res) => {
            if (res && res.source !== "unchanged") {
              setLine(m.optionsSignedInSynced(mail))
            }
          })
        }
      })
      .catch((err: unknown) => {
        setError(String(err))
        setLine(m.optionsSessionReadError)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [lang])

  return (
    <div className="min-h-0 p-4 text-sm text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <h1 className="mb-2 text-base font-semibold">Industry AI News</h1>
      <p className="text-slate-700 dark:text-slate-300">{line}</p>
      {error ? <p className="mt-2 text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  )
}

export default function Options() {
  return (
    <UiLangProvider>
      <OptionsInner />
    </UiLangProvider>
  )
}
