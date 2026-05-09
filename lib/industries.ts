import { msg } from "./messages"
import type { UiLang } from "./ui-locale"

export type IndustryId =
  | "tech"
  | "military"
  | "politics"
  | "medical"
  | "biology"
  | "environment"

export const INDUSTRY_IDS: readonly IndustryId[] = [
  "tech",
  "military",
  "politics",
  "medical",
  "biology",
  "environment"
]

/** @deprecated 使用 INDUSTRY_IDS + industryLabel；保留兼容字段供旧代码迁移 */
export const INDUSTRIES: ReadonlyArray<{ id: IndustryId; label: string }> =
  INDUSTRY_IDS.map((id) => ({ id, label: msg("zh").industryLabel[id] }))

export function industryLabel(id: IndustryId, lang: UiLang): string {
  return msg(lang).industryLabel[id]
}

export function isIndustryId(s: string): s is IndustryId {
  return INDUSTRY_IDS.includes(s as IndustryId)
}
