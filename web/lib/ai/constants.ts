/**
 * T14 - AI Listing Assistant. Pure value objects (no `server-only`, no Supabase,
 * no I/O) shared by the server seam (lib/ai/listings) and the client UI.
 *
 * Framework-agnostic, like lib/reviews/constants: the prompt and the Gemini
 * response-schema are deterministic functions of their inputs, so the AI output
 * contract is testable without hitting the network or holding a credential.
 */

export const AI_LISTING_MODEL = "gemini-2.5-flash"
export const AI_LISTING_BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${AI_LISTING_MODEL}:generateContent`

// Mirrors the listing_condition enum (DB spec §18), NOT the broader vocabulary
// in the vision-proof runbook: Gemini must emit one of our three stored values
// so it can be saved verbatim. (The UI reuses `CONDITIONS` from listings; this
// constant keeps the AI seam self-contained if the sets ever diverge.)
export const AI_LISTING_CONDITIONS = ["Brand New", "Lightly Used", "Fair"] as const
export type AICondition = (typeof AI_LISTING_CONDITIONS)[number]

export interface AIListingSuggestion {
  title: string
  description: string
  categoryId: string | null
  categoryName: string | null
  condition: AICondition | null
  keywords: string[]
  qualityScore: number
}

export type AIListingResult =
  | { ok: true; suggestion: AIListingSuggestion }
  | {
      ok: false
      reason: "unavailable" | "rate_limited" | "degraded"
      message: string
    }

// The prompt sent with every image set. `categoryNames` is interpolated so the
// model can only emit a category the seller actually has.
export const PROMPT_TEMPLATE = (categoryNames: string[]) =>
  `You are a product listing assistant. Return a STRICT JSON object matching the response schema for this used-item photo. title: a concise, searchable title (≤70 chars). description: 1–2 sentences. category: one of: ${categoryNames.join(", ")}. keywords: 1–5 tags. condition: one of: Brand New, Lightly Used, Fair. quality_score: integer 0-100. Do NOT add prose, markdown, or fields outside the schema.`

// JSON Schema (Gemini `responseSchema`). `category` enum is populated from the
// seller's live categories so the model can only return a stored value.
export function buildResponseSchema(categoryNames: string[]) {
  return {
    type: "object" as const,
    properties: {
      title: { type: "string" as const },
      description: { type: "string" as const },
      category: { type: "string" as const, enum: categoryNames },
      keywords: {
        type: "array" as const,
        items: { type: "string" as const },
        minItems: 1,
        maxItems: 5,
      },
      condition: { type: "string" as const, enum: AI_LISTING_CONDITIONS },
      quality_score: { type: "integer" as const, minimum: 0, maximum: 100 },
    },
    required: [
      "title",
      "description",
      "category",
      "keywords",
      "condition",
      "quality_score",
    ],
    propertyOrdering: [
      "title",
      "description",
      "category",
      "keywords",
      "condition",
      "quality_score",
    ],
  }
}
