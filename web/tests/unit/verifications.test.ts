import { describe, it, expect, vi } from "vitest"

import {
  sellerVerificationBadges,
  hasVerification,
  VERIFICATION_BADGE_LABELS,
  VERIFICATION_BADGE_NOTE,
  type VerificationBadge,
} from "@/lib/verifications/constants"

describe("verifications.badge rules", () => {
  it("labels every badge variant", () => {
    const labels: Record<VerificationBadge, string> = VERIFICATION_BADGE_LABELS
    expect(labels["verified-seller"]).toBe("Verified Seller")
    expect(labels.phone).toBe("Phone Verified")
    expect(labels.fayda).toBe("Fayda Verified")
  })

  it("orders verified-seller first, then phone, then fayda", () => {
    const badges = sellerVerificationBadges({
      role: "seller",
      phone_verified: true,
      fayda_verified: true,
    })
    expect(badges).toEqual(["verified-seller", "phone", "fayda"])
  })

  it("surfaces phone when only the phone flag is set", () => {
    expect(
      sellerVerificationBadges({ role: "seller", phone_verified: true, fayda_verified: false })
    ).toEqual(["verified-seller", "phone"])
  })

  it("surfaces fayda when only the fayda flag is set", () => {
    expect(
      sellerVerificationBadges({ role: "seller", phone_verified: false, fayda_verified: true })
    ).toEqual(["verified-seller", "fayda"])
  })

  it("shows no badges for an unverified seller", () => {
    expect(
      sellerVerificationBadges({ role: "seller", phone_verified: false, fayda_verified: false })
    ).toEqual([])
  })

  it("shows no badges for a buyer", () => {
    expect(
      sellerVerificationBadges({ role: "buyer", phone_verified: false, fayda_verified: false })
    ).toEqual([])
  })

  it("treats null seller as the not-verified empty state", () => {
    expect(sellerVerificationBadges(null)).toEqual([])
    expect(hasVerification(null)).toBe(false)
  })

  it("treats missing flags as not verified", () => {
    expect(sellerVerificationBadges({ role: "seller" })).toEqual([])
    expect(sellerVerificationBadges({ role: "buyer" })).toEqual([])
  })
})

describe("verifications.hasVerification", () => {
  it("is false for the empty state", () => {
    expect(
      hasVerification({ role: "buyer", phone_verified: false, fayda_verified: false })
    ).toBe(false)
  })

  it("is true when any badge is active", () => {
    expect(
      hasVerification({ role: "seller", phone_verified: true, fayda_verified: false })
    ).toBe(true)
    expect(
      hasVerification({ role: "buyer", phone_verified: true, fayda_verified: false })
    ).toBe(true)
  })
})

describe("verifications empty-state label", () => {
  it("exposes a stable not-verified message", () => {
    expect(VERIFICATION_BADGE_NOTE).toBe("Not verified yet")
  })
})

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import {
  fetchAdminVerifications,
  fetchMyVerifications,
  recordVerification,
  requestVerificationRow,
} from "@/lib/verifications"

const mockCreateClient = vi.mocked(createClient)

// Scripted client: rpc() resolves canned envelopes per RPC name; from() resolves
// the next canned row per table through a fluent thenable chain.
const script = ({
  rpc,
  tables,
}: {
  rpc?: Record<string, unknown>
  tables?: Record<string, unknown[]>
}) => {
  const cursor: Record<string, number> = {}
  return {
    rpc: (name: string) =>
      Promise.resolve(rpc?.[name] ?? { data: null, error: null }),
    from: (table: string) => {
      const b: Record<string, unknown> = {
        select: () => b,
        eq: () => b,
        order: () => b,
        then: (resolve: (value: unknown) => unknown) => {
          const list = tables?.[table] ?? []
          const next = list[cursor[table] ?? 0] ?? { data: null, error: null }
          cursor[table] = (cursor[table] ?? 0) + 1
          return Promise.resolve(next).then(resolve)
        },
      }
      return b
    },
  }
}

describe("verifications lib (#73)", () => {
  it("requestVerificationRow returns ok on the RPC envelope", async () => {
    const client = script({
      rpc: {
        request_verification: { data: { ok: true, error: null }, error: null },
      },
    })
    mockCreateClient.mockResolvedValue(client as never)
    expect(await requestVerificationRow({ type: "phone" })).toEqual({
      ok: true,
      error: null,
    })
  })

  it("requestVerificationRow surfaces an RPC refusal", async () => {
    const client = script({
      rpc: {
        request_verification: {
          data: { ok: false, error: "already requested" },
          error: null,
        },
      },
    })
    mockCreateClient.mockResolvedValue(client as never)
    expect(await requestVerificationRow({ type: "fayda" })).toEqual({
      ok: false,
      error: "already requested",
    })
  })

  it("requestVerificationRow maps a transport error to ok:false", async () => {
    const client = script({
      rpc: { request_verification: { data: null, error: { message: "db down" } } },
    })
    mockCreateClient.mockResolvedValue(client as never)
    expect(await requestVerificationRow({ type: "phone" })).toEqual({
      ok: false,
      error: "db down",
    })
  })

  it("recordVerification returns the envelope and keeps the user/type", async () => {
    const client = script({
      rpc: {
        record_verification: {
          data: {
            ok: true,
            error: null,
            user_id: "user-1",
            type: "fayda",
          },
          error: null,
        },
      },
    })
    mockCreateClient.mockResolvedValue(client as never)
    const result = await recordVerification({
      userId: "user-1",
      type: "fayda",
      status: "verified",
      notes: "  approved  ",
    })
    expect(result.ok).toBe(true)
    expect(result.user_id).toBe("user-1")
    expect(result.type).toBe("fayda")
  })

  it("fetchMyVerifications returns the user's live rows", async () => {
    const client = script({
      tables: {
        verifications: [
          {
            data: [
              { id: "v1", type: "phone", status: "pending", updated_at: "2026-08-17T00:00:00Z" },
            ],
            error: null,
          },
        ],
      },
    })
    mockCreateClient.mockResolvedValue(client as never)
    const rows = await fetchMyVerifications("user-1")
    expect(rows).toEqual([
      { id: "v1", type: "phone", status: "pending", updated_at: "2026-08-17T00:00:00Z" },
    ])
  })

  it("fetchMyVerifications returns [] on a read error", async () => {
    const client = script({
      tables: { verifications: [{ data: null, error: { message: "db down" } }] },
    })
    mockCreateClient.mockResolvedValue(client as never)
    expect(await fetchMyVerifications("user-1")).toEqual([])
  })

  it("fetchAdminVerifications returns pending requests with user context", async () => {
    const client = script({
      tables: {
        verifications: [
          {
            data: [
              {
                id: "v1",
                user_id: "user-1",
                type: "phone",
                status: "pending",
                notes: null,
                created_at: "2026-08-17T00:00:00Z",
                user: { id: "user-1", full_name: "Biniam", city: "AA", role: "buyer", phone_verified: false, fayda_verified: false },
              },
            ],
            error: null,
          },
        ],
      },
    })
    mockCreateClient.mockResolvedValue(client as never)
    const rows = await fetchAdminVerifications()
    expect(rows).toHaveLength(1)
    expect(rows[0].user?.full_name).toBe("Biniam")
    expect(rows[0].status).toBe("pending")
  })
})
