export type IndustryId =
  | "tech"
  | "military"
  | "politics"
  | "medical"
  | "biology"
  | "environment"

export const INDUSTRIES: ReadonlyArray<{
  id: IndustryId
  label: string
}> = [
  { id: "tech", label: "科技" },
  { id: "military", label: "军事" },
  { id: "politics", label: "政治" },
  { id: "medical", label: "医疗" },
  { id: "biology", label: "生物" },
  { id: "environment", label: "环境" }
]

export function isIndustryId(s: string): s is IndustryId {
  return INDUSTRIES.some((i) => i.id === s)
}
