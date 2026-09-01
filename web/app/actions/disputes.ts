"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { appealDispute, decideDispute, openDispute } from "@/lib/disputes"
import { createNotification } from "@/lib/notifications"
import { createClient } from "@/lib/supabase/server"
import { uuidSchema } from "@/lib/uuid"
import { formValue } from "@/lib/form-value"
import { disputeEvidenceAdapter } from "@/lib/media/dispute-evidence-adapter"
import { uploadObjects } from "@/lib/media"
import { requireAdmin, requireUser } from "@/lib/auth"

const decideSchema = z.object({
  disputeId: uuidSchema,
  resolution: z.enum(["refund_buyer", "pay_seller"]),
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

  // Security: only admins can decide disputes
  try {
    await requireAdmin()
  } catch {
    return { message: "Unauthorized" }
  }

  const result = await decideDispute({
    disputeId: parsed.data.disputeId,
    resolution: parsed.data.resolution,
    adminNote: parsed.data.adminNote,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not decide dispute" }
  }

  // Notify both buyer and seller about the dispute resolution
  const resolutionLabel = parsed.data.resolution === "refund_buyer" ? "Refund approved" : "Payment released to seller"
  const supabase = await createClient()
  const { data: dispute } = await supabase
    .from("disputes")
    .select("payment:payments!disputes_payment_id_fkey(buyer_id, seller_id)")
    .eq("id", parsed.data.disputeId)
    .maybeSingle()
  const payment = (dispute as unknown as { payment: { buyer_id: string; seller_id: string }[] })?.payment?.[0]
  const note = parsed.data.adminNote ?? "Your dispute has been reviewed and resolved."

  if (payment?.buyer_id) {
    await createNotification({
      userId: payment.buyer_id,
      type: "dispute_resolved",
      title: `Dispute resolved: ${resolutionLabel}`,
      body: note,
      metadata: { dispute_id: parsed.data.disputeId },
    })
  }
  if (payment?.seller_id) {
    await createNotification({
      userId: payment.seller_id,
      type: "dispute_resolved",
      title: `Dispute resolved: ${resolutionLabel}`,
      body: note,
      metadata: { dispute_id: parsed.data.disputeId },
    })
  }

  revalidatePath("/admin/disputes")
  return { ok: true }
}

const openSchema = z.object({
  paymentId: uuidSchema,
  reason: z.enum(["not_received", "not_as_description"]),
  description: z.string().min(1, "Description is required"),
  evidenceUrls: z.array(z.string()).default([]),
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
    evidenceUrls: [],
  })

  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await openDispute({
    paymentId: parsed.data.paymentId,
    reason: parsed.data.reason,
    description: parsed.data.description,
    evidenceUrls: parsed.data.evidenceUrls,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not open dispute" }
  }

  // Notify admins about new dispute
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
  if (admins) {
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "dispute_opened",
        title: "New dispute opened",
        body: `Reason: ${parsed.data.reason.replace(/_/g, " ")}`,
        metadata: { payment_id: parsed.data.paymentId },
      })
    }
  }

  revalidatePath("/offers")
  revalidatePath("/admin/disputes")
  return { ok: true }
}

const evidenceSchema = z.object({
  paymentId: uuidSchema,
  files: z.array(z.instanceof(File)).min(1),
})

export type UploadEvidenceState = {
  urls?: string[]
  message?: string
  ok?: boolean
}

export async function uploadEvidence(
  paymentId: string,
  files: File[]
): Promise<{ ok: boolean; urls: string[]; error?: string }> {
  const parsed = evidenceSchema.safeParse({ paymentId, files })
  if (!parsed.success) {
    return { ok: false, urls: [], error: "Invalid request" }
  }

  const user = await requireUser()
  const supabase = await createClient()
  const adapter = disputeEvidenceAdapter({
    uid: user.id,
    disputeId: parsed.data.paymentId,
    supabase,
  })

  const result = await uploadObjects(
    parsed.data.files.map((file, index) => ({ file, index })),
    adapter,
    supabase
  )

  if (!result.ok) {
    return { ok: false, urls: [], error: result.error }
  }

  return { ok: true, urls: result.publicUrls }
}

const appealSchema = z.object({
  disputeId: uuidSchema,
  appealNote: z.string().min(1, "Please explain your appeal"),
  appealEvidenceUrls: z.array(z.string()).default([]),
})

export type AppealDisputeState = {
  message?: string
  ok?: boolean
}

export async function appealDisputeAction(
  _prevState: AppealDisputeState,
  formData: FormData
): Promise<AppealDisputeState> {
  const parsed = appealSchema.safeParse({
    disputeId: formValue(formData, "disputeId"),
    appealNote: formValue(formData, "appealNote"),
    appealEvidenceUrls: [],
  })

  if (!parsed.success) {
    return { message: "Invalid request" }
  }

  const result = await appealDispute({
    disputeId: parsed.data.disputeId,
    appealNote: parsed.data.appealNote,
    appealEvidenceUrls: parsed.data.appealEvidenceUrls,
  })

  if (!result.ok) {
    return { message: result.error ?? "Could not submit appeal" }
  }

  // Notify admins about the appeal
  const supabase = await createClient()
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
  if (admins) {
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: "dispute_appealed",
        title: "Dispute appealed",
        body: parsed.data.appealNote.slice(0, 100),
        metadata: { dispute_id: parsed.data.disputeId },
      })
    }
  }

  revalidatePath("/offers")
  revalidatePath("/admin/disputes")
  return { ok: true }
}
