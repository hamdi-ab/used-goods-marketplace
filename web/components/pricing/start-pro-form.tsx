"use client"

import { useEffect, useRef } from "react"
import { useActionState } from "react"
import { CreditCardIcon, Loader2Icon } from "lucide-react"

import { submitUpgradeIntent } from "@/app/actions/pricing"
import { Button } from "@/components/ui/button"

export function StartProForm() {
  const [state, formAction, pending] = useActionState(submitUpgradeIntent, {})
  const redirected = useRef(false)

  useEffect(() => {
    if (state.ok && state.checkoutUrl && !redirected.current) {
      redirected.current = true
      window.location.assign(state.checkoutUrl)
    }
  }, [state])

  return (
    <form action={formAction} className="w-full">
      <fieldset disabled={pending} className="flex flex-col gap-2">
        <Button type="submit" variant="default" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Opening Chapa checkout…
            </>
          ) : (
            <>
              <CreditCardIcon className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </>
          )}
        </Button>

        {state.message ? (
          <p className={state.ok ? "text-xs text-green-700" : "text-xs text-destructive"}>
            {state.message}
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Cancel any time.
        </p>
      </fieldset>
    </form>
  )
}
