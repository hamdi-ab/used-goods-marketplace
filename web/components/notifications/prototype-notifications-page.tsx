import type { Metadata } from "next"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { fetchMyNotifications } from "@/lib/notifications"
import { SiteHeader } from "@/components/home/header"
import { SiteFooter } from "@/components/home/footer"
import { PrototypeNotificationsInbox } from "@/components/notifications/prototype-notifications-inbox"
import { Button } from "@/components/ui/button"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your marketplace notifications.",
}

// PROTOTYPE — notifications redesign, "Grouped Inbox": notifications are
// bucketed by time (Today / Yesterday / This week / Earlier), each type gets
// its own colored icon, and unread rows carry a blue accent + tint so what
// needs attention reads at a glance. Read/unread is LIVE (per-row "Mark read",
// "Mark all read", and "View" all mark read optimistically). Signed-out
// reviewers see the empty state.
export async function PrototypeNotificationsPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()
  const { notifications, error } = user
    ? await fetchMyNotifications(user.id)
    : { notifications: [], error: null }

  return (
    <>
      <SiteHeader variant={variant} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 px-4 py-16 text-center">
            <h2 className="font-heading text-lg font-semibold">
              Couldn&apos;t load your notifications
            </h2>
            <p className="mt-1 max-w-sm text-sm text-foreground/70">
              Something went wrong on our end. Please try again.
            </p>
            <Button asChild className="mt-4">
              <Link href={withVariant("/notifications", variant)}>
                Try again
              </Link>
            </Button>
          </div>
        ) : (
          <PrototypeNotificationsInbox
            variant={variant}
            notifications={notifications}
          />
        )}
      </main>
      <SiteFooter variant={variant} />
    </>
  )
}