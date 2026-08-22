"use client"

import { useActionState } from "react"
import { BadgeCheckIcon, CircleDashedIcon } from "lucide-react"

import { requestVerification } from "@/app/actions/verifications"
import type { MyVerificationRow } from "@/lib/verifications"
import {
  SELF_SERVE_TYPES,
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

function statusFor(verifications: MyVerificationRow[], type: string) {
  return verifications.find((v) => v.type === type)?.status ?? null
}

export function VerificationCard({
  verifications,
}: {
  verifications: MyVerificationRow[]
}) {
  const [state, action, pending] = useActionState(requestVerification, {})

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Verification</CardTitle>
        <CardDescription>
          Verify your phone to earn trust badges on your public
          profile. A marketplace admin reviews each request.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {SELF_SERVE_TYPES.map((type) => {
          const status = statusFor(verifications, type)
          const verified = status === "verified"
          const isPending = status === "pending"

          return (
            <div
              key={type}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {VERIFICATION_TYPE_LABELS[type]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {verified
                    ? "Verified — your trust badge shows on your profile"
                    : isPending
                      ? "Request pending admin review"
                      : "Not verified yet"}
                </p>
              </div>

              {verified ? (
                <Badge variant="success">
                  <BadgeCheckIcon className="mr-1 size-3" />
                  Verified
                </Badge>
              ) : isPending ? (
                <Badge variant="outline">
                  <CircleDashedIcon className="mr-1 size-3" />
                  Pending
                </Badge>
              ) : (
                <form action={action}>
                  <input type="hidden" name="type" value={type} readOnly />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                  >
                    Request verification
                  </Button>
                </form>
              )}
            </div>
          )
        })}

        {state?.message && state.ok !== true ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="text-sm text-green-600">
            Phone verification requested — an admin will review it shortly.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
