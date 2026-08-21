"use client"

import { useState } from "react"
import { useActionState } from "react"

import { offerAction } from "@/app/actions/offers"
import type { SellerOfferRow } from "@/lib/offers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SellerOfferActions({ offer }: { offer: SellerOfferRow }) {
  const [countering, setCountering] = useState(false)
  const [state, formAction, pending] = useActionState(offerAction, {})

  // Settled offers need no actions; the badge on the card carries the state.
  if (offer.status !== "pending") {
    return (
      <p className="text-sm text-muted-foreground">
        {offer.status === "countered"
          ? "Countered — waiting for the buyer to respond."
          : offer.status === "accepted"
            ? "Accepted — the listing is now sold."
            : "Declined."}
      </p>
    )
  }

  // One form per offer; the pressed submit button carries name="action". The
  // counter amount only exists in the form while the seller is countering.
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="offerId" value={offer.id} />
      <input type="hidden" name="listingId" value={offer.listing_id} />

      {countering ? (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-36 flex-1 gap-1.5">
            <Label htmlFor={`counter-${offer.id}`} className="text-xs">
              Counter amount
            </Label>
            <Input
              id={`counter-${offer.id}`}
              name="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              defaultValue={String(offer.amount)}
              aria-invalid={Boolean(state.message)}
              required
            />
          </div>
          <Button
            type="submit"
            name="action"
            value="counter"
            disabled={pending}
            className="h-11"
          >
            Send counter
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setCountering(false)}
            className="h-11"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            name="action"
            value="accept"
            disabled={pending}
            className="h-11"
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCountering(true)}
            className="h-11"
          >
            Counter
          </Button>
          <Button
            type="submit"
            name="action"
            value="decline"
            variant="ghost"
            disabled={pending}
            className="h-11"
          >
            Decline
          </Button>
        </div>
      )}

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
