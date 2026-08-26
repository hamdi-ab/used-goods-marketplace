"use client"

import { useState, useTransition, type ReactNode } from "react"
import Link from "next/link"
import {
  BadgeDollarSignIcon,
  BellIcon,
  CheckCircle2Icon,
  CheckIcon,
  ShieldCheckIcon,
  StarIcon,
} from "lucide-react"

import {
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/app/actions/notifications"
import type { NotificationRow } from "@/lib/notifications"
import {
  NOTIFICATION_TYPE_LABELS,
  notificationHref,
  type NotificationType,
} from "@/lib/notifications/constants"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type FilterKey = "all" | "offers" | "reviews" | "reports" | "disputes"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "offers", label: "Offers" },
  { key: "reviews", label: "Reviews" },
  { key: "reports", label: "Reports" },
  { key: "disputes", label: "Disputes" },
]

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "notifications",
  offers: "offer notifications",
  reviews: "review notifications",
  reports: "report notifications",
  disputes: "dispute notifications",
}

function matchesFilter(type: NotificationType, filter: FilterKey): boolean {
  if (filter === "all") return true
  if (filter === "offers")
    return type === "offer_received" || type === "offer_accepted"
  if (filter === "reviews") return type === "review_received"
  if (filter === "disputes")
    return type === "dispute_opened" || type === "dispute_resolved"
  return type === "report_resolved"
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
    chip: "bg-sky-100 text-sky-700",
  },
  offer_declined: {
    icon: <BadgeDollarSignIcon className="size-5" />,
    chip: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  offer_countered: {
    icon: <BadgeDollarSignIcon className="size-5" />,
    chip: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  offer_counter_accepted: {
    icon: <CheckCircle2Icon className="size-5" />,
    chip: "bg-emerald-100 text-emerald-700",
  },
  offer_counter_declined: {
    icon: <BadgeDollarSignIcon className="size-5" />,
    chip: "bg-[#2563EB]/10 text-[#2563EB]",
  },
  business_lead: {
    icon: <StarIcon className="size-5" />,
    chip: "bg-amber-100 text-amber-700",
  },
  dispute_opened: {
    icon: <BellIcon className="size-5" />,
    chip: "bg-red-100 text-red-700",
  },
  dispute_resolved: {
    icon: <ShieldCheckIcon className="size-5" />,
    chip: "bg-emerald-100 text-emerald-700",
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
  if (bucket !== "Earlier") {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotificationList({
  notifications,
}: {
  notifications: NotificationRow[]
}) {
  const [rows, setRows] = useState(notifications)
  const [filter, setFilter] = useState<FilterKey>("all")
  const [, startTransition] = useTransition()

  const [prevRows, setPrevRows] = useState(notifications)
  if (prevRows !== notifications) {
    setPrevRows(notifications)
    setRows(notifications)
  }

  const unreadCount = rows.filter((n) => !n.is_read).length

  const handleMarkRead = (id: string) => {
    setRows((cur) => cur.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    const fd = new FormData()
    fd.append("id", id)
    startTransition(() => void markNotificationsRead({}, fd))
  }

  const handleView = (n: NotificationRow) => {
    if (!n.is_read) {
      setRows((cur) => cur.map((r) => (r.id === n.id ? { ...r, is_read: true } : r)))
      const fd = new FormData()
      fd.append("id", n.id)
      void markNotificationsRead({}, fd)
    }
  }

  const handleMarkAll = () => {
    setRows((cur) => cur.map((n) => (n.is_read ? n : { ...n, is_read: true })))
    startTransition(() => void markAllNotificationsRead({}, new FormData()))
  }

  const filtered = rows.filter((n) => matchesFilter(n.type, filter))
  const now = new Date()

  const buckets = new Map<string, NotificationRow[]>()
  for (const n of filtered) {
    const key = bucketKey(new Date(n.created_at), now)
    const list = buckets.get(key) ?? []
    list.push(n)
    buckets.set(key, list)
  }

  if (rows.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Notifications
          </h1>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] px-4 py-20 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white">
            <BellIcon className="size-6 text-[#2563EB]" />
          </div>
          <h2 className="font-heading text-lg font-semibold">
            No notifications yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            New offers, accepted offers, reviews, and report updates will show up
            here.
          </p>
          <Button asChild size="lg" className="mt-4 h-11">
            <Link href="/search">Browse listings</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Notifications
          </h1>
          <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
            {unreadCount === 0 ? "All read" : `${unreadCount} unread`}
          </span>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={handleMarkAll}
          >
            <CheckIcon className="mr-1.5 size-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-8">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter notifications"
        >
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/70 hover:bg-muted/70"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed px-4 py-14 text-center">
            <p className="text-sm text-foreground/70">
              No {FILTER_LABEL[filter]} here.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 text-sm"
              onClick={() => setFilter("all")}
            >
              Show all notifications
            </Button>
          </div>
        ) : (
          [...buckets.entries()].map(([bucket, group]) => (
            <section key={bucket}>
              <h2 className="mb-3 text-sm font-semibold text-foreground/80">
                {bucket}
              </h2>
              <ul className="flex flex-col gap-3">
                {group.map((n) => {
                  const style = TYPE_STYLE[n.type]
                  const href = notificationHref(n.type, n.metadata)
                  return (
                    <li
                      key={n.id}
                      className={cn(
                        "relative rounded-2xl border bg-card p-4 shadow-sm transition",
                        !n.is_read && "border-[#2563EB]/40 bg-[#EEF4FF]/60"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "relative flex size-10 shrink-0 items-center justify-center rounded-full",
                            style.chip
                          )}
                        >
                          {!n.is_read ? (
                            <span
                              aria-hidden="true"
                              className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-background bg-[#2563EB] animate-pulse-dot"
                            />
                          ) : null}
                          {style.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          {!n.is_read ? (
                            <span className="sr-only">Unread.</span>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={cn(
                                "truncate text-sm text-foreground",
                                n.is_read ? "font-medium" : "font-semibold"
                              )}
                            >
                              {n.title}
                            </p>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/70">
                              {NOTIFICATION_TYPE_LABELS[n.type]}
                            </span>
                          </div>
                          {n.body ? (
                            <p className="mt-0.5 text-sm text-foreground/70">
                              {n.body}
                            </p>
                          ) : null}
                          <p className="mt-1 text-xs text-foreground/70">
                            {rowTime(new Date(n.created_at), bucket)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {href ? (
                            <Link
                              href={href}
                              onClick={() => handleView(n)}
                              className="inline-flex h-9 min-w-16 items-center justify-center rounded-lg px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                            >
                              View
                            </Link>
                          ) : null}
                          {!n.is_read ? (
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-9 text-sm"
                              onClick={() => handleMarkRead(n.id)}
                            >
                              Mark read
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </main>
  )
}
