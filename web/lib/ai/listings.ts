import "server-only"

import { z } from "zod"
import type { Category } from "@/lib/listings/constants"
import {
  AI_LISTING_BASE_URL,
  AI_LISTING_CONDITIONS,
  type AICondition,
  type AIListingResult,
  buildResponseSchema,
  PROMPT_TEMPLATE,
} from "./constants"

// ---- Rate limiting (AC-4) ----
// Simple per-process sliding window. Good enough for the demo MVP; a
// multi-instance deployment would back this with a shared store (Redis/Upstash),
// but the feature is explicitly non-gating — a miss here just degrades to manual.
// Env is read per-call so tests (and runtime overrides) can vary the limit.
const AI_RATE_WINDOW_MS = 60_000
const aiCallTimestamps: number[] = []

export function resetAiRateLimiter(): void {
  aiCallTimestamps.length = 0
}

function aiRateLimited(now: number): boolean {
  const limit = Number(process.env.AI_RATE_LIMIT ?? 10)
  const cutoff = now - AI_RATE_WINDOW_MS
  for (let i = aiCallTimestamps.length - 1; i >= 0; i--) {
    if (aiCallTimestamps[i] < cutoff) aiCallTimestamps.splice(i, 1)
  }
  if (aiCallTimestamps.length >= limit) return true
  aiCallTimestamps.push(now)
  return false
}

// Convert a browser File to a Gemini inlineData part without pulling in an
// image-resize dependency (ADR-019's ≤1024px downscale is a future token-budget
// tune; sending the bytes is sufficient for the non-gating demo).
async function toInlinePart(
  file: File
): Promise<{ mimeType: string; data: string } | null> {
  if (!file || file.size === 0) return null
  const buf = Buffer.from(await file.arrayBuffer())
  return { mimeType: file.type || "image/jpeg", data: buf.toString("base64") }
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
 * schema-validated suggestion. Every failure — missing key, rate limit, network
 * error, non-2xx, malformed JSON, schema mismatch — resolves to a degraded
 * result (AC-3/AC-4) so the caller can always fall back to manual creation.
 */
export async function generateListingSuggestions(
  photos: File[],
  categories: Category[]
): Promise<AIListingResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { ok: false, reason: "unavailable", message: "AI key not configured" }
  }
  if (aiRateLimited(Date.now())) {
    return {
      ok: false,
      reason: "rate_limited",
      message: "AI assist is rate limited",
    }
  }

  const parts: { mimeType: string; data: string }[] = []
  for (const file of photos) {
    const part = await toInlinePart(file)
    if (part) parts.push(part)
  }
  if (!parts.length) {
    return { ok: false, reason: "degraded", message: "No readable photos" }
  }

  const categoryNames = [...new Set(categories.map((c) => c.name))]
  if (!categoryNames.length) {
    return { ok: false, reason: "degraded", message: "No categories available" }
  }

  const url = `${AI_LISTING_BASE_URL}?key=${apiKey}`
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT_TEMPLATE(categoryNames) },
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

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }

  if (res.status === 429) {
    return {
      ok: false,
      reason: "rate_limited",
      message: `Gemini responded ${res.status}`,
    }
  }
  if (res.status === 403) {
    return {
      ok: false,
      reason: "unavailable",
      message: `Gemini responded ${res.status}`,
    }
  }
  if (!res.ok) {
    return { ok: false, reason: "degraded", message: `Gemini responded ${res.status}` }
  }

  const json = (await res.json().catch(() => null)) as GeminiResponse | null
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    return { ok: false, reason: "degraded", message: "Empty AI response" }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: "degraded", message: "Malformed AI response" }
  }

  const result = suggestionSchema(categoryNames).safeParse(parsed)
  if (!result.success) {
    return { ok: false, reason: "degraded", message: "Unparseable AI response" }
  }

  const out = result.data
  const category = categories.find((c) => c.name === out.category)
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
