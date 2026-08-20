import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ai/listings", () => ({
  generateListingSuggestions: vi.fn(),
}))
vi.mock("@/lib/ai/telemetry", () => ({
  recordAiUsage: vi.fn(),
}))
vi.mock("@/lib/auth", () => ({
  requireSeller: vi.fn(),
}))
vi.mock("@/lib/ai/quota", () => ({
  consumeAiGeneration: vi.fn(),
  countAiGenerationsThisMonth: vi.fn(),
}))
vi.mock("@/lib/plans/constants", () => ({
  AI_LIMIT_MESSAGE: "You've used your free AI listing credits for this month. You can still create your listing manually.",
  aiLimit: vi.fn(),
  isAtCap: vi.fn(),
}))
vi.mock("@/lib/usage", () => ({
  fetchSellerTier: vi.fn(),
}))

import { generateListingSuggestions } from "@/lib/ai/listings"
import { recordAiUsage } from "@/lib/ai/telemetry"
import { requireSeller } from "@/lib/auth"
import { consumeAiGeneration, countAiGenerationsThisMonth } from "@/lib/ai/quota"
import { AI_LIMIT_MESSAGE, aiLimit, isAtCap } from "@/lib/plans/constants"
import { fetchSellerTier } from "@/lib/usage"
import { generateListingSuggestionsAction } from "@/app/actions/ai"
import type { AIListingResult } from "@/lib/ai/constants"
import type { Category } from "@/lib/listings/constants"

const mockedGenerate = vi.mocked(generateListingSuggestions)
const mockedRecord = vi.mocked(recordAiUsage)
const mockedRequireSeller = vi.mocked(requireSeller)
const mockedFetchTier = vi.mocked(fetchSellerTier)
const mockedAiLimit = vi.mocked(aiLimit)
const mockedCount = vi.mocked(countAiGenerationsThisMonth)
const mockedIsAtCap = vi.mocked(isAtCap)
const mockedConsume = vi.mocked(consumeAiGeneration)

const CATEGORIES: Category[] = [
  { id: "c-electronics", name: "Electronics", slug: "electronics", parent_id: null },
]

const photo = (name = "photo.jpg"): File =>
  new File(["x"], name, { type: "image/jpeg" })

function fd(over: Record<string, string> = {}): FormData {
  const form = new FormData()
  form.append("photos", photo())
  form.append("categories", JSON.stringify(CATEGORIES))
  for (const [k, v] of Object.entries(over)) form.append(k, v)
  return form
}

const okResult: AIListingResult = {
  ok: true,
  suggestion: {
    title: "Chair",
    description: "A chair",
    categoryId: "c-electronics",
    categoryName: "Electronics",
    condition: "Fair",
    keywords: ["chair"],
    qualityScore: 70,
  },
}

beforeEach(() => {
  mockedGenerate.mockReset()
  mockedRecord.mockReset()
  mockedRequireSeller.mockResolvedValue({ id: "seller-1" } as never)
  mockedFetchTier.mockResolvedValue("free")
  mockedAiLimit.mockReturnValue(3)
  mockedCount.mockResolvedValue(0)
  mockedIsAtCap.mockReturnValue(false)
  mockedConsume.mockResolvedValue({ ok: true, used: 1, limit: 3, error: null })
})

describe("generateListingSuggestionsAction (T14 + T25 metering)", () => {
  it("returns a manual-first error without photos and never calls the seam", async () => {
    const res = await generateListingSuggestionsAction({}, new FormData())
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.message).toBe("Add a photo first")
    expect(mockedGenerate).not.toHaveBeenCalled()
  })

  it("records ai_used and returns the seam's suggestion", async () => {
    mockedGenerate.mockResolvedValue(okResult)
    const res = await generateListingSuggestionsAction({}, fd())
    expect(res.ok).toBe(true)
    if (!res.ok || !res.suggestion) throw new Error("expected ok")
    expect(res.suggestion.title).toBe("Chair")
    expect(mockedRecord).toHaveBeenCalledWith("ai_used")
    expect(mockedConsume).toHaveBeenCalledWith("generate", 3)
  })

  it("records ai_regenerated when the client asks for a regeneration", async () => {
    mockedGenerate.mockResolvedValue(okResult)
    await generateListingSuggestionsAction({}, fd({ ai_event: "regenerate" }))
    expect(mockedRecord).toHaveBeenCalledWith("ai_regenerated")
    expect(mockedConsume).toHaveBeenCalledWith("regenerate", 3)
  })

  it("forwards the seller's title/description to the seam (FS-005 inputs)", async () => {
    mockedGenerate.mockResolvedValue(okResult)
    await generateListingSuggestionsAction(
      {},
      fd({ title: "Stool", description: "Solid oak" })
    )
    expect(mockedGenerate).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Array),
      { title: "Stool", description: "Solid oak" }
    )
  })

  it("passes through a degraded seam result", async () => {
    mockedGenerate.mockResolvedValue({
      ok: false,
      reason: "degraded",
      message: "AI request failed",
    })
    const res = await generateListingSuggestionsAction({}, fd())
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
    expect(mockedConsume).not.toHaveBeenCalled()
  })

  // ---- T25 metering ----
  it("short-circuits with the §26 AI-limit message when the quota is exhausted", async () => {
    mockedCount.mockResolvedValue(3)
    mockedIsAtCap.mockReturnValue(true)
    const res = await generateListingSuggestionsAction({}, fd())
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.message).toBe(AI_LIMIT_MESSAGE)
    expect(mockedGenerate).not.toHaveBeenCalled()
    expect(mockedConsume).not.toHaveBeenCalled()
  })

  it("does not consume a credit when the provider fails", async () => {
    mockedGenerate.mockResolvedValue({
      ok: false,
      reason: "degraded",
      message: "AI request failed",
    })
    await generateListingSuggestionsAction({}, fd())
    expect(mockedConsume).not.toHaveBeenCalled()
  })
})