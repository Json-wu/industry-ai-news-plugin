import { INDUSTRY_IDS, industryLabel, type IndustryId } from "../lib/industries"

import { useUiLang } from "./UiLangContext"

type Props = {
  selected: IndustryId[]
  onToggle: (id: IndustryId) => void
  disabled?: boolean
}

export function IndustryChecklist({
  selected,
  onToggle,
  disabled = false
}: Props) {
  const lang = useUiLang()
  return (
    <ul className="m-0 list-none space-y-0.5 p-0">
      {INDUSTRY_IDS.map((id) => {
        const on = selected.includes(id)
        return (
          <li key={id}>
            <label
              className={`flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm ${
                disabled
                  ? "opacity-50"
                  : "hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}>
              <input
                type="checkbox"
                className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500/30"
                checked={on}
                disabled={disabled}
                onChange={() => {
                  onToggle(id)
                }}
              />
              <span className="text-slate-800 dark:text-slate-200">
                {industryLabel(id, lang)}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
