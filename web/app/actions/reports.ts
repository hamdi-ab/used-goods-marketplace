"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireAdmin, requireUser } from "@/lib/auth"
import {
  createReport as createReportRow,
  resolveReport as resolveReportRow,
  REPORT_REASONS,
  REPORT_NOTE_MAX,
} from "@/lib/reports"
import { uuidSchema } from "@/lib/uuid"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const submitReportSchema = z.object({
  listingId: uuidSchema.optional(),
  sellerId: uuidSchema.optional(),
  reason: z.enum(REPORT_REASONS),
  note: z
    .string()
    .max(REPORT_NOTE_MAX, `Keep the note under ${REPORT_NOTE_MAX} characters`)
    .optional(),
}).refine(
  (data) => {
    const hasListing = data.listingId !== undefined && data.listingId !== null
    const hasSeller = data.sellerId !== undefined && data.sellerId !== null
    return hasListing || hasSeller
  },
  { message: "A report must target a listing or a seller" }
)

export type SubmitReportState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
}

export async function submitReport(
  _prevState: SubmitReportState,
  formData: FormData
): Promise<SubmitReportState> {
  const parsed = submitReportSchema.safeParse({
    listingId: formValue(formData, "listingId"),
    sellerId: formValue(formData, "sellerId"),
    reason: formValue(formData, "reason"),
    note: formValue(formData, "note"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  // Gate on a signed-in session before reaching the RPC; the RPC itself
  // resolves the reporter from auth.uid() and enforces rate limiting.
  await requireUser()

  const result = await createReportRow({
    listingId: parsed.data.listingId ?? null,
    sellerId: parsed.data.sellerId ?? null,
    reason: parsed.data.reason,
    note: parsed.data.note ?? null,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not submit your report" }
  }

  return { ok: true }
}

const resolveSchema = z.object({
  reportId: uuidSchema,
  action: z.enum(["remove_listing", "block_seller", "reject"]),
  adminNote: z
    .string()
    .max(REPORT_NOTE_MAX, `Keep the note under ${REPORT_NOTE_MAX} characters`)
    .optional(),
})

export type ResolveReportState = {
  message?: string
  ok?: boolean
  resolvedId?: string
}

export async function adminResolveReport(
  _prevState: ResolveReportState,
  formData: FormData
): Promise<ResolveReportState> {
  const parsed = resolveSchema.safeParse({
    reportId: formValue(formData, "reportId"),
    action: formValue(formData, "action"),
    adminNote: formValue(formData, "adminNote"),
  })

  if (!parsed.success) {
    return { message: "Invalid report request" }
  }

  await requireAdmin()

  const result = await resolveReportRow(
    parsed.data.reportId,
    parsed.data.action,
    parsed.data.adminNote ?? null
  )

  if (!result.ok) {
    return { message: result.error ?? "Could not resolve the report" }
  }

  revalidatePath("/admin/reports")
  revalidatePath("/dashboard")
  return { ok: true, resolvedId: parsed.data.reportId }
}
