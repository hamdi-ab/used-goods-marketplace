import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { Category } from "@/lib/listings/constants"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { generateListingSuggestions } from "@/lib/ai/listings"

const mockedCreateClient = vi.mocked(createClient)
let rpcMock: ReturnType<typeof vi.fn>

const CATEGORIES: Category[] = [
  { id: "c-electronics", name: "Electronics", slug: "electronics", parent_id: null },
  { id: "c-furniture", name: "Furniture", slug: "furniture", parent_id: null },
  { id: "c-books", name: "Books", slug: "books", parent_id: null },
]

// Real image signatures so the magic-byte validator (#69) accepts them.
const JPEG_MAGIC = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
])
const PNG_MAGIC = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const photo = (name = "photo.jpg"): File =>
  new File([JPEG_MAGIC], name, { type: "image/jpeg" })

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

  // The shared limiter (record_ai_request RPC) allows by default.
  rpcMock = vi.fn()
  rpcMock.mockResolvedValue({ data: { allowed: true, error: null }, error: null })
  mockedCreateClient.mockResolvedValue({ rpc: rpcMock } as never)

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

  it("returns rate_limited when the shared window is exhausted (AC-4, #69)", async () => {
    const ok = geminiResponse(validJson())
    fetchMock.mockResolvedValueOnce(ok).mockResolvedValueOnce(ok)
    rpcMock
      .mockResolvedValueOnce({ data: { allowed: true, error: null }, error: null })
      .mockResolvedValueOnce({ data: { allowed: true, error: null }, error: null })
      .mockResolvedValueOnce({ data: { allowed: false, error: "rate limit exceeded" }, error: null })
    expect((await generateListingSuggestions([photo()], CATEGORIES)).ok).toBe(true)
    expect((await generateListingSuggestions([photo()], CATEGORIES)).ok).toBe(true)
    const third = await generateListingSuggestions([photo()], CATEGORIES)
    expect(third.ok).toBe(false)
    expect(third.ok ? "" : third.reason).toBe("rate_limited")
    // The denied request never reached Gemini.
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("passes the configured AI_RATE_LIMIT to the shared limiter (#69)", async () => {
    process.env.AI_RATE_LIMIT = "2"
    fetchMock.mockResolvedValueOnce(geminiResponse(validJson()))
    await generateListingSuggestions([photo()], CATEGORIES)
    expect(rpcMock).toHaveBeenCalledWith("record_ai_request", { p_limit: 2 })
  })

  it("rejects a file whose magic bytes are not an image (renamed executable)", async () => {
    const exe = new File(
      [new Uint8Array([0x4d, 0x5a, 0x90, 0x00])],
      "photo.jpg",
      { type: "image/jpeg" }
    )
    const res = await generateListingSuggestions([exe], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.message).toContain("not a valid JPG, PNG or WebP")
    expect(fetchMock).not.toHaveBeenCalled()
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it("rejects an oversized photo before forwarding (#69)", async () => {
    const big = new File(
      [JPEG_MAGIC, new Uint8Array(6 * 1024 * 1024)],
      "big.jpg",
      { type: "image/jpeg" }
    )
    const res = await generateListingSuggestions([big], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.message).toBe("Each photo must be 5 MB or smaller")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("forwards the magic-byte mime, not the client-declared type (#69)", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse(validJson()))
    const sneaky = new File([PNG_MAGIC], "sneaky.bin", { type: "application/octet-stream" })
    const res = await generateListingSuggestions([sneaky], CATEGORIES)
    expect(res.ok).toBe(true)
    const call = fetchMock.mock.calls[0] as [string, { body: string }]
    const parsed = JSON.parse(call[1].body)
    const imageParts = parsed.contents[0].parts.filter((p: unknown) =>
      Object.prototype.hasOwnProperty.call(p, "inlineData")
    )
    expect(imageParts[0].inlineData.mimeType).toBe("image/png")
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
      text: async () => "",
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

  it("degrades when the request is aborted by the 10s timeout (NFR-AI-002)", async () => {
    fetchMock.mockRejectedValueOnce(
      new DOMException("The operation was aborted.", "AbortError")
    )
    const res = await generateListingSuggestions([photo()], CATEGORIES)
    expect(res.ok).toBe(false)
    expect(res.ok ? "" : res.reason).toBe("degraded")
  })

  it("sends the seller's optional title/description as prompt context (FS-005 Inputs)", async () => {
    fetchMock.mockResolvedValueOnce(geminiResponse(validJson()))
    const res = await generateListingSuggestions([photo()], CATEGORIES, {
      title: "Wooden stool",
      description: "Solid oak, light wear",
    })
    expect(res.ok).toBe(true)
    const call = fetchMock.mock.calls[0] as [string, { body: string }]
    const parsed = JSON.parse(call[1].body)
    const promptText = parsed.contents[0].parts[0].text as string
    expect(promptText).toContain("Title: Wooden stool")
    expect(promptText).toContain("Description: Solid oak, light wear")
  })
})
