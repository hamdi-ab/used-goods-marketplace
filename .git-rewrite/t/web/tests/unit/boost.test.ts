import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/auth", () => ({
  requireSeller: vi.fn(),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))
vi.mock("@/lib/listings", () => ({
  boostListing: vi.fn(),
  CONDITIONS: ["Brand New", "Lightly Used", "Fair"],
  STATUSES: ["draft", "published", "sold"],
  MAX_IMAGES: 10,
}))

import { revalidatePath } from "next/cache"
import { requireSeller } from "@/lib/auth"
import { boostListing as boostListingRow } from "@/lib/listings"
import { boostListing } from "@/app/actions/listings"

vi.mocked(requireSeller).mockResolvedValue({
  id: "seller-1",
  email: "seller@test.local",
  role: "seller",
  tier: "pro",
  fullName: "Seller",
  profileCompleted: true,
} as never)

const UUID = "123e4567-e89b-12d3-a456-426614174000"

function boostFormData(over: Record<string, unknown> = {}): FormData {
  const form = new FormData()
  form.append("id", UUID)
  for (const [k, v] of Object.entries(over)) {
    if (typeof v === "string") form.append(k, v)
  }
  return form
}

beforeEach(() => {
  vi.mocked(boostListingRow).mockReset()
})

describe("boostListing action — T29", () => {
  it("boosts a published listing with the preset and revalidates", async () => {
    vi.mocked(boostListingRow).mockResolvedValue({
      ok: true,
      error: null,
    })

    const res = await boostListing({ ok: true }, boostFormData({ preset: "premium" }))

    expect(res.ok).toBe(true)
    expect(boostListingRow).toHaveBeenCalledWith(UUID, "premium")
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard")
    expect(revalidatePath).toHaveBeenCalledWith(`/listings/${UUID}`)
  })

  it("defaults the preset to premium when omitted", async () => {
    vi.mocked(boostListingRow).mockResolvedValue({
      ok: true,
      error: null,
    })

    const res = await boostListing({ ok: true }, boostFormData())

    expect(res.ok).toBe(true)
    expect(boostListingRow).toHaveBeenCalledWith(UUID, "premium")
  })

  it("rejects with the §26-style nudge when the RPC denies ownership", async () => {
    vi.mocked(boostListingRow).mockResolvedValue({
      ok: false,
      error: "not_owner",
    })

    const res = await boostListing({ ok: true }, boostFormData({ preset: "standard" }))

    expect(res.ok).toBe(false)
    expect(res.message).toMatch(/not_owner/)
    expect(boostListingRow).toHaveBeenCalledWith(UUID, "standard")
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("rejects an invalid preset via zod", async () => {
    const res = await boostListing({ ok: true }, boostFormData({ preset: "bogus" }))

    expect(res.ok).toBe(false)
    expect(res.message).toBeTruthy()
    expect(boostListingRow).not.toHaveBeenCalled()
  })
})
