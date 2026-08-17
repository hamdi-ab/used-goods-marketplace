"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth"
import { uuidSchema } from "@/lib/uuid"
import {
  suspendUserRow,
  removeListingRow,
} from "@/lib/admin"

function formValue(formData: FormData, key: string): string | undefined {
  const v = formData.get(key)
  return typeof v === "string" && v.length > 0 ? v : undefined
}

const adminIdSchema = z.object({ id: uuidSchema })

export type AdminWriteState = {
  message?: string
  ok?: boolean
}

export async function adminSuspendUser(
  _prevState: AdminWriteState,
  formData: FormData
): Promise<AdminWriteState> {
  const parsed = adminIdSchema.safeParse({ id: formValue(formData, "userId") })
  if (!parsed.success) {
    return { message: "Invalid user id" }
  }

  await requireAdmin()

  const result = await suspendUserRow(parsed.data.id)
  if (!result.ok) {
    return { message: result.error ?? "Could not suspend the user" }
  }

  revalidatePath("/admin/users")
  revalidatePath("/admin")
  return { ok: true }
}

export async function adminRemoveListing(
  _prevState: AdminWriteState,
  formData: FormData
): Promise<AdminWriteState> {
  const parsed = adminIdSchema.safeParse({ id: formValue(formData, "listingId") })
  if (!parsed.success) {
    return { message: "Invalid listing id" }
  }

  await requireAdmin()

  const result = await removeListingRow(parsed.data.id)
  if (!result.ok) {
    return { message: result.error ?? "Could not remove the listing" }
  }

  revalidatePath("/admin/listings")
  revalidatePath("/admin")
  return { ok: true }
}
