/** 由 URL 生成稳定短 id（用于列表 key 与占位图 seed） */
export function idFromUrl(url: string): string {
  let h = 5381
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h + url.charCodeAt(i)) | 0
  }
  const hex = (h >>> 0).toString(16)
  return `u${hex}`
}
