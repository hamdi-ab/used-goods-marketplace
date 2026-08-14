import { describe, it, expect } from "vitest"

import { BROWSE_LIMIT_MAX, PAGE_SIZE } from "@/lib/listings/constants"
import { MAX_PAGING_OFFSET, nextOffset, parseOffset } from "@/lib/pagination"

describe("pagination.parseOffset", () => {
  it("defaults to 0 when absent", () => {
    expect(parseOffset(undefined)).toBe(0)
    expect(parseOffset("")).toBe(0)
  })

  it("keeps a valid offset", () => {
    expect(parseOffset("24")).toBe(24)
  })

  it("clamps a huge offset to the top of the 1000-row window", () => {
    expect(parseOffset("99999")).toBe(MAX_PAGING_OFFSET)
  })

  it("rejects a negative or non-numeric offset", () => {
    expect(parseOffset("-3")).toBe(0)
    expect(parseOffset("abc")).toBe(0)
  })

  it("guarantees a page never crosses the 1000-row ceiling", () => {
    expect(MAX_PAGING_OFFSET + PAGE_SIZE).toBe(BROWSE_LIMIT_MAX)
  })
})

describe("pagination.nextOffset", () => {
  it("advances by one page", () => {
    expect(nextOffset(0)).toBe(PAGE_SIZE)
    expect(nextOffset(PAGE_SIZE)).toBe(PAGE_SIZE * 2)
  })
})
