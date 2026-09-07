"use client"

import { useEffect, useRef } from "react"
import { useActionState } from "react"

import { submitOffer } from "@/app/actions/offers"
import { formatPrice } from "@/lib/listings/constants"
import { OFFER_MESSAGE_MAX } from "@/lib/offers/constants"
import { TEXTAREA_CLASS } from "@/lib/form-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function OfferModal({
  listingId,
  listingPrice,
  onClose,
}: {
  listingId: string
  listingPrice: number
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState(submitOffer, {})

  // Keep onClose in a ref so the effect never captures a stale closure.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Close the dialog once the offer is persisted; revalidation has already
  // refreshed the page underneath.
  useEffect(() => {
    if (state.ok) onCloseRef.current()
  }, [state.ok])

  return (
    <>
      <DialogHeader>
        <DialogTitle>Make an offer</DialogTitle>
        <DialogDescription>
          Offer your price for this item. The seller can accept, decline, or
          counter your offer.
        </DialogDescription>
      </DialogHeader>

      <form action={formAction} className="flex flex-col gap-4 px-4">
        <input type="hidden" name="listingId" value={listingId} />
        <FieldError message={state.errors?.listingId?.[0]} />

        <div className="grid gap-2">
          <Label htmlFor="offer-amount">
            Your offer ({formatPrice(listingPrice)} asking)
          </Label>
          <Input
            id="offer-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            defaultValue={String(listingPrice)}
            aria-invalid={Boolean(state.errors?.amount)}
            required
          />
          <FieldError message={state.errors?.amount?.[0]} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="offer-message">Message (optional)</Label>
          <textarea
            id="offer-message"
            name="message"
            rows={4}
            maxLength={OFFER_MESSAGE_MAX}
            placeholder="e.g. I can collect this weekend, would you take…"
            className={TEXTAREA_CLASS}
          />
          <FieldError message={state.errors?.message?.[0]} />
        </div>

        {state.message ? (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send offer"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
