type AuthStorage = {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}

/**
 * 使用 chrome.storage.local 持久化 Supabase 会话，供侧栏、options 等扩展页共享。
 */
export const supabaseChromeLocalStorage: AuthStorage = {
  getItem: (key) =>
    new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        resolve(null)
        return
      }
      void chrome.storage.local.get(key, (r) => {
        const v = r[key as keyof typeof r]
        resolve(typeof v === "string" ? v : null)
      })
    }),
  setItem: (key, value) =>
    new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        resolve()
        return
      }
      void chrome.storage.local.set({ [key]: value }, () => resolve())
    }),
  removeItem: (key) =>
    new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome?.storage?.local) {
        resolve()
        return
      }
      void chrome.storage.local.remove(key, () => resolve())
    })
}
