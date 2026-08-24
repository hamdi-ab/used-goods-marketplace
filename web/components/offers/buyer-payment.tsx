"use client"

import { useState } from "react"
import { useActionState } from "react"
import { CheckCircle2Icon, CreditCardIcon, AlertTriangleIcon } from "lucide-react"

import { confirmReceiptAction, payOfferAction } from "@/app/actions/payments"
import type { BuyerOfferRow } from "@/lib/offers"
import { formatPrice } from "@/lib/listings/constants"
import { paymentPhase } from "@/lib/payments/constants"
import { Button } from "@/components/ui/button"
import { DisputeForm } from "@/components/disputes/dispute-form"

// #97 — the buyer's payment surface on an accepted offer. Starts the Chapa
// sandbox checkout (redirecting on success via server action) and, once paid, the
// buyer-confirm step that closes the deal. States: not started / pending+failed
// (pay again) / paid (confirm receipt) / confirmed (closed).
export function BuyerPayment({ offer }: { offer: BuyerOfferRow }) {
  const [payState, payFormAction, payPending] = useActionState(payOfferAction, {})
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmReceiptAction,
    {}
  )

  if (offer.status !== "accepted") return null

  const phase = paymentPhase(offer.payment)
  const amount = offer.payment?.amount ?? offer.amount

  if (phase === "confirmed") {
    return (
      <div className="mt-4 border-t pt-3">
        <p className="flex items-center gap-2 text-sm font-medium text-green-700">
          <CheckCircle2Icon className="size-4" />
          Paid {formatPrice(amount, { maxFractionDigits: 2 })} — you confirmed
          receipt. Deal closed.
        </p>
      </div>
    )
  }

  if (phase === "paid") {
    const [showDispute, setShowDispute] = useState(false)
    return (
      <div className="mt-4 border-t pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-green-700">
            <CheckCircle2Icon className="size-4" />
            Paid {formatPrice(amount, { maxFractionDigits: 2 })}
          </p>
          <form action={confirmFormAction}>
            <input type="hidden" name="offerId" value={offer.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={confirmPending}
            >
              Confirm receipt
            </Button>
            {confirmState.message ? (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {confirmState.message}
              </p>
            ) : null}
          </form>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowDispute(!showDispute)}
          >
            <AlertTriangleIcon className="mr-1 size-3" />
            Report issue
          </Button>
        </div>
        {showDispute && offer.payment ? (
          <div className="mt-3">
            <DisputeForm paymentId={offer.payment.id} />
          </div>
        ) : null}
      </div>
    )
  }

  // Unpaid: no payment begun yet, or a pending/failed attempt that can be retried.
  return (
    <div className="mt-4 border-t pt-3">
      {payPending ? (
        <p className="text-sm text-muted-foreground">Opening Chapa checkout…</p>
      ) : (
        <form action={payFormAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="offerId" value={offer.id} />
          <Button type="submit" disabled={payPending}>
            <CreditCardIcon className="size-4" />
            {offer.payment?.status === "failed" ? "Retry payment" : "Pay"}{" "}
            {formatPrice(amount, { maxFractionDigits: 2 })} with Chapa
          </Button>
          <p className="text-xs text-muted-foreground">
            Sandbox demo — pay with Chapa&apos;s test card (Visa 4200 0000 0000
            0000, CVV 123, expiry 12/34).
          </p>
          {payState.message ? (
            <p role="alert" className="w-full text-sm text-destructive">
              {payState.message}
            </p>
          ) : null}
        </form>
      )}
    </div>
  )
}
