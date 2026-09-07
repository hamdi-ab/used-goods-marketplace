import "server-only"

import { z } from "zod"

import type { Category } from "@/lib/listings/constants"
import { createClient } from "@/lib/supabase/server"
import { detectImageMime, validateImageFile } from "@/lib/media/primitives"
import {
  AI_LISTING_CONDITIONS,
  type AICondition,
  type AIListingResult,
  type AIListingSuggestion,
  type AIPromptContext,
  buildPrompt,
  buildResponseSchema,
} from "./constants"
import { GeminiFlashProvider } from "./provider"
import type { GeminiProvider } from "./provider"

async function aiRequestAllowed(): Promise<boolean> {
  const supabase = await createClient()
  const limit = Number(process.env.AI_RATE_LIMIT ?? 10)
  const { data, error } = await supabase.rpc("record_ai_request", {
    p_limit: Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10,
  })
  return !error && data?.allowed === true
}

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

export interface GenerateListingOptions {
  provider?: GeminiProvider
}

export async function generateListingSuggestions(
  photos: File[],
  categories: Category[],
  context: AIPromptContext = {},
  options: GenerateListingOptions = {}
): Promise<AIListingResult> {
  const provider = options.provider ?? new GeminiFlashProvider()

  const parts: { mimeType: string; data: string }[] = []
  for (const file of photos) {
    const invalid = await validateImageFile(file)
    if (invalid) {
      return { ok: false, reason: "degraded", message: invalid }
    }
    const mime = (await detectImageMime(file)) ?? ""
    parts.push(await toInlinePart(file, mime))
  }
  if (!parts.length) {
    return { ok: false, reason: "degraded", message: "No readable photos" }
  }

  const categoryNames = [...new Set(categories.map((c) => c.name))]
  if (!categoryNames.length) {
    return { ok: false, reason: "degraded", message: "No categories available" }
  }

  const rateAllowed = await aiRequestAllowed()
  if (!rateAllowed) {
    return {
      ok: false,
      reason: "rate_limited",
      message: "AI assist is busy right now — try again shortly",
    }
  }

  const result = await provider.generate<{
    title: string
    description: string
    category: string
    keywords: string[]
    condition: string
    quality_score: number
  }>(
    buildPrompt(categoryNames, context),
    parts,
    buildResponseSchema(categoryNames)
  )

  if (!result.ok) {
    return { ok: false, reason: result.reason, message: result.message }
  }

  const parsed = suggestionSchema(categoryNames).safeParse(result.data)
  if (!parsed.success) {
    return { ok: false, reason: "degraded", message: "AI request failed" }
  }

  const out = parsed.data
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
