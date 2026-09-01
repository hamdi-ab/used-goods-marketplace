"use server"

import { generateListingSuggestions } from "@/lib/ai/listings"
import { recordAiUsage } from "@/lib/ai/telemetry"
import { consumeAiGeneration, countAiGenerationsThisMonth } from "@/lib/ai/quota"
import {
  AI_LIMIT_MESSAGE,
  aiLimit,
  isAtCap,
} from "@/lib/plans/constants"
import { requireSeller } from "@/lib/auth"
import { fetchSellerTier } from "@/lib/usage"
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
 * T25 (map #54): a monthly AI quota is enforced here. The seller's tier sets the
 * cap (T24); usage is counted server-side before the provider is called, so the
 * §26 message short-circuits a wasted call when the cap is hit. A credit is
 * consumed only on a valid draft (Generate/Regenerate with ok:true); failures
 * and Apply consume nothing and the month resets automatically on the 1st.
 */
export async function generateListingSuggestionsAction(
  _prevState: AiSuggestionsState,
  formData: FormData
): Promise<AiSuggestionsState> {
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

  const isRegenerate = formData.get("ai_event") === "regenerate"
  const aiEvent: "generate" | "regenerate" = isRegenerate ? "regenerate" : "generate"

  recordAiUsage(isRegenerate ? "ai_regenerated" : "ai_used")

  // T25: enforce the monthly AI quota before calling the provider.
  const user = await requireSeller()
  const tier = await fetchSellerTier(user.id)
  const limit = aiLimit(tier)
  const used = await countAiGenerationsThisMonth()
  if (isAtCap(used, limit)) {
    return {
      ok: false,
      message: AI_LIMIT_MESSAGE,
    }
  }

  const result: AIListingResult = await generateListingSuggestions(
    files,
    categories,
    { title: readText("title"), description: readText("description") }
  )
  if (result.ok) {
    // Consume one credit only on a successfully generated draft. `limit` is
    // null for the uncapped Business tier — the RPC records without capping.
    await consumeAiGeneration(aiEvent, limit)
    return { ok: true, suggestion: result.suggestion }
  }
  return { ok: false, reason: result.reason, message: result.message }
}
