"use client"

import { useActionState } from "react"

import { offerAction } from "@/app/actions/offers"
import type { BuyerOfferRow } from "@/lib/offers"
import { Button } from "@/components/ui/button"

export function BuyerOfferActions({ offer }: { offer: BuyerOfferRow }) {
  const [state, formAction, pending] = useActionState(offerAction, {})

  // Only a countered offer needs the buyer to respond: accept it (the listing
  // is then marked sold, ListingMarkedSold) or decline it (walk away).
  if (offer.status !== "countered") return null

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="offerId" value={offer.id} />
      <input type="hidden" name="listingId" value={offer.listing_id} />
      <Button type="submit" name="action" value="accept" disabled={pending}>
        Accept counter
      </Button>
      <Button
        type="submit"
        name="action"
        value="decline"
        variant="ghost"
        disabled={pending}
      >
        Decline counter
      </Button>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  )
}