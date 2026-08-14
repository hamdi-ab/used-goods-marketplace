import { describe, it, expect } from "vitest"

import {
  buildLoginUrl,
  toggleFavoriteState,
} from "@/lib/favorites/constants"

describe("favorites.toggleFavoriteState", () => {
  it("flips a false favorite to true", () => {
    expect(toggleFavoriteState(false)).toBe(true)
  })

  it("flips a true favorite to false", () => {
    expect(toggleFavoriteState(true)).toBe(false)
  })
})

describe("favorites.buildLoginUrl", () => {
  it("builds the login URL with the current path as next", () => {
    expect(buildLoginUrl("/listings/abc-123")).toBe(
      "/login?next=%2Flistings%2Fabc-123"
    )
  })

  it("encodes a query string inside the next param", () => {
    expect(buildLoginUrl("/?category=books&offset=12")).toContain(
      "next=%2F%3Fcategory%3Dbooks%26offset%3D12"
    )
  })
})
