import "server-only"

import { z } from "zod"
import type { Category } from "@/lib/listings/constants"
import { createClient } from "@/lib/supabase/server"
import { detectImageMime, validateImageFile } from "@/lib/media/primitives"
import {
  AI_LISTING_BASE_URL,
  AI_LISTING_CONDITIONS,
  AI_LISTING_TIMEOUT_MS,
  type AICondition,
  type AIListingResult,
  type AIPromptContext,
  buildPrompt,
  buildResponseSchema,
} from "./constants"

// ---- Rate limiting (AC-4, fix #69) ----
// The window count lives in Postgres (ai_requests + record_ai_request RPC),
// not a per-process array: on the Vercel serverless target (ADR-017) each
// instance shared its own window, and anon callers could consume Gemini quota.
// The action now requires seller auth (app/actions/ai.ts) and the RPC enforces
// the same 60s window across instances. `AI_RATE_LIMIT` (default 10) is read
// per call so tests and runtime overrides can vary it. The feature stays
// non-gating (NFR-AI-003): a miss simply degrades to manual listing.
async function aiRequestAllowed(): Promise<boolean> {
  const supabase = await createClient()
  const limit = Number(process.env.AI_RATE_LIMIT ?? 10)
  const { data, error } = await supabase.rpc("record_ai_request", {
    p_limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10,
  })
  return !error && data?.allowed === true
}

// Convert a browser File to a Gemini inlineData part without pulling in an
// image-resize dependency (ADR-019's ≤1024px downscale is a future token-budget
// tune; sending the bytes is sufficient for the non-gating demo). The mimeType
// comes from the magic-byte detection (fix #69), never the client-declared
// file.type — a renamed executable never reaches Gemini.
async function toInlinePart(
  file: File,
  mimeType: string
): Promise<{ mimeType: string; data: string }> {
  const buf = Buffer.from(await file.arrayBuffer())
  return { mimeType, data: buf.toString("base64") }
}

const suggestionSchema = (categoryNames: string[]) =>
  z.object({
    title: z.string().min(1).max(70),
    description: z.string().min(1),
    category: z
      .string()
      .refine((v) => categoryNames.includes(v), "invalid category"),
    keywords: z.array(z.string().min(1)).min(1).max(5),
    condition: z
      .string()
      .refine(
        (v): v is AICondition =>
          (AI_LISTING_CONDITIONS as readonly string[]).includes(v),
        "invalid condition"
      ),
    quality_score: z.number().int().min(0).max(100),
  })

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

/**
 * Call Gemini (flash-class multimodal) with the given photos and return a typed,
 * schema-validated suggestion. Every failure — missing key, rate limit, timeout,
 * network error, non-2xx, malformed JSON, schema mismatch, invalid upload —
 * resolves to a degraded result (AC-3/AC-4, NFR-AI-002/NFR-AI-003) so the caller
 * can always fall back to manual creation. Messages are end-seller-safe: no
 * server-config details leak to the UI (AC-3).
 */
export async function generateListingSuggestions(
  photos: File[],
  categories: Category[],
  context: AIPromptContext = {}
): Promise<AIListingResult> {
  const t0 = Date.now()
  console.log(`[AI] start: ${photos.length} photos, ${categories.length} categories`)
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.log("[AI] no API key")
    return { ok: false, reason: "unavailable", message: "AI assist is unavailable right now" }
  }

  // Validate before forwarding (fix #69): magic bytes must be a real JPG/PNG/
  // WEBP and within the size cap — invalid uploads never reach Gemini or the
  // shared rate limiter.
  const parts: { mimeType: string; data: string }[] = []
  for (const file of photos) {
    const tValidate = Date.now()
    const invalid = await validateImageFile(file)
    console.log(`[AI] validateImageFile(${file.name}, ${file.size}B): ${Date.now() - tValidate}ms, invalid=${invalid}`)
    if (invalid) {
      return { ok: false, reason: "degraded", message: invalid }
    }
    // validateImageFile guarantees a real image, so the re-detected mime is
    // non-null; it is the forwarded mime, never the client-declared file.type.
    const tMime = Date.now()
    const mime = (await detectImageMime(file)) ?? ""
    console.log(`[AI] detectImageMime(${file.name}): ${Date.now() - tMime}ms, mime=${mime}`)
    const tInline = Date.now()
    parts.push(await toInlinePart(file, mime))
    console.log(`[AI] toInlinePart(${file.name}): ${Date.now() - tInline}ms, base64=${parts[parts.length - 1].data.length}chars`)
  }
  if (!parts.length) {
    console.log("[AI] no parts after processing")
    return { ok: false, reason: "degraded", message: "No readable photos" }
  }

  const categoryNames = [...new Set(categories.map((c) => c.name))]
  if (!categoryNames.length) {
    console.log("[AI] no category names")
    return { ok: false, reason: "degraded", message: "No categories available" }
  }

  const tRate = Date.now()
  const rateAllowed = await aiRequestAllowed()
  console.log(`[AI] aiRequestAllowed: ${Date.now() - tRate}ms, allowed=${rateAllowed}`)
  if (!rateAllowed) {
    return {
      ok: false,
      reason: "rate_limited",
      message: "AI assist is busy right now — try again shortly",
    }
  }

  const url = `${AI_LISTING_BASE_URL}?key=${apiKey}`
  const body = {
    contents: [
      {
        parts: [
          { text: buildPrompt(categoryNames, context) },
          ...parts.map((p) => ({
            inlineData: { mimeType: p.mimeType, data: p.data },
          })),
        ],
      },
    ],
    generationConfig: {
      temperature: 0.5,
      maxOutputTokens: 512,
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(categoryNames),
    },
  }
  console.log(`[AI] request body: ${JSON.stringify(body).length}bytes, ${parts.length} images`)

  let res: Response
  const tFetch = Date.now()
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // NFR-AI-002: hard 10s ceiling — a slow/hung model degrades instead of
      // leaving the seller stuck.
      signal: AbortSignal.timeout(AI_LISTING_TIMEOUT_MS),
    })
  } catch (err) {
    console.log(`[AI] fetch error after ${Date.now() - tFetch}ms:`, err)
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }
  console.log(`[AI] fetch done: ${Date.now() - tFetch}ms, status=${res.status}`)

  if (res.status === 429) {
    return {
      ok: false,
      reason: "rate_limited",
      message: "AI assist is busy right now — try again shortly",
    }
  }
  if (res.status === 403) {
    return {
      ok: false,
      reason: "unavailable",
      message: "AI assist is unavailable right now",
    }
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    console.log(`[AI] non-ok response: ${res.status}, body=${errText.slice(0, 200)}`)
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }

  const tJson = Date.now()
  const json = (await res.json().catch(() => null)) as GeminiResponse | null
  console.log(`[AI] json parse: ${Date.now() - tJson}ms, hasCandidates=${!!json?.candidates?.length}`)
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.log("[AI] no text in response:", JSON.stringify(json).slice(0, 300))
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    console.log("[AI] JSON parse failed:", text.slice(0, 200))
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }

  const result = suggestionSchema(categoryNames).safeParse(parsed)
  if (!result.success) {
    console.log("[AI] schema validation failed:", result.error.message)
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }

  const out = result.data
  const category = categories.find((c) => c.name === out.category)
  console.log(`[AI] done: total ${Date.now() - t0}ms, title="${out.title.slice(0, 30)}..."`)
  return {
    ok: true,
    suggestion: {
      title: out.title,
      description: out.description,
      categoryId: category?.id ?? null,
      categoryName: out.category,
      condition: out.condition,
      keywords: out.keywords,
      qualityScore: out.quality_score,
    },
  }
}
