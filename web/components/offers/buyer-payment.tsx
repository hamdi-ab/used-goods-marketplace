"use client"

import { useState } from "react"
import { useActionState } from "react"
import { CheckCircle2Icon, CreditCardIcon, XIcon, CopyIcon, CheckIcon } from "lucide-react"

import { confirmReceiptAction, payOfferAction } from "@/app/actions/payments"
import type { BuyerOfferRow } from "@/lib/offers"
import { formatPrice } from "@/lib/listings/constants"
import { paymentPhase } from "@/lib/payments/constants"
import { Button } from "@/components/ui/button"

// #97 — the buyer's payment surface on an accepted offer. Starts the Chapa
// sandbox checkout (redirecting on success) and, once paid, the buyer-confirm
// step that closes the deal. States: not started / pending+failed (pay again)
// / paid (confirm receipt) / confirmed (closed).
export function BuyerPayment({ offer }: { offer: BuyerOfferRow }) {
  const [payState, payFormAction, payPending] = useActionState(payOfferAction, {})
  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    confirmReceiptAction,
    {}
  )
  const [showReceipt, setShowReceipt] = useState(false)

  if (offer.status !== "accepted") return null

  const phase = paymentPhase(offer.payment)
  const amount = offer.payment?.amount ?? offer.amount
  const txRef = offer.payment?.tx_ref
  const paidAt = offer.payment?.paid_at

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
        </div>

        {/* Receipt modal trigger */}
        {txRef ? (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowReceipt(true)}
              className="text-xs font-medium text-[#2563EB] hover:underline"
            >
              View receipt
            </button>
          </div>
        ) : null}

        {showReceipt ? (
          <ReceiptModal
            txRef={txRef ?? ""}
            amount={amount}
            paidAt={paidAt}
            listingTitle={offer.listing?.title}
            onClose={() => setShowReceipt(false)}
          />
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

interface ReceiptModalProps {
  txRef: string
  amount: number
  paidAt: string | null
  listingTitle: string | undefined
  onClose: () => void
}

function ReceiptModal({ txRef, amount, paidAt, listingTitle, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(txRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2Icon className="size-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-[#0A0A0A]">Payment successful</h2>
              <p className="text-sm text-[#8A8A8A]">Transaction completed</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#8A8A8A] hover:bg-[#F7F7F7] hover:text-[#0A0A0A]"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="mt-6 text-center">
          <p className="text-3xl font-bold text-[#0A0A0A]">
            {formatPrice(amount, { maxFractionDigits: 2 })}
          </p>
          {listingTitle ? (
            <p className="mt-1 text-sm text-[#8A8A8A]">{listingTitle}</p>
          ) : null}
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-[#EAEAEA]" />

        {/* Details */}
        <dl className="space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-[#8A8A8A]">Transaction ref</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono text-sm text-[#0A0A0A]">{txRef}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded p-1 text-[#8A8A8A] hover:bg-[#F7F7F7] hover:text-[#2563EB]"
                title="Copy reference"
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-green-600" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-sm text-[#8A8A8A]">Status</dt>
            <dd className="text-sm font-medium text-green-600">Paid</dd>
          </div>
          {paidAt ? (
            <div className="flex items-center justify-between">
              <dt className="text-sm text-[#8A8A8A]">Paid at</dt>
              <dd className="text-sm text-[#0A0A0A]">
                {new Date(paidAt).toLocaleString()}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <dt className="text-sm text-[#8A8A8A]">Payment method</dt>
            <dd className="text-sm text-[#0A0A0A]">Chapa</dd>
          </div>
        </dl>

        {/* Footer */}
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
