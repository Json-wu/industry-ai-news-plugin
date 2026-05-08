import { useCallback, useState } from "react"

import { type IndustryId } from "../lib/industries"
import { applyIndustryToggle } from "../lib/selection"
import { FREE_INDUSTRY_LIMIT } from "../lib/tiers"

import { IndustryChecklist } from "./IndustryChecklist"

type Props = {
  /** first run: free tier until Pro set in settings */
  isPro: boolean
  onComplete: (industries: IndustryId[]) => void
}

export function OnboardingModal({ isPro, onComplete }: Props) {
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
      setErr("请至少选择一个行业。")
      return
    }
    if (!isPro && selected.length > FREE_INDUSTRY_LIMIT) {
      setErr(`免费版最多选择 ${FREE_INDUSTRY_LIMIT} 个行业。`)
      return
    }
    onComplete(selected)
  }, [isPro, onComplete, selected])

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
            选择感兴趣的行业
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            我们将据此展示新闻简报；之后可在设置中随时修改。
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
            开始使用
          </button>
        </div>
      </div>
    </div>
  )
}
