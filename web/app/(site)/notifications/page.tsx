import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { fetchMyNotifications } from "@/lib/notifications"
import { NotificationList } from "@/components/notifications/notification-list"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your marketplace notifications.",
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const { notifications } = await fetchMyNotifications(user.id)

  return <NotificationList notifications={notifications} />
}

