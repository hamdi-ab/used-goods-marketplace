"use server"

import { generateListingSuggestions } from "@/lib/ai/listings"
import { recordAiUsage } from "@/lib/ai/telemetry"
import { requireSeller } from "@/lib/auth"
import type { AIListingResult, AIListingSuggestion } from "@/lib/ai/constants"
import type { Category } from "@/lib/listings/constants"

export interface AiSuggestionsState {
  ok?: boolean
  reason?: Extract<AIListingResult, { ok: false }>["reason"]
  message?: string
  suggestion?: AIListingSuggestion
}

/**
 * Server Action entry point for the "AI Assist" button in the create-listing
 * form. Reads uploaded photos + the live category list from FormData, delegates
 * to the Gemini seam (lib/ai/listings), and returns a typed state object. The
 * AI key never reaches the client — the action runs server-side, mirroring the
 * GenerateListingService → Gemini Provider flow (docs/05-backend §9).
 *
 * FS-005 analytics: the seller's already-typed title/description (optional
 * inputs) are forwarded to the prompt, and the interaction is recorded as
 * ai_used (first assist) or ai_regenerated (Regenerate).
 *
 * Auth + uploads (fix #69): the action requires seller auth before parsing
 * anything, so anonymous callers cannot consume Gemini quota; photo type /
 * magic bytes / size are validated in the AI seam before forwarding.
 */
export async function generateListingSuggestionsAction(
  _prevState: AiSuggestionsState,
  formData: FormData
): Promise<AiSuggestionsState> {
  await requireSeller()

  const files = (formData.getAll("photos") as File[]).filter(
    (f): f is File => f instanceof File
  )
  if (!files.length) {
    return { ok: false, reason: "degraded", message: "Add a photo first" }
  }

  let categories: Category[] = []
  const raw = formData.get("categories")
  if (typeof raw === "string" && raw) {
    try {
      categories = JSON.parse(raw) as Category[]
    } catch {
      categories = []
    }
  }

  const readText = (key: string): string | undefined => {
    const v = formData.get(key)
    return typeof v === "string" && v.trim() ? v : undefined
  }

  recordAiUsage(formData.get("ai_event") === "regenerate" ? "ai_regenerated" : "ai_used")

  const result: AIListingResult = await generateListingSuggestions(
    files,
    categories,
    { title: readText("title"), description: readText("description") }
  )
  if (result.ok) {
    return { ok: true, suggestion: result.suggestion }
  }
  return { ok: false, reason: result.reason, message: result.message }
}