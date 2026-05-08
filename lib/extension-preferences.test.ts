import { describe, expect, it } from "vitest"

import { isRemoteNewerThanLocalWrite } from "./extension-preferences"

describe("isRemoteNewerThanLocalWrite", () => {
  it("treats missing local as epoch 0", () => {
    expect(isRemoteNewerThanLocalWrite("2020-01-01T00:00:00.000Z", undefined)).toBe(
      true
    )
  })

  it("prefers remote when strictly newer", () => {
    expect(
      isRemoteNewerThanLocalWrite(
        "2024-02-01T12:00:00.000Z",
        "2024-02-01T11:00:00.000Z"
      )
    ).toBe(true)
  })

  it("does not prefer remote when equal or older", () => {
    expect(
      isRemoteNewerThanLocalWrite(
        "2024-02-01T12:00:00.000Z",
        "2024-02-01T12:00:00.000Z"
      )
    ).toBe(false)
    expect(
      isRemoteNewerThanLocalWrite(
        "2024-02-01T11:00:00.000Z",
        "2024-02-01T12:00:00.000Z"
      )
    ).toBe(false)
  })
})
