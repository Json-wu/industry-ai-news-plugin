import { INDUSTRIES, type IndustryId } from "../lib/industries"

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
  return (
    <ul className="m-0 list-none space-y-0.5 p-0">
      {INDUSTRIES.map((row) => {
        const on = selected.includes(row.id)
        return (
          <li key={row.id}>
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
                  onToggle(row.id)
                }}
              />
              <span className="text-slate-800 dark:text-slate-200">{row.label}</span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
