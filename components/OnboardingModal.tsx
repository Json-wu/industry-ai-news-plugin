import { useCallback, useState } from "react"

import { type IndustryId } from "../lib/industries"
import { msg } from "../lib/messages"
import { applyIndustryToggle } from "../lib/selection"
import { FREE_INDUSTRY_LIMIT } from "../lib/tiers"

import { IndustryChecklist } from "./IndustryChecklist"
import { useUiLang } from "./UiLangContext"

type Props = {
  /** first run: free tier until Pro set in settings */
  isPro: boolean
  onComplete: (industries: IndustryId[]) => void
}

export function OnboardingModal({ isPro, onComplete }: Props) {
  const lang = useUiLang()
  const m = msg(lang)
  const [selected, setSelected] = useState<IndustryId[]>([])
  const [err, setErr] = useState("")

  const onToggle = useCallback(
    (id: IndustryId) => {
      setErr("")
      setSelected((prev) =>
        applyIndustryToggle(prev, id, isPro) as IndustryId[]
      )
    },
    [isPro]
  )

  const submit = useCallback(() => {
    if (selected.length === 0) {
      setErr(m.onboardingPickOneError)
      return
    }
    if (!isPro && selected.length > FREE_INDUSTRY_LIMIT) {
      setErr(m.onboardingFreeCapError(FREE_INDUSTRY_LIMIT))
      return
    }
    onComplete(selected)
  }, [isPro, m, onComplete, selected])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-2 dark:bg-black/50 sm:items-center">
      <div
        className="flex max-h-[min(92vh,640px)] w-full max-w-sm flex-col overflow-hidden rounded-t-xl bg-white shadow-xl dark:bg-slate-900 sm:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title">
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2
            id="onboarding-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {m.onboardingTitle}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            {m.onboardingSubtitle}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          <IndustryChecklist selected={selected} onToggle={onToggle} />
        </div>
        {err ? (
          <p className="px-4 text-[12px] text-red-600 dark:text-red-400">{err}</p>
        ) : null}
        <div className="shrink-0 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-[0.99] dark:hover:bg-sky-500"
            onClick={submit}>
            {m.getStarted}
          </button>
        </div>
      </div>
    </div>
  )
}
