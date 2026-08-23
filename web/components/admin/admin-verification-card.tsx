"use client"

import { useActionState } from "react"
import { BadgeCheckIcon, XIcon } from "lucide-react"

import { adminRecordVerification } from "@/app/actions/verifications"
import type { AdminVerificationRow } from "@/lib/verifications"
import {
  VERIFICATION_STATUS_LABELS,
  VERIFICATION_TYPE_LABELS,
} from "@/lib/verifications/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AdminVerificationCard({
  request,
}: {
  request: AdminVerificationRow
}) {
  const [state, action, pending] = useActionState(adminRecordVerification, {})

  const user = request.user

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{user?.full_name ?? "Unknown user"}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {VERIFICATION_TYPE_LABELS[request.type]}
            </Badge>
            <Badge variant="outline">
              {VERIFICATION_STATUS_LABELS[request.status]}
            </Badge>
          </div>
        </div>
        <CardDescription>
          Requested{" "}
          {new Date(request.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {user?.city ? ` · ${user.city}` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          Role: {user?.role ?? "buyer"} · Phone ✓{" "}
          {user?.phone_verified ? "verified" : "not verified"} · Fayda ✓{" "}
          {user?.fayda_verified ? "verified" : "not verified"}
        </p>

        {request.notes ? (
          <p className="mt-3 text-sm text-foreground/80">{request.notes}</p>
        ) : null}

        {state?.message && state.ok !== true ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col flex-wrap gap-2 sm:flex-row sm:items-center sm:justify-end">
          <form action={action}>
            <input type="hidden" name="userId" value={request.user_id} readOnly />
            <input type="hidden" name="type" value={request.type} readOnly />
            <input type="hidden" name="status" value="verified" readOnly />
            <Button
              type="submit"
              variant="default"
              size="sm"
              disabled={pending}
            >
              <BadgeCheckIcon className="mr-1.5 size-3.5" />
              Approve
            </Button>
          </form>
          <form action={action}>
            <input type="hidden" name="userId" value={request.user_id} readOnly />
            <input type="hidden" name="type" value={request.type} readOnly />
            <input type="hidden" name="status" value="rejected" readOnly />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              <XIcon className="mr-1.5 size-3.5" />
              Reject
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
}
