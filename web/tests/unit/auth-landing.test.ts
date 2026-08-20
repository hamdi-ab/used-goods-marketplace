import { describe, it, expect } from "vitest"

import {
  resolveLoginDestination,
  isAdminReadablePath,
} from "@/lib/auth/landing"

describe("auth.resolveLoginDestination", () => {
  describe("admin", () => {
    it("lands on /admin when there is no next target", () => {
      expect(resolveLoginDestination("admin", undefined)).toBe("/admin")
    })

    it("lands on /admin when next is a trader destination", () => {
      for (const trader of [
        "/sell",
        "/offers",
        "/offers/seller",
        "/favorites",
        "/listings/11111111-1111-4111-8111-111111111111/edit",
      ]) {
        expect(resolveLoginDestination("admin", trader)).toBe("/admin")
      }
    })

    it("honors a read-safe next target", () => {
      for (const readable of [
        "/",
        "/search",
        "/listings/11111111-1111-4111-8111-111111111111",
        "/users/11111111-1111-4111-8111-111111111111",
        "/dashboard",
        "/profile",
        "/about",
        "/help",
        "/safety",
        "/terms",
        "/privacy",
        "/contact",
        "/admin",
        "/admin/users",
        "/admin/listings",
        "/admin/reports",
        "/admin/statistics",
      ]) {
        expect(resolveLoginDestination("admin", readable)).toBe(readable)
      }
    })

    it("honors a read-safe next target that carries a query string", () => {
      expect(resolveLoginDestination("admin", "/search?q=phone")).toBe(
        "/search?q=phone"
      )
      expect(
        resolveLoginDestination(
          "admin",
          "/listings/11111111-1111-4111-8111-111111111111?f=sold"
        )
      ).toBe("/listings/11111111-1111-4111-8111-111111111111?f=sold")
    })

    it("rejects a cross-origin next target", () => {
      expect(resolveLoginDestination("admin", "https://evil.example/x")).toBe(
        "/admin"
      )
    })
  })

  describe("buyer and seller", () => {
    it("honors any internal next target", () => {
      expect(
        resolveLoginDestination("buyer", "/listings/11111111-1111-4111-8111-111111111111")
      ).toBe("/listings/11111111-1111-4111-8111-111111111111")
      expect(resolveLoginDestination("seller", "/sell")).toBe("/sell")
    })

    it("lands on / when there is no next target", () => {
      expect(resolveLoginDestination("buyer", undefined)).toBe("/")
      expect(resolveLoginDestination("seller", undefined)).toBe("/")
    })

    it("lands on / when next is a cross-origin target", () => {
      expect(resolveLoginDestination("buyer", "https://evil.example/x")).toBe("/")
    })
  })
})

describe("auth.isAdminReadablePath", () => {
  it("accepts public read surfaces, account pages, and admin pages", () => {
    expect(isAdminReadablePath("/")).toBe(true)
    expect(isAdminReadablePath("/search")).toBe(true)
    expect(isAdminReadablePath("/search?q=phone")).toBe(true)
    expect(isAdminReadablePath("/listings/11111111-1111-4111-8111-111111111111")).toBe(true)
    expect(isAdminReadablePath("/users/11111111-1111-4111-8111-111111111111")).toBe(true)
    expect(isAdminReadablePath("/dashboard")).toBe(true)
    expect(isAdminReadablePath("/profile")).toBe(true)
    expect(isAdminReadablePath("/about")).toBe(true)
    expect(isAdminReadablePath("/admin/reports")).toBe(true)
  })

  it("rejects trader pages and listing edit", () => {
    expect(isAdminReadablePath("/sell")).toBe(false)
    expect(isAdminReadablePath("/offers")).toBe(false)
    expect(isAdminReadablePath("/offers/seller")).toBe(false)
    expect(isAdminReadablePath("/favorites")).toBe(false)
    expect(isAdminReadablePath("/listings/11111111-1111-4111-8111-111111111111/edit")).toBe(false)
  })
})
