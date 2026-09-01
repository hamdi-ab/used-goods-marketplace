import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  requireSeller: vi.fn(),
}))
vi.mock("@/lib/usage", () => ({
  enforceListingCap: vi.fn(),
}))
vi.mock("@/lib/ai/telemetry", () => ({
  recordAiUsage: vi.fn(),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))
vi.mock("@/lib/listings", () => ({
  createListing: vi.fn(),
  fetchListing: vi.fn(),
  updateListing: vi.fn(),
  softDeleteListing: vi.fn(),
  CONDITIONS: ["Brand New", "Lightly Used", "Fair"],
  STATUSES: ["draft", "published", "sold"],
  MAX_IMAGES: 10,
}))

import { requireSeller } from "@/lib/auth"
import { enforceListingCap } from "@/lib/usage"
import { createListing as createListingRow, fetchListing, updateListing as updateListingRow } from "@/lib/listings"
import { createListing, updateListing } from "@/app/actions/listings"
import type { Category } from "@/lib/listings/constants"

vi.mocked(requireSeller).mockResolvedValue({
  id: "seller-1",
  email: "seller@test.local",
  role: "seller",
  tier: "free",
  fullName: "Seller",
  profileCompleted: true,
} as never)

const CATEGORIES: Category[] = [
  { id: "c-electronics", name: "Electronics", slug: "electronics", parent_id: null },
]

const photo = (): File => new File(["x"], "photo.jpg", { type: "image/jpeg" })

function createFormData(over: Record<string, unknown> = {}): FormData {
  const form = new FormData()
  form.append("title", "A used phone")
  form.append("description", "Works fine, 2023 model, great condition")
  form.append("price", "1500")
  form.append("condition", "Lightly Used")
  form.append("city", "Bole")
  form.append("photos", photo())
  form.append("categories", JSON.stringify(CATEGORIES))
  for (const [k, v] of Object.entries(over)) {
    if (typeof v === "string" || v instanceof File) form.append(k, v)
    else if (v !== undefined && v !== null) form.append(k, String(v))
  }
  return form
}

beforeEach(() => {
  vi.mocked(enforceListingCap).mockResolvedValue({ ok: true, used: 0, limit: 5 })
  vi.mocked(requireSeller).mockResolvedValue({
    id: "seller-1",
    email: "seller@test.local",
    role: "seller",
    tier: "free",
    fullName: "Seller",
    profileCompleted: true,
  } as never)
  vi.mocked(createListingRow).mockReset()
  vi.mocked(updateListingRow).mockReset()
  vi.mocked(fetchListing).mockReset()
})

describe("createListing action — T26 cap enforcement", () => {
  it("rejects creation at the free-tier active-listing cap with the §26 message", async () => {
    vi.mocked(enforceListingCap).mockResolvedValue({
      ok: false,
      used: 5,
      limit: 5,
      message: "You've reached your 5 active listing limit.",
    })
    const res = await createListing({} as never, createFormData())
    expect(res.ok).not.toBe(true)
    expect(res.message).toMatch(/5 active listing limit/)
    expect(createListingRow).not.toHaveBeenCalled()
  })

  it("creates the listing when under the cap", async () => {
    vi.mocked(createListingRow).mockResolvedValue({ id: "l-1" })
    const res = await createListing({} as never, createFormData())
    expect(res.ok).toBe(true)
    expect(enforceListingCap).toHaveBeenCalledWith("seller-1", "seller")
  })

  it("lets admins bypass the cap", async () => {
    vi.mocked(requireSeller).mockResolvedValue({
      id: "admin-1", role: "admin", tier: "business", email: "a@t", fullName: null,
      profileCompleted: true,
    } as never)
    vi.mocked(enforceListingCap).mockResolvedValue({ ok: true, used: 0, limit: Infinity })
    vi.mocked(createListingRow).mockResolvedValue({ id: "l-2" })
    const res = await createListing({} as never, createFormData())
    expect(res.ok).toBe(true)
  })
})

describe("updateListing action — T26 republish cap", () => {
  it("blocks republishing a draft to published when at the cap", async () => {
    vi.mocked(fetchListing).mockResolvedValue({ listing: { status: "draft" } } as never)
    vi.mocked(enforceListingCap).mockResolvedValue({
      ok: false, used: 5, limit: 5, message: "You've reached your 5 active listing limit.",
    })
    const res = await updateListing({} as never, createFormData({ id: "10000000-0000-0000-0000-000000000001", status: "published" }))
    expect(res.ok).not.toBe(true)
    expect(res.message).toMatch(/5 active listing limit/)
    expect(updateListingRow).not.toHaveBeenCalled()
  })

  it("allows editing an already-published listing (no republish, count unchanged)", async () => {
    vi.mocked(fetchListing).mockResolvedValue({ listing: { status: "published" } } as never)
    vi.mocked(updateListingRow).mockResolvedValue({ ok: true, error: null })
    const res = await updateListing({} as never, createFormData({ id: "10000000-0000-0000-0000-000000000001", status: "published" }))
    expect(res.ok).toBe(true)
    expect(enforceListingCap).not.toHaveBeenCalled()
  })
})
