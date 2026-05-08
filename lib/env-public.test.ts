import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("env-public", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("rejects non-https URL (must be https)", async () => {
    vi.stubEnv("PLASMO_PUBLIC_SUPABASE_URL", "http://example.com")
    vi.stubEnv("PLASMO_PUBLIC_SUPABASE_ANON_KEY", "a".repeat(25))
    const m = await import("./env-public")
    expect(m.getSupabaseUrl()).toBeUndefined()
  })

  it("normalizes https URL, accepts anon key, reports configured", async () => {
    vi.stubEnv("PLASMO_PUBLIC_SUPABASE_URL", "https://project.supabase.co/")
    vi.stubEnv("PLASMO_PUBLIC_SUPABASE_ANON_KEY", "a".repeat(25))
    const m = await import("./env-public")
    expect(m.getSupabaseUrl()).toBe("https://project.supabase.co")
    expect(m.getSupabaseAnonKey()).toBe("a".repeat(25))
    expect(m.isSupabaseEnvConfigured()).toBe(true)
  })
})
