"use client"

import { useActionState } from "react"
import { RotateCcwIcon, UserRoundXIcon } from "lucide-react"
import { toast } from "sonner"

import { adminRestoreUser, adminSuspendUser } from "@/app/actions/admin"
import type { AdminUserRow } from "@/lib/admin"
import { ROLE_LABELS } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials } from "@/lib/utils"

export function AdminUserRow({
  user,
}: {
  user: AdminUserRow
}) {
  const [suspendState, suspendAction, suspendPending] = useActionState(
    adminSuspendUser,
    {}
  )
  const [restoreState, restoreAction, restorePending] = useActionState(
    adminRestoreUser,
    {}
  )

  const isAdmin = user.role === "admin"
  const isSuspended = user.suspended_at != null
  const message = suspendState?.message ?? restoreState?.message

  if (suspendState?.ok) {
    toast.success("User suspended")
  }
  if (restoreState?.ok) {
    toast.success("User restored")
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-9">
          <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {user.full_name ?? "Unnamed user"}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {user.city ?? "No city"} · Trust {user.trust_score ?? 0} · Joined{" "}
            {new Date(user.created_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
        {isSuspended ? (
          <Badge variant="outline" className="border-red-200 text-red-700">
            Suspended
          </Badge>
        ) : null}
        {user.phone_verified ? <Badge variant="outline">Phone ✓</Badge> : null}
        {user.fayda_verified ? <Badge variant="outline">Fayda ✓</Badge> : null}

        {!isAdmin ? (
          isSuspended ? (
            // Restore (fix #86): re-instates the seller role and clears the
            // suspension marker so the user can list again.
            <form action={restoreAction}>
              <input type="hidden" name="userId" value={user.id} readOnly />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={restorePending}
              >
                <RotateCcwIcon className="mr-1.5 size-3.5" />
                Restore
              </Button>
            </form>
          ) : (
            <form action={suspendAction}>
              <input type="hidden" name="userId" value={user.id} readOnly />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={suspendPending}
                className="border-red-200 text-red-800 hover:bg-red-50"
              >
                <UserRoundXIcon className="mr-1.5 size-3.5" />
                Suspend
              </Button>
            </form>
          )
        ) : null}
      </div>

      {message && suspendState?.ok !== true && restoreState?.ok !== true ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {message}
        </p>
      ) : null}
    </li>
  )
}
