/**
 * T14 - AI Listing Assistant. Pure value objects (no `server-only`, no Supabase,
 * no I/O) shared by the server seam (lib/ai/listings) and the client UI.
 *
 * Framework-agnostic, like lib/reviews/constants: the prompt and the Gemini
 * response-schema are deterministic functions of their inputs, so the AI output
 * contract is testable without hitting the network or holding a credential.
 */

import { CONDITIONS } from "@/lib/listings/constants"

export const AI_LISTING_MODEL = "gemini-2.5-flash"
export const AI_LISTING_BASE_URL = `https://generativelanguage.googleapis.com/v1/models/${AI_LISTING_MODEL}:generateContent`

// NFR-AI-002: AI responses should complete within 10 seconds. The seam passes
// this to AbortSignal.timeout so a hung Gemini call degrades instead of leaving
// the seller stuck on "Generating…".
export const AI_LISTING_TIMEOUT_MS = 10_000

// Reuses the shared listing_condition vocabulary (lib/listings/constants) so the
// AI seam and the DB enum (DB spec §8) can never drift apart. Gemini must emit
// one of our three stored values so it can be saved verbatim.
export const AI_LISTING_CONDITIONS = CONDITIONS
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

// Optional context the seller already typed (FS-005 Inputs): the prompt treats it
// as ground truth to refine rather than discard.
export interface AIPromptContext {
  title?: string
  description?: string
}

// The prompt sent with every image set. `categoryNames` is interpolated so the
// model can only emit a category the seller actually has; `context` lets it
// refine the seller's already-typed title/description.
export const buildPrompt = (
  categoryNames: string[],
  context: AIPromptContext = {}
): string => {
  const typed = [
    context.title ? `Title: ${context.title}` : "",
    context.description ? `Description: ${context.description}` : "",
  ]
    .filter(Boolean)
    .join("\n")
  return `You are a product listing assistant. Return a STRICT JSON object matching the response schema for this used-item photo. title: a concise, searchable title (≤70 chars). description: 1–2 sentences. category: one of: ${categoryNames.join(", ")}. keywords: 1–5 tags. condition: one of: ${AI_LISTING_CONDITIONS.join(", ")}. quality_score: integer 0-100.${
    typed
      ? ` The seller already typed this optional context — keep its meaning, refine the wording, and do not contradict it:\n${typed}`
      : ""
  } Do NOT add prose, markdown, or fields outside the schema.`
}

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
