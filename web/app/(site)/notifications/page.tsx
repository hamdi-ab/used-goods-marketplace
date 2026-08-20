import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { fetchMyNotifications } from "@/lib/notifications"
import { NotificationList } from "@/components/notifications/notification-list"
import { PrototypeNotificationsPage } from "@/components/notifications/prototype-notifications-page"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your marketplace notifications.",
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = variant === "A" || variant === "B" ? (variant as "A" | "B") : null

  // PROTOTYPE — the redesign variant is view-only during review and bypasses
  // the auth redirect (see proxy.ts) so ?variant=A|B renders without a session.
  if (key) {
    return <PrototypeNotificationsPage variant={key} />
  }

  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const notifications = await fetchMyNotifications(user.id)

  return <NotificationList notifications={notifications} />
}