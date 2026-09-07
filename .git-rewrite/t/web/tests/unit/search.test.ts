import { describe, it, expect } from "vitest"

import { BROWSE_LIMIT_MAX, PAGE_SIZE } from "@/lib/listings/constants"
import { buildSearchUrl, nextOffset, parseSearchParams } from "@/lib/search"

describe("search.parseSearchParams", () => {
  it("returns fully-defaulted filters for empty params", () => {
    expect(parseSearchParams({})).toEqual({
      q: "",
      categorySlug: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      condition: undefined,
      city: "",
      sellerVerified: false,
      sort: "newest",
      offset: 0,
    })
  })

  it("parses the keyword and trims whitespace", () => {
    expect(parseSearchParams({ q: "  laptop  " }).q).toBe("laptop")
  })

  it("drops a keyword when it is an array", () => {
    expect(parseSearchParams({ q: ["a", "b"] }).q).toBe("")
  })

  it("parses a condition from the allow-list", () => {
    expect(parseSearchParams({ condition: "Brand New" }).condition).toBe(
      "Brand New"
    )
  })

  it("drops a condition that is not in the allow-list", () => {
    expect(parseSearchParams({ condition: "Mint" }).condition).toBeUndefined()
  })

  it("parses a valid sort", () => {
    expect(parseSearchParams({ sort: "price_asc" }).sort).toBe("price_asc")
  })

  it("falls back to newest for an unknown sort", () => {
    expect(parseSearchParams({ sort: "popular" }).sort).toBe("newest")
  })

  it("parses non-negative prices", () => {
    expect(parseSearchParams({ min: "100", max: "5000" })).toMatchObject({
      minPrice: 100,
      maxPrice: 5000,
    })
  })

  it("rejects negative and non-numeric prices", () => {
    expect(parseSearchParams({ min: "-5", max: "abc" })).toMatchObject({
      minPrice: undefined,
      maxPrice: undefined,
    })
  })

  it("clamps a huge offset to the top of the 1000-row window", () => {
    expect(parseSearchParams({ offset: "99999" }).offset).toBe(
      BROWSE_LIMIT_MAX - PAGE_SIZE
    )
  })

  it("keeps an offset that already fills the window", () => {
    expect(parseSearchParams({ offset: String(BROWSE_LIMIT_MAX - PAGE_SIZE) }).offset).toBe(
      BROWSE_LIMIT_MAX - PAGE_SIZE
    )
  })

  it("rejects a negative or non-numeric offset", () => {
    expect(parseSearchParams({ offset: "-3" }).offset).toBe(0)
    expect(parseSearchParams({ offset: "nope" }).offset).toBe(0)
  })

  it("parses the verified-seller facet (verified=1)", () => {
    expect(parseSearchParams({ verified: "1" }).sellerVerified).toBe(true)
    expect(parseSearchParams({ verified: "true" }).sellerVerified).toBe(true)
    expect(parseSearchParams({ verified: "0" }).sellerVerified).toBe(false)
    expect(parseSearchParams({ verified: "false" }).sellerVerified).toBe(false)
    expect(parseSearchParams({}).sellerVerified).toBe(false)
  })
})

describe("search.buildSearchUrl", () => {
  const base = {
    q: "",
    categorySlug: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    condition: undefined,
    city: "",
    sellerVerified: false,
    sort: "newest" as const,
    offset: 0,
  }

  it("returns bare /search when nothing is set", () => {
    expect(buildSearchUrl(base)).toBe("/search")
  })

  it("omits the default sort and zero offset", () => {
    expect(buildSearchUrl({ ...base, q: "phone" })).toBe("/search?q=phone")
  })

  it("includes every non-default param", () => {
    expect(
      buildSearchUrl({
        q: "table",
        categorySlug: "furniture",
        minPrice: 500,
        maxPrice: 5000,
        condition: "Lightly Used",
        city: "Bole",
        sellerVerified: true,
        sort: "price_desc",
        offset: PAGE_SIZE,
      })
    ).toBe(
      "/search?q=table&category=furniture&min=500&max=5000&condition=Lightly+Used&city=Bole&verified=1&sort=price_desc&offset=12"
    )
  })

  it("omits the verified facet when unset", () => {
    expect(
      buildSearchUrl({ ...base, q: "phone", sellerVerified: false })
    ).toBe("/search?q=phone")
  })
})

describe("search.nextOffset", () => {
  it("advances by one page", () => {
    expect(nextOffset(0)).toBe(PAGE_SIZE)
    expect(nextOffset(PAGE_SIZE)).toBe(PAGE_SIZE * 2)
  })
})
