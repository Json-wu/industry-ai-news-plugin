import type { UiTheme } from "../lib/theme"

import { ThemeToggle } from "./ThemeToggle"

type Props = {
  theme: UiTheme
  onThemeChange: (t: UiTheme) => void
  onOpenMenu: () => void
}

export function AppHeader({ theme, onThemeChange, onOpenMenu }: Props) {
  return (
    <header className="shrink-0 border-b border-slate-200/90 bg-white px-2.5 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          title="设置"
          aria-label="打开设置">
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Industry AI News
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">简报</p>
        </div>
        <div className="w-[72px] shrink-0 flex justify-end">
          <ThemeToggle value={theme} onChange={onThemeChange} />
        </div>
      </div>
    </header>
  )
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  )
}
