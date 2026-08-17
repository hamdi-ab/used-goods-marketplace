"use client"

import { useActionState } from "react"
import Link from "next/link"
import { BellIcon, CheckIcon, MailIcon, MailOpenIcon } from "lucide-react"

import {
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/app/actions/notifications"
import type { NotificationRow } from "@/lib/notifications"
import {
  NOTIFICATION_TYPE_LABELS,
  notificationHref,
} from "@/lib/notifications/constants"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function NotificationList({
  notifications,
}: {
  notifications: NotificationRow[]
}) {
  const [markState, markAction, markPending] = useActionState(
    markNotificationsRead,
    {}
  )
  const [allState, allAction, allPending] = useActionState(
    markAllNotificationsRead,
    {}
  )

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {notifications.length === 0
              ? "You're all caught up."
              : unreadCount > 0
                ? `${unreadCount} unread`
                : "All read"}
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={allAction}>
            <Button type="submit" variant="outline" size="sm" disabled={allPending}>
              <CheckIcon className="mr-1.5 size-3.5" />
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>

      {markState?.message && markState.ok !== true ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {markState.message}
        </p>
      ) : null}
      {allState?.message && allState.ok !== true ? (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {allState.message}
        </p>
      ) : null}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <BellIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              No notifications yet
            </h2>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              New offers, accepted offers, reviews, and report updates will show
              up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map((notification) => {
            const href = notificationHref(notification.type, notification.metadata)
            return (
              <li
                key={notification.id}
                className={cn(
                  "rounded-lg border bg-card p-4",
                  !notification.is_read && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {notification.is_read ? (
                        <MailOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <MailIcon className="size-4 shrink-0 text-primary" />
                      )}
                      <p className="truncate text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <Badge variant="secondary">
                        {NOTIFICATION_TYPE_LABELS[notification.type]}
                      </Badge>
                    </div>
                    {notification.body ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {href ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={href}>View</Link>
                      </Button>
                    ) : null}
                    {!notification.is_read ? (
                      <form action={markAction}>
                        <input
                          type="hidden"
                          name="id"
                          value={notification.id}
                          readOnly
                        />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          disabled={markPending}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Mark read
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}