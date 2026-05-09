import { createContext, useContext, type ReactNode } from "react"

import { detectUiLang, type UiLang } from "../lib/ui-locale"

const UiLangContext = createContext<UiLang>(detectUiLang())

export function UiLangProvider({ children }: { children: ReactNode }) {
  return (
    <UiLangContext.Provider value={detectUiLang()}>
      {children}
    </UiLangContext.Provider>
  )
}

export function useUiLang(): UiLang {
  return useContext(UiLangContext)
}
