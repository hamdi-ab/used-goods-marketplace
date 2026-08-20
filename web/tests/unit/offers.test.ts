import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { submitOfferRow } from "@/lib/offers"
import {
  buildLoginUrl,
  OFFER_AMOUNT_MAX,
  OFFER_EXPIRY_MS,
  OFFER_MESSAGE_MAX,
  OFFER_STATUS_COLORS,
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  OPEN_OFFER_STATUSES,
  type OfferStatus,
} from "@/lib/offers/constants"

const mockCreateClient = vi.mocked(createClient)

describe("offers status machine", () => {
  it("declares the AC statuses incl. expired (#75)", () => {
    expect(OFFER_STATUSES).toEqual([
      "pending",
      "countered",
      "accepted",
      "declined",
      "expired",
    ])
  })

  it("labels and colors cover every declared status", () => {
    for (const status of OFFER_STATUSES) {
      expect(OFFER_STATUS_LABELS[status]).toBeTruthy()
      expect(OFFER_STATUS_COLORS[status]).toMatch(/^bg-.*text-/)
    }
  })

  it("does not add labels for undeclared statuses", () => {
    const declared = new Set<string>(OFFER_STATUSES)
    const labeled = Object.keys(OFFER_STATUS_LABELS) as OfferStatus[]
    expect(labeled.every((s) => declared.has(s))).toBe(true)
  })
})

describe("offers bounds mirror the DB constraints", () => {
  it("allows a positive amount ceiling and the 500-char message cap", () => {
    expect(OFFER_AMOUNT_MAX).toBeGreaterThan(0)
    expect(OFFER_MESSAGE_MAX).toBe(500)
  })
})

describe("offers.open statuses", () => {
  it("marks pending and countered as the only open statuses", () => {
    expect(OPEN_OFFER_STATUSES.sort()).toEqual(["countered", "pending"])
  })

  it("every open status is a declared status", () => {
    const declared = new Set<string>(OFFER_STATUSES)
    expect(OPEN_OFFER_STATUSES.every((s) => declared.has(s))).toBe(true)
  })
})

describe("offers expiry policy", () => {
  it("exposes a 7-day expiry window in ms (#75)", () => {
    expect(OFFER_EXPIRY_MS).toBe(7 * 24 * 3600 * 1000)
  })
})

describe("offers.buildLoginUrl", () => {
  it("builds the login URL with the current path as next", () => {
    expect(buildLoginUrl("/listings/abc-123")).toBe(
      "/login?next=%2Flistings%2Fabc-123"
    )
  })

  it("encodes a query string inside the next param", () => {
    expect(buildLoginUrl("/?category=books")).toContain(
      "next=%2F%3Fcategory%3Dbooks"
    )
  })
})

describe("offers.submitOfferRow (rate-limited RPC)", () => {
  it("delegates to the submit_offer RPC with the listing id and amount", async () => {
    const rpc = vi.fn(async () => ({
      data: { ok: true, error: null },
      error: null,
    }))
    mockCreateClient.mockResolvedValue({ rpc } as never)

    const result = await submitOfferRow({
      listingId: "11111111-1111-4111-8111-111111111111",
      amount: 500,
      message: "  hi  ",
    })

    expect(rpc).toHaveBeenCalledWith("submit_offer", {
      p_listing_id: "11111111-1111-4111-8111-111111111111",
      p_amount: 500,
      p_message: "hi",
    })
    expect(result).toEqual({ ok: true, error: null })
  })

  it("surfaces a rate-limit error from the RPC", async () => {
    mockCreateClient.mockResolvedValue({
      rpc: async () => ({
        data: { ok: false, error: "rate limit exceeded, please wait before submitting another offer" },
        error: null,
      }),
    } as never)

    const result = await submitOfferRow({
      listingId: "22222222-2222-4222-8222-222222222222",
      amount: 50,
      message: null,
    })

    expect(result.ok).toBe(false)
    expect(result.error).toContain("rate limit exceeded")
  })

  it("rejects a malformed listing id before touching the RPC", async () => {
    const rpc = vi.fn()
    mockCreateClient.mockResolvedValue({ rpc } as never)

    const result = await submitOfferRow({
      listingId: "not-a-uuid",
      amount: 50,
      message: null,
    })

    expect(rpc).not.toHaveBeenCalled()
    expect(result).toEqual({ ok: false, error: "invalid listing id" })
  })

  it("reduces a PostgREST error to its message", async () => {
    mockCreateClient.mockResolvedValue({
      rpc: async () => ({ data: null, error: { message: "boom" } }),
    } as never)

    const result = await submitOfferRow({
      listingId: "33333333-3333-4333-8333-333333333333",
      amount: 50,
      message: null,
    })

    expect(result).toEqual({ ok: false, error: "boom" })
  })
})
