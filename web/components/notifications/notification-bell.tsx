"use client"

import Link from "next/link"
import { BellIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useNotifications } from "@/components/notifications/use-notifications"
import { Button } from "@/components/ui/button"

/**
 * Header bell with an unread-count badge (fix #72). Hosts the useNotifications
 * hook so toasts fire wherever the header is mounted. Admins are
 * moderation-only (ADR-020) and don't trade, so the bell stays trader-side.
 */
export function NotificationBell() {
  const { user, role, loading } = useAuth()
  const { unreadCount } = useNotifications()

  if (loading || !user || role === "admin") return null

  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      className="relative text-muted-foreground hover:text-foreground"
    >
      <Link href="/notifications">
        <BellIcon className="size-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>
    </Button>
  )
}