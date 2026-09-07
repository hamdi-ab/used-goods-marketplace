import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"
import type { NotificationType } from "./notifications/constants"
import { NOTIFICATION_MAX_ITEMS } from "./notifications/constants"

// Re-export the pure value objects so imports from "@/lib/notifications" keep
// resolving, mirroring the @/lib/reports seam convention.
export * from "./notifications/constants"

export interface NotificationRow {
  id: string
  type: NotificationType
  title: string
  body: string | null
  is_read: boolean
  metadata: Record<string, string | number | null>
  created_at: string
}

const NOTIFICATION_COLUMNS = "id, type, title, body, is_read, metadata, created_at"

// ---- Reads ----

/**
 * The signed-in user's inbox, newest first, capped at NOTIFICATION_MAX_ITEMS.
 * RLS restricts the query to the caller's own rows.
 */
export async function fetchMyNotifications(
  userId: string,
  client?: Supabase
): Promise<{ notifications: NotificationRow[]; error: string | null }> {
  const supabase = client ?? (await createClient())

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_MAX_ITEMS)

  if (error) {
    console.error("fetchMyNotifications:", error.message)
    return { notifications: [], error: error.message }
  }

  return { notifications: (data ?? []) as unknown as NotificationRow[], error: null }
}

/** Unread count for the header badge (head-only COUNT query). */
export async function fetchUnreadNotificationsCount(
  userId: string,
  client?: Supabase
): Promise<number> {
  const supabase = client ?? (await createClient())

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("fetchUnreadNotificationsCount:", error.message)
    return 0
  }
  return count ?? 0
}

// ---- Writes ----

export interface MarkReadResult {
  ok: boolean
  error: string | null
}

/**
 * Mark a set of the user's notifications read (idempotent: only unread rows
 * are touched; the RLS update policy already scopes to the caller's own rows,
 * and the explicit user_id filter keeps it unambiguous for tests).
 */
export async function markNotificationsRead(
  userId: string,
  ids: string[],
  client?: Supabase
): Promise<MarkReadResult> {
  if (ids.length === 0) return { ok: true, error: null }
  const supabase = client ?? (await createClient())

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .in("id", ids)
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

/** Mark every unread notification for the user as read. */
export async function markAllNotificationsRead(
  userId: string,
  client?: Supabase
): Promise<MarkReadResult> {
  const supabase = client ?? (await createClient())

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}