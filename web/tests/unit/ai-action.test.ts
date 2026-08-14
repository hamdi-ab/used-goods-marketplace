import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ai/listings", () => ({
  generateListingSuggestions: vi.fn(),
}))
vi.mock("@/lib/ai/telemetry", () => ({
  recordAiUsage: vi.fn(),
}))

import { generateListingSuggestions } from "@/lib/ai/listings"
import { recordAiUsage } from "@/lib/ai/telemetry"
import { generateListingSuggestionsAction } from "@/app/actions/ai"
import type { AIListingResult } from "@/lib/ai/constants"
import type { Category } from "@/lib/listings/constants"

const mockedGenerate = vi.mocked(generateListingSuggestions)
const mockedRecord = vi.mocked(recordAiUsage)

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
})

describe("generateListingSuggestionsAction (T14, integration with the AI seam)", () => {
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
  })

  it("records ai_regenerated when the client asks for a regeneration", async () => {
    mockedGenerate.mockResolvedValue(okResult)
    await generateListingSuggestionsAction({}, fd({ ai_event: "regenerate" }))
    expect(mockedRecord).toHaveBeenCalledWith("ai_regenerated")
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
  })
})
