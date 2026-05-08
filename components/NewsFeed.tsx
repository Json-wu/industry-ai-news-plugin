import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { imageUrlForBrief, type NewsBrief } from "../lib/briefs"
import { INDUSTRIES } from "../lib/industries"

const PAGE_SIZE = 5

type Props = {
  items: NewsBrief[]
  onOpenUrl: (url: string) => void
  /** 数据加载状态（阶段 A RSS） */
  loadState?: "idle" | "loading" | "ok" | "error"
  dataSource?: "live" | "mock"
  loadError?: string
  /** 设置中「仅使用本地演示数据」 */
  userChoseMockOnly?: boolean
}

function labelForIndustry(id: string): string {
  const row = INDUSTRIES.find((i) => i.id === id)
  return row?.label ?? id
}

function RowThumb({ url, backupLetter }: { url: string; backupLetter: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-medium text-slate-500 dark:bg-slate-600 dark:text-slate-300">
        {backupLetter}
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className="h-full w-full object-cover"
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  )
}

export function NewsFeed({
  items,
  onOpenUrl,
  loadState = "ok",
  dataSource = "live",
  loadError,
  userChoseMockOnly = false
}: Props) {
  const itemsKey = useMemo(() => items.map((i) => i.id).join(","), [items])
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(PAGE_SIZE, items.length)
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVisibleCount(Math.min(PAGE_SIZE, items.length))
  }, [itemsKey, items.length])

  const shown = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  )
  const hasMore = visibleCount < items.length

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length))
  }, [items.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }
    let ticking = false
    const onScroll = () => {
      if (ticking) {
        return
      }
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        const { scrollTop, clientHeight, scrollHeight } = el
        if (scrollTop + clientHeight >= scrollHeight - 56) {
          setVisibleCount((c) => {
            if (c >= items.length) {
              return c
            }
            return Math.min(c + PAGE_SIZE, items.length)
          })
        }
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => el.removeEventListener("scroll", onScroll)
  }, [items.length, itemsKey])

  if (loadState === "loading" && items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-16">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-sky-500 border-t-transparent dark:border-sky-400"
          aria-hidden
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          正在拉取资讯…
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            暂无符合已选行业的简报。
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            可在设置中调整关注行业。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-0 overflow-y-auto px-3 pb-3 pt-1">
        {loadError ? (
          <div
            className="mb-2 rounded-lg border border-amber-200/90 bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-100"
            role="status">
            {loadError}
          </div>
        ) : null}
        {dataSource === "mock" && loadState === "ok" ? (
          <p className="mb-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
            {userChoseMockOnly
              ? "已开启「仅使用本地演示数据」，未请求在线 RSS"
              : "当前为演示数据（在线源不可用或解析失败时回退）"}
          </p>
        ) : null}
        <h2 className="mb-3 font-serif text-lg font-bold tracking-wide text-red-600 dark:text-red-400">
          发现更多
        </h2>
        <ul className="m-0 list-none space-y-3.5 p-0">
          {shown.map((b) => {
            const thumb = imageUrlForBrief(b)
            return (
              <li key={b.id}>
                <button
                  type="button"
                  className="group flex w-full gap-3 rounded-xl border border-slate-100 bg-white/90 p-2.5 text-left shadow-sm transition hover:border-slate-200 hover:shadow dark:border-slate-700/80 dark:bg-slate-900/90 dark:hover:border-slate-600"
                  onClick={() => {
                    onOpenUrl(b.url)
                  }}>
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-600/80">
                    <RowThumb
                      url={thumb}
                      backupLetter={b.title.charAt(0) || "·"}
                    />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5 pr-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-red-600 dark:text-red-400">
                      {labelForIndustry(b.industry)}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900 group-hover:text-sky-800 dark:text-slate-100 dark:group-hover:text-sky-300">
                      {b.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {b.summary}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                      <span className="min-w-0 truncate">{b.source}</span>
                      <span className="shrink-0 tabular-nums">{b.publishedAt}</span>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {hasMore ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-2">
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              继续向下滑动以加载更多
            </p>
            <button
              type="button"
              onClick={loadMore}
              className="text-[12px] font-medium text-sky-600 underline-offset-2 hover:underline dark:text-sky-400">
              下一页
            </button>
          </div>
        ) : (
          <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
            — 已加载全部 —
          </p>
        )}
      </div>
    </div>
  )
}
