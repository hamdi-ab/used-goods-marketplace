"use server"

import { generateListingSuggestions } from "@/lib/ai/listings"
import type { AIListingResult, AIListingSuggestion } from "@/lib/ai/constants"
import type { Category } from "@/lib/listings/constants"

export interface AiSuggestionsState {
  ok?: boolean
  reason?: "unavailable" | "rate_limited" | "degraded"
  message?: string
  suggestion?: AIListingSuggestion
}

/**
 * Server Action entry point for the "AI Assist" button in the create-listing
 * form. Reads uploaded photos + the live category list from FormData, delegates
 * to the Gemini seam (lib/ai/listings), and returns a typed state object. The
 * AI key never reaches the client — the action runs server-side, mirroring the
 * GenerateListingService → Gemini Provider flow (docs/05-backend §9).
 */
export async function generateListingSuggestionsAction(
  _prevState: AiSuggestionsState,
  formData: FormData
): Promise<AiSuggestionsState> {
  const files = (formData.getAll("photos") as File[]).filter(
    (f): f is File => f instanceof File && f.size > 0
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

  const result: AIListingResult = await generateListingSuggestions(files, categories)
  if (result.ok) {
    return { ok: true, suggestion: result.suggestion }
  }
  return { ok: false, reason: result.reason, message: result.message }
}
