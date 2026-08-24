"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { decideDispute, openDispute } from "@/lib/disputes"
import { uuidSchema } from "@/lib/uuid"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const decideSchema = z.object({
  disputeId: uuidSchema,
  resolution: z.enum(["refund_buyer", "pay_seller", "partial_refund", "no_action"]),
  adminNote: z.string().optional(),
})

export type DecideDisputeState = {
  message?: string
  ok?: boolean
}

export async function decideDisputeAction(
  _prevState: DecideDisputeState,
  formData: FormData
): Promise<DecideDisputeState> {
  const parsed = decideSchema.safeParse({
    disputeId: formValue(formData, "disputeId"),
    resolution: formValue(formData, "resolution"),
    adminNote: formValue(formData, "adminNote"),
  })

  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await decideDispute({
    disputeId: parsed.data.disputeId,
    resolution: parsed.data.resolution,
    adminNote: parsed.data.adminNote,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not decide dispute" }
  }

  revalidatePath("/admin/disputes")
  return { ok: true }
}

const openSchema = z.object({
  paymentId: uuidSchema,
  reason: z.enum(["not_received", "not_as_description", "damaged", "other"]),
  description: z.string().min(1, "Description is required"),
})

export type OpenDisputeState = {
  message?: string
  ok?: boolean
}

export async function openDisputeAction(
  _prevState: OpenDisputeState,
  formData: FormData
): Promise<OpenDisputeState> {
  const parsed = openSchema.safeParse({
    paymentId: formValue(formData, "paymentId"),
    reason: formValue(formData, "reason"),
    description: formValue(formData, "description"),
  })

  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await openDispute({
    paymentId: parsed.data.paymentId,
    reason: parsed.data.reason,
    description: parsed.data.description,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not open dispute" }
  }

  revalidatePath("/offers")
  return { ok: true }
}
