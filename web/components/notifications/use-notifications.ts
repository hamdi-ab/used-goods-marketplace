"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { createClient } from "@/lib/supabase/client"
import {
  NOTIFICATION_POLL_MS,
  type NotificationType,
} from "@/lib/notifications/constants"

interface LatestNotification {
  id: string
  type: NotificationType
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

const LATEST_COLUMNS = "id, type, title, body, is_read, created_at"

/**
 * Client-side notification state (fix #72): exact unread count for the header
 * badge + a sonner toast when a new notification lands. Local Supabase has
 * realtime disabled, so this polls at NOTIFICATION_POLL_MS instead of
 * subscribing; the first poll seeds the baseline so a toast only fires for
 * rows that arrive afterwards. Runs anywhere the header is mounted (the bell).
 */
export function useNotifications(): { unreadCount: number } {
  const { user } = useAuth()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenId = useRef<string | null>(null)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (!user) {
      // The bell unmounts when there is no session (NotificationBell returns
      // null), so the count resets on remount; only the poll baseline refs
      // need clearing here.
      lastSeenId.current = null
      bootstrapped.current = false
      return
    }

    const supabase = createClient()
    const userId = user.id
    let cancelled = false

    async function poll() {
      const [latestRes, countRes] = await Promise.all([
        supabase
          .from("notifications")
          .select(LATEST_COLUMNS)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("is_read", false),
      ])
      if (cancelled) return

      if (countRes.count !== null) setUnreadCount(countRes.count)

      const rows = (latestRes.data ?? []) as unknown as LatestNotification[]
      const newest = rows[0]
      if (!newest) return

      if (!bootstrapped.current) {
        bootstrapped.current = true
        lastSeenId.current = newest.id
        return
      }
      if (newest.id !== lastSeenId.current) {
        lastSeenId.current = newest.id
        toast(newest.title, {
          description: newest.body ?? undefined,
          action: {
            label: "View",
            onClick: () => router.push("/notifications"),
          },
        })
      }
    }

    void poll()
    const interval = setInterval(() => void poll(), NOTIFICATION_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [user, router])

  return { unreadCount }
}