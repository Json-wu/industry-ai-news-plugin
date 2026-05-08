import { useCallback, useEffect, useState } from "react"

import { type IndustryId } from "../lib/industries"
import { type ReminderMode, REMINDER_OPTIONS } from "../lib/reminders"
import { applyIndustryToggle } from "../lib/selection"
import { FREE_INDUSTRY_LIMIT } from "../lib/tiers"

import { AccountPanel } from "./AccountPanel"
import { IndustryChecklist } from "./IndustryChecklist"

export type SettingsSnapshot = {
  industries: IndustryId[]
  isPro: boolean
  reminderMode: ReminderMode
  email: string
  /** 仅使用本地演示数据，不拉取 RSS */
  newsMockOnly: boolean
}

type Props = {
  open: boolean
  initial: SettingsSnapshot
  onClose: () => void
  onSave: (next: SettingsSnapshot) => void
  /** 登出并完成本地敏感字段清理后回调（例如刷新侧栏邮箱状态） */
  onAfterSignOut?: () => void
}

export function SettingsModal({
  open,
  initial,
  onClose,
  onSave,
  onAfterSignOut
}: Props) {
  const [draft, setDraft] = useState<SettingsSnapshot>(initial)

  useEffect(() => {
    if (open) {
      setDraft(initial)
    }
  }, [open, initial])

  const onToggle = useCallback(
    (id: IndustryId) => {
      setDraft((d) => ({
        ...d,
        industries: applyIndustryToggle(d.industries, id, d.isPro) as IndustryId[]
      }))
    },
    []
  )

  const save = useCallback(() => {
    let next = { ...draft }
    if (!next.isPro) {
      if (next.industries.length > FREE_INDUSTRY_LIMIT) {
        next = {
          ...next,
          industries: next.industries.slice(0, FREE_INDUSTRY_LIMIT)
        }
      }
      next = { ...next, email: "" }
    }
    onSave(next)
    onClose()
  }, [draft, onClose, onSave])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-2 dark:bg-black/50 sm:items-center">
      <div
        className="flex max-h-[min(92vh,640px)] w-full max-w-sm flex-col overflow-hidden rounded-t-xl bg-white shadow-xl dark:bg-slate-900 sm:max-w-md sm:rounded-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title">
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2
            id="settings-title"
            className="text-base font-semibold text-slate-900 dark:text-slate-100">
            设置
          </h2>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              关注行业
            </h3>
            <IndustryChecklist
              selected={draft.industries}
              onToggle={onToggle}
            />
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {!draft.isPro
                ? `免费版最多 ${FREE_INDUSTRY_LIMIT} 个；开启 Pro 不限。`
                : "Pro：行业数量不限。"}
            </p>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded"
                checked={draft.isPro}
                onChange={(e) => {
                  const p = e.target.checked
                  setDraft((d) => {
                    if (p) {
                      return { ...d, isPro: true }
                    }
                    const ind =
                      d.industries.length > FREE_INDUSTRY_LIMIT
                        ? (d.industries.slice(0, FREE_INDUSTRY_LIMIT) as IndustryId[])
                        : d.industries
                    return { ...d, isPro: false, industries: ind, email: "" }
                  })
                }}
              />
              Pro（演示开关：邮箱与不限行业）
            </label>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              资讯数据
            </h3>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded"
                checked={draft.newsMockOnly}
                onChange={(e) => {
                  setDraft((d) => ({
                    ...d,
                    newsMockOnly: e.target.checked
                  }))
                }}
              />
              <span>
                <span className="font-medium">仅使用本地演示数据</span>
                <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
                  开启后不请求网络 RSS，便于离线或调试。关闭后按设置中的行业拉取
                  <span className="whitespace-nowrap font-mono text-[10px] text-slate-600 dark:text-slate-300">
                    lib/rss-feeds
                  </span>{" "}
                  里配置的源。
                </span>
              </span>
            </label>
          </section>

          <AccountPanel
            open={open}
            onAfterSignOut={onAfterSignOut}
          />

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              提醒模式
            </h3>
            <div className="space-y-2">
              {REMINDER_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className="flex cursor-pointer gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50/60 dark:border-slate-600 dark:has-[:checked]:border-sky-500 dark:has-[:checked]:bg-sky-950/50">
                  <input
                    type="radio"
                    name="reminder"
                    className="mt-0.5"
                    checked={draft.reminderMode === opt.id}
                    onChange={() => {
                      setDraft((d) => ({ ...d, reminderMode: opt.id }))
                    }}
                  />
                  <span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {opt.label}
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                      {opt.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              接收邮箱
              <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                Pro
              </span>
            </h3>
            <input
              type="email"
              autoComplete="email"
              placeholder={draft.isPro ? "name@example.com" : "开启 Pro 后可填写"}
              disabled={!draft.isPro}
              value={draft.email}
              onChange={(e) => {
                setDraft((d) => ({ ...d, email: e.target.value }))
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900/80"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              开启 Pro 并填写邮箱后，可在服务端配置 Resend + 定时任务（见仓库{" "}
              <span className="font-mono text-[10px]">.github/workflows/email-digest.yml</span>
              ）按行业 RSS 发送简报；发信频率受云端限流（与提醒模式相关）。
            </p>
          </section>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
          <button
            type="button"
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-medium text-white hover:bg-sky-700 dark:hover:bg-sky-500"
            onClick={save}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
