import { describe, it, expect } from "vitest"

import { BROWSE_LIMIT_MAX, PAGE_SIZE } from "@/lib/listings"
import { parseBrowseParams, buildBrowseUrl, nextOffset } from "@/lib/browse"

describe("browse.parseBrowseParams", () => {
  it("defaults offset to 0 when absent", () => {
    expect(parseBrowseParams({})).toEqual({ categorySlug: undefined, offset: 0 })
  })

  it("clamps a huge offset to the 1000-row ceiling", () => {
    expect(parseBrowseParams({ offset: "99999" }).offset).toBe(BROWSE_LIMIT_MAX - 1)
  })

  it("rejects a negative offset", () => {
    expect(parseBrowseParams({ offset: "-5" }).offset).toBe(0)
  })

  it("rejects a non-numeric offset", () => {
    expect(parseBrowseParams({ offset: "abc" }).offset).toBe(0)
  })

  it("passes a simple category slug through", () => {
    expect(parseBrowseParams({ category: "electronics" }).categorySlug).toBe(
      "electronics"
    )
  })

  it("drops a category when it is an array", () => {
    expect(parseBrowseParams({ category: ["a", "b"] }).categorySlug).toBeUndefined()
  })
})

describe("browse.buildBrowseUrl", () => {
  it("omits offset when it is zero", () => {
    expect(buildBrowseUrl("books", 0)).toBe("/?category=books")
  })

  it("includes both params for a non-zero offset", () => {
    expect(buildBrowseUrl("books", 24)).toBe("/?category=books&offset=24")
  })

  it("omits the category when undefined", () => {
    expect(buildBrowseUrl(undefined, 24)).toBe("/?offset=24")
  })
})

describe("browse.nextOffset", () => {
  it("advances by one page", () => {
    expect(nextOffset(0)).toBe(PAGE_SIZE)
    expect(nextOffset(PAGE_SIZE)).toBe(PAGE_SIZE * 2)
  })
})
