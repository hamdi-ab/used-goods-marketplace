"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireTrader } from "@/lib/auth"
import { consumeRateBudget } from "@/lib/rate-limit"
import { appealReviewRemoval, resolveReviewAppeal } from "@/lib/appeals"
import { uuidSchema } from "@/lib/uuid"

const submitAppealSchema = z.object({
  reviewId: uuidSchema,
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(1000, "Reason must be under 1000 characters"),
})

const resolveAppealSchema = z.object({
  appealId: uuidSchema,
  action: z.enum(["approve", "deny"]),
  adminNote: z
    .string()
    .max(1000, "Admin note must be under 1000 characters")
    .optional(),
})

export type SubmitAppealState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export async function submitReviewAppeal(
  _prevState: SubmitAppealState,
  formData: FormData
): Promise<SubmitAppealState> {
  const parsed = submitAppealSchema.safeParse({
    reviewId: formData.get("reviewId"),
    reason: formData.get("reason"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await requireTrader()

  const budget = await consumeRateBudget()
  if (!budget.ok) {
    return { message: budget.message }
  }

  const result = await appealReviewRemoval(parsed.data.reviewId, parsed.data.reason)

  if (!result.ok) {
    return { message: result.error ?? "Could not submit appeal" }
  }

  revalidatePath("/activity")
  revalidatePath("/dashboard")
  return { ok: true }
}

export type ResolveAppealState = {
  message?: string
  ok?: boolean
  resolvedId?: string
}

export async function adminResolveReviewAppeal(
  _prevState: ResolveAppealState,
  formData: FormData
): Promise<ResolveAppealState> {
  const parsed = resolveAppealSchema.safeParse({
    appealId: formData.get("appealId"),
    action: formData.get("action"),
    adminNote: formData.get("adminNote") || undefined,
  })

  if (!parsed.success) {
    return { message: "Invalid appeal resolution request" }
  }

  await requireAdmin()

  const result = await resolveReviewAppeal(
    parsed.data.appealId,
    parsed.data.action,
    parsed.data.adminNote ?? null
  )

  if (!result.ok) {
    return { message: result.error ?? "Could not resolve appeal" }
  }

  revalidatePath("/admin/reports")
  revalidatePath("/dashboard")
  return { ok: true, resolvedId: parsed.data.appealId }
}
