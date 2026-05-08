export type UiTheme = "light" | "dark"

export const DEFAULT_UI_THEME: UiTheme = "light"

export function parseUiTheme(v: unknown): UiTheme {
  if (v === "dark" || v === "light") {
    return v
  }
  return DEFAULT_UI_THEME
}

export function applyThemeToDocument(theme: UiTheme) {
  const root = document.documentElement
  if (theme === "dark") {
    root.classList.add("dark")
  } else {
    root.classList.remove("dark")
  }
}
