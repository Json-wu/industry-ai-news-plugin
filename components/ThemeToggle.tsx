import { msg } from "../lib/messages"
import type { UiTheme } from "../lib/theme"

import { useUiLang } from "./UiLangContext"

type Props = {
  value: UiTheme
  onChange: (t: UiTheme) => void
}

export function ThemeToggle({ value, onChange }: Props) {
  const lang = useUiLang()
  const m = msg(lang)
  const isDark = value === "dark"
  return (
    <div
      className="flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-slate-100/80 p-0.5 dark:border-slate-600 dark:bg-slate-800/80"
      role="group"
      aria-label={m.themeGroup}>
      <button
        type="button"
        onClick={() => onChange("light")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
          !isDark
            ? "bg-white text-amber-500 shadow-sm dark:bg-slate-700"
            : "text-slate-500 dark:text-slate-400"
        }`}
        title={m.themeLight}
        aria-pressed={!isDark}
        aria-label={m.themeLight}>
        <SunIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("dark")}
        className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
          isDark
            ? "bg-slate-700 text-sky-300 shadow-sm dark:bg-slate-600"
            : "text-slate-500 dark:text-slate-400"
        }`}
        title={m.themeDark}
        aria-pressed={isDark}
        aria-label={m.themeDark}>
        <MoonIcon className="h-4 w-4" />
      </button>
    </div>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.59-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.334 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.59zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.59 1.59a.75.75 0 001.06 1.061l1.59-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.588a.75.75 0 00-1.061 1.06l1.59 1.591z" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a8.97 8.97 0 01-1.25 4.5.75.75 0 01-1.04.206 9.053 9.053 0 01-1.5-1.5.75.75 0 01-.1-.833 8.2 8.2 0 00-1.1-1.2 8.2 8.2 0 00-1.2-1.1.75.75 0 01-.164-.9 9.04 9.04 0 012.8-1.2 9.04 9.04 0 012.2-.1zM12 2.25a.75.75 0 01.75.75c0 4.28 3.48 7.75 7.75 7.75a.75.75 0 010 1.5A9.25 9.25 0 012.25 12a.75.75 0 01.75-.75z"
        clipRule="evenodd"
      />
    </svg>
  )
}
