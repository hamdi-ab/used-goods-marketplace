"use client"

import { useState } from "react"
import { useActionState } from "react"

import { offerAction } from "@/app/actions/offers"
import { declineCounterAction } from "@/app/actions/offer-actions"
import type { BuyerOfferRow } from "@/lib/offers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function BuyerOfferActions({ offer }: { offer: BuyerOfferRow }) {
  const [countering, setCountering] = useState(false)
  const [state, formAction, pending] = useActionState(offerAction, {})
  const [declineState, declineFormAction, declinePending] = useActionState(declineCounterAction, {})

  // Only a countered offer needs the buyer to respond: accept it, decline it, or counter again
  if (offer.status !== "countered") return null

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="offerId" value={offer.id} />
        <input type="hidden" name="listingId" value={offer.listing_id} />
        <input type="hidden" name="action" value="accept" readOnly />
        <Button
          type="submit"
          disabled={pending || declinePending}
          className="h-11"
        >
          Accept counter — ETB {offer.amount.toLocaleString()}
        </Button>
      </form>

      {countering ? (
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="offerId" value={offer.id} />
          <input type="hidden" name="listingId" value={offer.listing_id} />
          <input type="hidden" name="action" value="counter" readOnly />
          <div className="grid min-w-36 flex-1 gap-1.5">
            <Label htmlFor={`buyer-counter-${offer.id}`} className="text-xs">
              Your counter
            </Label>
            <Input
              id={`buyer-counter-${offer.id}`}
              name="amount"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              defaultValue={String(Math.round(offer.amount * 0.9))}
              required
            />
          </div>
          <div className="grid min-w-48 flex-1 gap-1.5">
            <Label htmlFor={`buyer-counter-msg-${offer.id}`} className="text-xs">
              Message (optional)
            </Label>
            <Input
              id={`buyer-counter-msg-${offer.id}`}
              name="message"
              type="text"
              maxLength={500}
              placeholder="e.g. I can do this price if you include delivery"
            />
          </div>
          <Button
            type="submit"
            disabled={pending || declinePending}
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
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCountering(true)}
            className="h-11"
          >
            Counter again
          </Button>
          <form action={declineFormAction}>
            <input type="hidden" name="offerId" value={offer.id} />
            <input type="hidden" name="listingId" value={offer.listing_id} />
            <Button
              type="submit"
              variant="ghost"
              disabled={pending || declinePending}
              className="h-11"
            >
              Decline counter
            </Button>
          </form>
        </div>
      )}

      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      {declineState.message ? (
        <p role="alert" className="text-sm text-destructive">
          {declineState.message}
        </p>
      ) : null}
    </div>
  )
}
