import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import {
  BadgeDollarSignIcon,
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
  ShieldCheckIcon,
  StarIcon,
} from "lucide-react"

import { getCurrentUser } from "@/lib/auth"
import { fetchMyNotifications } from "@/lib/notifications"
import type { NotificationRow } from "@/lib/notifications"
import {
  NOTIFICATION_TYPE_LABELS,
  notificationHref,
  type NotificationType,
} from "@/lib/notifications/constants"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your marketplace notifications.",
}

const TYPE_STYLE: Record<NotificationType, { icon: ReactNode; chip: string }> = {
  offer_received: {
    icon: <BadgeDollarSignIcon className="size-5" />,
    chip: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  offer_accepted: {
    icon: <CheckCircle2Icon className="size-5" />,
    chip: "bg-emerald-100 text-emerald-700",
  },
  review_received: {
    icon: <StarIcon className="size-5" />,
    chip: "bg-amber-100 text-amber-700",
  },
  report_resolved: {
    icon: <ShieldCheckIcon className="size-5" />,
    chip: "bg-violet-100 text-violet-700",
  },
}

const DAY_MS = 24 * 3600 * 1000

function bucketKey(date: Date, now: Date): string {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const ts = date.getTime()
  if (ts >= todayStart) return "Today"
  if (ts >= todayStart - DAY_MS) return "Yesterday"
  if (ts >= todayStart - 7 * DAY_MS) return "This week"
  return "Earlier"
}

function rowTime(date: Date, bucket: string): string {
  if (bucket === "Today") {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// PROTOTYPE — notifications redesign, "Grouped Inbox": notifications are
// bucketed by time (Today / Yesterday / This week / Earlier), each type gets
// its own colored icon, and unread rows carry a blue accent + tint so what
// needs attention reads at a glance. View-only during review: signed-out
// reviewers see the empty state and nothing can be marked read.
export async function PrototypeNotificationsPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()
  const notifications = user ? await fetchMyNotifications(user.id) : []
  const unreadCount = notifications.filter((n) => !n.is_read).length
  const now = new Date()

  const buckets = new Map<string, NotificationRow[]>()
  for (const n of notifications) {
    const key = bucketKey(new Date(n.created_at), now)
    const list = buckets.get(key) ?? []
    list.push(n)
    buckets.set(key, list)
  }

  const emptyState = (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-3 rounded-2xl border px-4 py-20 text-center",
        variant === "B"
          ? "border-[#2563EB]/30 bg-[#EEF4FF]"
          : "border-border bg-muted/30"
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <BellIcon className="size-6 text-muted-foreground/70" />
      </div>
      <h2 className="font-heading text-lg font-semibold">No notifications yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        New offers, accepted offers, reviews, and report updates will show up
        here.
      </p>
      <Link
        href={withVariant("/browse", variant)}
        className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Browse listings
      </Link>
    </div>
  )

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Notifications
            </h1>
            {notifications.length > 0 ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  variant === "B"
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {unreadCount === 0 ? "All read" : `${unreadCount} unread`}
              </span>
            ) : null}
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Prototype preview — nothing is marked read yet"
            >
              <CheckIcon className="mr-1.5 size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          emptyState
        ) : (
          <div className="flex flex-col gap-8">
            {[...buckets.entries()].map(([bucket, rows]) => (
              <section key={bucket}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {bucket}
                </h2>
                <ul className="flex flex-col gap-3">
                  {rows.map((n) => {
                    const style = TYPE_STYLE[n.type]
                    const href = notificationHref(n.type, n.metadata)
                    return (
                      <li
                        key={n.id}
                        className={cn(
                          "relative rounded-2xl border bg-card p-4 shadow-sm transition",
                          !n.is_read &&
                            (variant === "B"
                              ? "border-[#2563EB]/40 bg-[#EEF4FF]/60"
                              : "border-primary/30 bg-primary/5")
                        )}
                      >
                        {!n.is_read ? (
                          <span
                            className="absolute right-3.5 top-3.5 size-2 rounded-full bg-[#2563EB]"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="flex items-start gap-4">
                          <span
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-full",
                              style.chip
                            )}
                          >
                            {style.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={cn(
                                  "truncate text-sm",
                                  n.is_read
                                    ? "font-medium text-foreground"
                                    : "font-semibold text-foreground"
                                )}
                              >
                                {n.title}
                              </p>
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                {NOTIFICATION_TYPE_LABELS[n.type]}
                              </span>
                            </div>
                            {n.body ? (
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {n.body}
                              </p>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground/80">
                              {rowTime(new Date(n.created_at), bucket)}
                            </p>
                          </div>
                          {href ? (
                            <Link
                              href={withVariant(href, variant)}
                              className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-[#2563EB] hover:bg-[#2563EB]/10"
                            >
                              View
                            </Link>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <PrototypeFooter variant={variant} />
    </>
  )
}