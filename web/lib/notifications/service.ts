import "server-only"

import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { NOTIFICATION_MAX_ITEMS } from "./constants"
import type { NotificationType } from "./constants"

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

export async function fetchInbox(
  userId: string,
  client?: SupabaseClient
): Promise<{ notifications: NotificationRow[]; error: string | null }> {
  const supabase = client ?? (await createClient())

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_MAX_ITEMS)

  if (error) {
    console.error("fetchInbox:", error.message)
    return { notifications: [], error: error.message }
  }

  return { notifications: (data ?? []) as unknown as NotificationRow[], error: null }
}

export async function fetchUnreadCount(
  userId: string,
  client?: SupabaseClient
): Promise<number> {
  const supabase = client ?? (await createClient())

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("fetchUnreadCount:", error.message)
    return 0
  }
  return count ?? 0
}

export interface MarkReadResult {
  ok: boolean
  error: string | null
}

export async function markRead(
  userId: string,
  ids: string[],
  client?: SupabaseClient
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

export async function markAllRead(
  userId: string,
  client?: SupabaseClient
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

export interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  metadata?: Record<string, string | number | null>
}

export async function createNotification(
  params: CreateNotificationParams,
  client?: SupabaseClient
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = client ?? (await createClient())

  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    metadata: params.metadata ?? {},
    is_read: false,
  })

  if (error) {
    console.error("createNotification:", error.message)
    return { ok: false, error: error.message }
  }
  return { ok: true, error: null }
}
