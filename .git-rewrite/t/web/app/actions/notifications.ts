"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import {
  markAllNotificationsRead as markAllNotificationsReadRow,
  markNotificationsRead as markNotificationsReadRow,
} from "@/lib/notifications"
import { uuidSchema } from "@/lib/uuid"

const idsSchema = z.object({ ids: z.array(uuidSchema).min(1).max(100) })

export type MarkReadState = {
  message?: string
  ok?: boolean
}

/**
 * Mark the given notifications read (API spec §14 PATCH /notifications/{id}).
 * The inbox submits one form per row carrying a hidden `id`; the RLS update
 * policy restricts the write to the caller's own rows.
 */
export async function markNotificationsRead(
  _prevState: MarkReadState,
  formData: FormData
): Promise<MarkReadState> {
  const ids = formData
    .getAll("id")
    .filter((value): value is string => typeof value === "string")
  const parsed = idsSchema.safeParse({ ids })
  if (!parsed.success) {
    return { message: "Invalid notification selection" }
  }

  const user = await requireUser()

  const result = await markNotificationsReadRow(user.id, parsed.data.ids)
  if (!result.ok) {
    return { message: result.error ?? "Could not update your notifications" }
  }

  revalidatePath("/notifications")
  return { ok: true }
}

/**
 * Mark every unread notification as read. Revalidation clears the unread state
 * on the inbox; the header badge catches up on its next poll.
 */
export async function markAllNotificationsRead(
  _prevState: MarkReadState,
  formData: FormData
): Promise<MarkReadState> {
  // (prevState, formData) is the useActionState contract; nothing is read
  // from the form for this action, so consume the param for the linter.
  void formData
  const user = await requireUser()

  const result = await markAllNotificationsReadRow(user.id)
  if (!result.ok) {
    return { message: result.error ?? "Could not update your notifications" }
  }

  revalidatePath("/notifications")
  return { ok: true }
}