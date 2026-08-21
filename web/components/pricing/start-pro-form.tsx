"use client"

import { useActionState } from "react"
import { Loader2Icon } from "lucide-react"

import { submitUpgradeIntent } from "@/app/actions/pricing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function StartProForm() {
  const [state, formAction, pending] = useActionState(submitUpgradeIntent, {})

  return (
    <form action={formAction} className="mt-10 w-full max-w-md">
      <fieldset disabled={pending} className="flex flex-col gap-3">
        <div className="space-y-2">
          <Label htmlFor="pro-email">Email address</Label>
          <Input
            id="pro-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={pending}
          />
          {state.errors?.email?.[0] && (
            <p className="text-sm text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        <Button type="submit" variant="default" className="w-full sm:mt-2" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Saving intent…
            </>
          ) : (
            "Start Pro (199 ETB/mo, when billing opens)"
          )}
        </Button>

        {state.message ? (
          <p
            className={
              state.ok
                ? "text-sm text-green-700"
                : "text-sm text-destructive"
            }
          >
            {state.message}
          </p>
        ) : null}
      </fieldset>
    </form>
  )
}
