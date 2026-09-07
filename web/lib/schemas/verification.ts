import { z } from "zod"

import { uuidSchema } from "@/lib/uuid"
import {
  SELF_SERVE_TYPES,
  VERIFICATION_NOTES_MAX,
  VERIFICATION_TYPES,
} from "@/lib/verifications/constants"

export const requestVerificationSchema = z.object({
  type: z.enum(SELF_SERVE_TYPES),
})

export const recordVerificationSchema = z.object({
  userId: uuidSchema,
  type: z.enum(VERIFICATION_TYPES),
  status: z.enum(["verified", "rejected"]),
  notes: z
    .string()
    .max(
      VERIFICATION_NOTES_MAX,
      `Keep the note under ${VERIFICATION_NOTES_MAX} characters`
    )
    .optional(),
})

export type RequestVerificationInput = z.infer<typeof requestVerificationSchema>
export type RecordVerificationInput = z.infer<typeof recordVerificationSchema>

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

export function parseRequestVerificationForm(
  formData: FormData
): Record<string, unknown> {
  return {
    type: formValue(formData, "type"),
  }
}

export function parseRecordVerificationForm(
  formData: FormData
): Record<string, unknown> {
  return {
    userId: formValue(formData, "userId"),
    type: formValue(formData, "type"),
    status: formValue(formData, "status"),
    notes: formValue(formData, "notes"),
  }
}
