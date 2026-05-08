import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseAnonKey, getSupabaseUrl } from "./env-public"
import { supabaseChromeLocalStorage } from "./supabase-chrome-storage"

let supabase: SupabaseClient | null = null

export { isSupabaseEnvConfigured } from "./env-public"

export function getSupabase(): SupabaseClient | null {
  if (supabase) {
    return supabase
  }
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    return null
  }
  supabase = createClient(url, key, {
    auth: {
      storage: supabaseChromeLocalStorage,
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })
  return supabase
}

export function removeSupabaseSingleton() {
  supabase = null
}
