/**
 * Magic link / Email OTP 回跳：需在 Supabase Dashboard → Authentication → URL
 * configuration 的 Redirect URLs 中允许本 URL（含你的扩展 ID）。
 */
export function getOptionsAuthRedirectUrl(): string {
  if (typeof chrome === "undefined" || !chrome?.runtime?.id) {
    return ""
  }
  return `chrome-extension://${chrome.runtime.id}/options.html`
}
