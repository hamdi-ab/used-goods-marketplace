import { describe, it, expect } from "vitest"

describe("activity tabs contract", () => {
  const buyerTabs = ["offers", "favorites", "dashboard"]
  const sellerTabs = ["offers", "listings", "dashboard"]

  it("resolves valid buyer tabs correctly", () => {
    const resolveTab = (role: string, requestedTab?: string) => {
      const validTabs = role === "seller" ? sellerTabs : buyerTabs
      return requestedTab && validTabs.includes(requestedTab) ? requestedTab : "offers"
    }

    expect(resolveTab("buyer", "offers")).toBe("offers")
    expect(resolveTab("buyer", "favorites")).toBe("favorites")
    expect(resolveTab("buyer", "dashboard")).toBe("dashboard")
    expect(resolveTab("buyer", "listings")).toBe("offers") // seller tab defaulted
    expect(resolveTab("buyer", "invalid")).toBe("offers")
  })

  it("resolves valid seller tabs correctly", () => {
    const resolveTab = (role: string, requestedTab?: string) => {
      const validTabs = role === "seller" ? sellerTabs : buyerTabs
      return requestedTab && validTabs.includes(requestedTab) ? requestedTab : "offers"
    }

    expect(resolveTab("seller", "offers")).toBe("offers")
    expect(resolveTab("seller", "listings")).toBe("listings")
    expect(resolveTab("seller", "dashboard")).toBe("dashboard")
    expect(resolveTab("seller", "favorites")).toBe("offers") // buyer tab defaulted
    expect(resolveTab("seller", "invalid")).toBe("offers")
  })
})
