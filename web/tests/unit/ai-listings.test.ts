import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { Category } from "@/lib/listings/constants"

import { resetAiRateLimiter, generateListingSuggestions } from "@/lib/ai/listings"

const CATEGORIES: Category[] = [
  { id: "c-electronics", name: "Electronics", slug: "electronics", parent_id: null },
  { id: "c-furniture", name: "Furniture", slug: "furniture", parent_id: null },
  { id: "c-books", name: "Books", slug: "books", parent_id: null },
]

const photo = (name = "photo.jpg"): File =>
  new File(["unused-bytes"], name, { type: "image/jpeg" })

const validJson = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    title: "Restored wooden chair",
    description: "Solid wood, gently restored.",
    category: "Furniture",
    keywords: ["chair", "wood"],
    condition: "Lightly Used",
    quality_score: 82,
    ...over,
  })

const geminiResponse = (text: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
})

const originalFetch = globalThis.fetch
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  // The seam calls the global fetch (server-only); stub it per-test.
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch
  resetAiRateLimiter()
  process.env.GEMINI_API_KEY = "test-key"
  delete process.env.AI_RATE_LIMIT
})

afterEach(() => {
  globalThis.fetch = originalFetch
  delete process.env.GEMINI_API_KEY
  delete process.env.AI_RATE_LIMIT
})

describe("generateListingSuggestions (T14 / FS-005)", () => {
  it("is unavailable without an API key (graceful degradation, AC-3)", async () => {
    delete process.env.GEMINI_API_KEY
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("unavailable")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns rate_limited when the in-process window is exhausted (AC-4)", async () => {
    process.env.AI_RATE_LIMIT = "2"
    const ok = geminiResponse(validJson())
    fetchMock.mockResolvedValueOnce(ok).mockResolvedValueOnce(ok)
    expect((await generateListingSuggestions([photo()], CATEGORIES)).ok).toBe(true)
    expect((await generateListingSuggestions([photo()], CATEGORIES)).ok).toBe(true)
    const third = await generateListingSuggestions([photo()], CATEGORIES)
    expect(third.ok).toBe(false)
    expect(third.ok ? "" : third.reason).toBe("rate_limited")
  })

  it("treats a 429 from Gemini as rate_limited", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      json: async () => ({}),
    })
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("rate_limited")
  })

  it("degrades on a non-2xx Gemini response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({}),
    })
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
  })

  it("degrades when the network call throws (down/error path, AC-3)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"))
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
  })

  it("degrades on a malformed JSON payload", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse("{not json"))
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
  })

  it("degrades on a category the seller does not have", async () => {
    fetchMock.mockResolvedValueOnce(
      geminiResponse(validJson({ category: "Nonexistent" }))
    )
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
  })

  it("degrades on an out-of-range quality_score", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse(validJson({ quality_score: 150 })))
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
  })

  it("degrades when no readable photos are supplied", async () => {
    const res = await generateListingSuggestions([], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps a valid response to a suggestion, resolving the category id in one call", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse(validJson()))
    const res = await generateListingSuggestions(
      [photo("a.jpg"), photo("b.png")],
      CATEGORIES
    )
    expect(res.ok).toBe(true)
    if (!res.ok) throw new Error("expected ok")
    expect(res.suggestion.title).toBe("Restored wooden chair")
    expect(res.suggestion.categoryName).toBe("Furniture")
    expect(res.suggestion.categoryId).toBe("c-furniture")
    expect(res.suggestion.condition).toBe("Lightly Used")
    expect(res.suggestion.qualityScore).toBe(82)
    expect(res.suggestion.keywords).toEqual(["chair", "wood"])
    // Exactly one Gemini round-trip regardless of image count.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const call = fetchMock.mock.calls[0] as [string, { body: string }]
    const parsed = JSON.parse(call[1].body)
    const imageParts = parsed.contents[0].parts.filter((p: unknown) =>
      Object.prototype.hasOwnProperty.call(p, "inlineData")
    )
    expect(imageParts).toHaveLength(2)
    expect(parsed.generationConfig.responseMimeType).toBe("application/json")
  })
})
