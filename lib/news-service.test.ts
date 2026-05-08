import { describe, expect, it } from "vitest"

import { clearNewsCache, loadNewsForIndustries } from "./news-service"

describe("loadNewsForIndustries", () => {
  it("mockOnly 不发起 RSS，返回演示数据", async () => {
    clearNewsCache()
    const r = await loadNewsForIndustries(["tech"], { mockOnly: true })
    expect(r.source).toBe("mock")
    expect(r.error).toBeUndefined()
    expect(r.items.length).toBeGreaterThan(0)
    expect(r.items[0].dataSource).toBe("mock")
  })
})
