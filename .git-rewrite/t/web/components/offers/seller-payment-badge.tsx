import { CheckCircle2Icon } from "lucide-react"

import type { SellerOfferRow } from "@/lib/offers"
import { formatPrice } from "@/lib/listings/constants"
import { paymentPhase } from "@/lib/payments/constants"

// #97 — the paid-deal indicator on the seller's accepted offers. The buyer's
// payment row is embedded on the offer fetch (RLS allows the seller to read
// it); this surfaces the money moving (in Chapa test mode) at the deal.
export function SellerPaymentBadge({ offer }: { offer: SellerOfferRow }) {
  if (offer.status !== "accepted") return null

  const phase = paymentPhase(offer.payment)
  if (phase === "unpaid") return null

  return (
    <p className="flex items-center gap-2 text-sm font-medium text-green-700">
      <CheckCircle2Icon className="size-4" />
      Paid {formatPrice(offer.payment?.amount ?? offer.amount, { maxFractionDigits: 2 })}
      {phase === "confirmed"
        ? " — buyer confirmed receipt. Deal closed."
        : " — awaiting buyer confirmation."}
    </p>
  )
}
