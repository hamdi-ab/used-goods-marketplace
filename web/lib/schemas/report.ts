import { z } from "zod"

import { uuidSchema } from "@/lib/uuid"
import { REPORT_NOTE_MAX, submitReportSchema } from "@/lib/reports"

export { submitReportSchema }

export const resolveReportSchema = z.object({
  reportId: uuidSchema,
  action: z.enum(["remove_listing", "block_seller", "reject"]),
  adminNote: z
    .string()
    .max(REPORT_NOTE_MAX, `Keep the note under ${REPORT_NOTE_MAX} characters`)
    .optional(),
})

export type ResolveReportInput = z.infer<typeof resolveReportSchema>

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

export function parseSubmitReportForm(formData: FormData): Record<string, unknown> {
  return {
    listingId: formValue(formData, "listingId"),
    sellerId: formValue(formData, "sellerId"),
    reason: formValue(formData, "reason"),
    note: formValue(formData, "note"),
  }
}

export function parseResolveReportForm(formData: FormData): Record<string, unknown> {
  return {
    reportId: formValue(formData, "reportId"),
    action: formValue(formData, "action"),
    adminNote: formValue(formData, "adminNote"),
  }
}
