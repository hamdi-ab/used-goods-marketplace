"use client"

import { useActionState } from "react"
import { UserRoundXIcon } from "lucide-react"

import { adminSuspendUser } from "@/app/actions/admin"
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
  const [state, action, pending] = useActionState(adminSuspendUser, {})

  const isAdmin = user.role === "admin"

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
        {user.phone_verified ? <Badge variant="outline">Phone ✓</Badge> : null}
        {user.fayda_verified ? <Badge variant="outline">Fayda ✓</Badge> : null}

        {!isAdmin ? (
          <form action={action}>
            <input type="hidden" name="userId" value={user.id} readOnly />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={pending}
              className="border-red-200 text-red-800 hover:bg-red-50"
            >
              <UserRoundXIcon className="mr-1.5 size-3.5" />
              Suspend
            </Button>
          </form>
        ) : null}
      </div>

      {state?.message && state.ok !== true ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </li>
  )
}
