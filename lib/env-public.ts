type MetaEnv = Record<string, string | boolean | undefined> | undefined

function readFromImportMetaUrl(): string | undefined {
  if (typeof import.meta === "undefined") {
    return undefined
  }
  const env = (import.meta as { env?: MetaEnv }).env
  if (!env) {
    return undefined
  }
  // Plasmo/Parcel only inlines `import.meta.env.<EXACT_KEY>` at build time — not `env[dynamicKey]`.
  const v = env.PLASMO_PUBLIC_SUPABASE_URL
  if (typeof v === "string" && v.length > 0) {
    return v
  }
  return undefined
}

function readFromImportMetaAnonKey(): string | undefined {
  if (typeof import.meta === "undefined") {
    return undefined
  }
  const env = (import.meta as { env?: MetaEnv }).env
  if (!env) {
    return undefined
  }
  const v = env.PLASMO_PUBLIC_SUPABASE_ANON_KEY
  if (typeof v === "string" && v.length > 0) {
    return v
  }
  return undefined
}

function readUrl(): string | undefined {
  const fromMeta = readFromImportMetaUrl()
  if (fromMeta) {
    return fromMeta
  }
  if (typeof process !== "undefined" && process.env) {
    const v = process.env.PLASMO_PUBLIC_SUPABASE_URL
    if (typeof v === "string" && v.length > 0) {
      return v
    }
  }
  return undefined
}

function readAnonKey(): string | undefined {
  const fromMeta = readFromImportMetaAnonKey()
  if (fromMeta) {
    return fromMeta
  }
  if (typeof process !== "undefined" && process.env) {
    const v = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY
    if (typeof v === "string" && v.length > 0) {
      return v
    }
  }
  return undefined
}

export function getSupabaseUrl(): string | undefined {
  const u = readUrl()
  if (u && /^https:\/\//i.test(u)) {
    return u.replace(/\/$/, "")
  }
  return undefined
}

export function getSupabaseAnonKey(): string | undefined {
  const k = readAnonKey()
  if (k && k.length > 20) {
    return k
  }
  return undefined
}

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}
