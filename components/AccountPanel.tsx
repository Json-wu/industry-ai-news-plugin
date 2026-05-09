import { useCallback, useEffect, useState } from "react"

import { getOptionsAuthRedirectUrl } from "../lib/auth-redirect"
import { clearSensitiveLocalPrefsAfterSignOut } from "../lib/extension-preferences-sync"
import { msg } from "../lib/messages"
import { getSupabase, isSupabaseEnvConfigured } from "../lib/supabase"

import { useUiLang } from "./UiLangContext"

type Props = {
  open: boolean
  onAfterSignOut?: () => void
}

export function AccountPanel({ open, onAfterSignOut }: Props) {
  const lang = useUiLang()
  const m = msg(lang)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [otpEmail, setOtpEmail] = useState("")
  const [otpStatus, setOtpStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [otpMessage, setOtpMessage] = useState<string | null>(null)

  const supabase = getSupabase()
  const configured = isSupabaseEnvConfigured() && supabase

  const refresh = useCallback(() => {
    if (!supabase) {
      setSessionEmail(null)
      setLoading(false)
      return
    }
    setLoading(true)
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setSessionEmail(null)
      } else {
        setSessionEmail(data.session?.user?.email ?? null)
      }
      setLoading(false)
    })
  }, [supabase])

  useEffect(() => {
    if (!open || !configured) {
      return
    }
    refresh()
  }, [open, configured, refresh])

  useEffect(() => {
    if (!supabase) {
      return
    }
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const sendOtp = useCallback(() => {
    if (!supabase) {
      return
    }
    const strings = msg(lang)
    const email = otpEmail.trim()
    if (!email) {
      setOtpMessage(strings.otpEnterEmail)
      setOtpStatus("error")
      return
    }
    setOtpStatus("sending")
    setOtpMessage(null)
    const redirect = getOptionsAuthRedirectUrl()
    void supabase.auth
      .signInWithOtp({
        email,
        options: redirect ? { emailRedirectTo: redirect } : undefined
      })
      .then(({ error }) => {
        if (error) {
          setOtpMessage(error.message)
          setOtpStatus("error")
        } else {
          setOtpMessage(strings.otpSentBlurb)
          setOtpStatus("sent")
        }
      })
  }, [supabase, otpEmail, lang])

  const signOut = useCallback(() => {
    if (!supabase) {
      return
    }
    void supabase.auth
      .signOut()
      .then(() => clearSensitiveLocalPrefsAfterSignOut())
      .then(() => {
        setSessionEmail(null)
        onAfterSignOut?.()
      })
      .catch(() => {
        setSessionEmail(null)
        onAfterSignOut?.()
      })
  }, [supabase, onAfterSignOut])

  const openOptionsPage = useCallback(() => {
    if (typeof chrome === "undefined" || !chrome?.runtime?.openOptionsPage) {
      return
    }
    void chrome.runtime.openOptionsPage()
  }, [])

  if (!configured) {
    return (
      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {m.accountSection}
        </h3>
        <p className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-300">
          {m.accountNotConfiguredBody}
        </p>
      </section>
    )
  }

  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {m.accountSection}
      </h3>
      {loading ? (
        <p className="text-[12px] text-slate-500 dark:text-slate-400">
          {m.accountLoadingSession}
        </p>
      ) : sessionEmail ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-800 dark:text-slate-100">
            {m.accountSignedInPrefix}{" "}
            <span className="font-mono text-[12px] text-sky-700 dark:text-sky-300">
              {sessionEmail}
            </span>
          </p>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            {m.signOut}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[12px] text-slate-600 dark:text-slate-300">
            {m.accountOtpIntro}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={otpEmail}
              onChange={(e) => {
                setOtpEmail(e.target.value)
                if (otpStatus === "error" || otpStatus === "sent") {
                  setOtpStatus("idle")
                  setOtpMessage(null)
                }
              }}
              className="w-full min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={sendOtp}
              disabled={otpStatus === "sending"}
              className="shrink-0 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60 dark:hover:bg-sky-500">
              {otpStatus === "sending" ? m.sending : m.sendMagicEmail}
            </button>
          </div>
          {otpMessage ? (
            <p
              className={`text-[11px] ${
                otpStatus === "error" ? "text-rose-600 dark:text-rose-400" : "text-slate-600 dark:text-slate-400"
              }`}>
              {otpMessage}
            </p>
          ) : null}
          <button
            type="button"
            onClick={openOptionsPage}
            className="text-left text-[11px] text-sky-600 underline decoration-sky-500/50 underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300">
            {m.accountOpenOptionsLink}
          </button>
        </div>
      )}
    </section>
  )
}
