"use server"

import { z } from "zod"

import { requireTrader } from "@/lib/auth"
import {
  recordContactAttempt,
  fetchSellerContactInfo,
  isContactMethodAvailable,
  buildContactUrl,
} from "@/lib/contact"
import { CONTACT_METHODS } from "@/lib/contact/constants"
import { uuidSchema } from "@/lib/uuid"
import type { ContactMethod } from "@/lib/contact/constants"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const recordContactSchema = z.object({
  listingId: uuidSchema.optional(),
  sellerId: uuidSchema,
  contactMethod: z.enum(CONTACT_METHODS),
})

export type RecordContactState = {
  errors?: Record<string, string[] | undefined>
  message?: string
  ok?: boolean
  url?: string | null
}

export async function recordContact(
  _prevState: RecordContactState,
  formData: FormData
): Promise<RecordContactState> {
  const parsed = recordContactSchema.safeParse({
    listingId: formValue(formData, "listingId"),
    sellerId: formValue(formData, "sellerId"),
    contactMethod: formValue(formData, "contactMethod"),
  })

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  // Require a signed-in trader session before recording (Privacy, AC4). The RPC
  // itself resolves the reporter from auth.uid(). The contact *read* is served
  // to admins server-side on the listing/user pages (ADR-020 §1); only this
  // write is trader-gated.
  await requireTrader()

  // Fetch the contact info so we can build the right URL and enforce the
  // phone opt-in guard server-side (Privacy, AC4).
  const info = await fetchSellerContactInfo(parsed.data.sellerId)
  if (!info) {
    return { message: "Seller not found" }
  }

  const method = parsed.data.contactMethod as ContactMethod
  if (!isContactMethodAvailable(info, method)) {
    return { message: "This contact method is not available for this seller" }
  }

  const url = buildContactUrl(method, info)

  // Record the contact attempt (AC3). Failures here are non-fatal: we still
  // return the URL so the buyer can contact the seller even if the audit log
  // write fails.
  const result = await recordContactAttempt({
    contactMethod: method,
    listingId: parsed.data.listingId,
    sellerId: parsed.data.sellerId,
  })

  if (!result.ok) {
    console.warn("recordContact: contact attempt not logged:", result.error)
  }

  return { ok: true, url }
}
