"use client"

import { useState } from "react"
import { useActionState } from "react"
import { ArrowDownIcon, BanknoteIcon, ClockIcon, WalletIcon } from "lucide-react"

import { requestWithdrawalAction } from "@/app/actions/payments"
import type { SellerOfferRow } from "@/lib/offers"
import { formatPrice } from "@/lib/listings/constants"
import { paymentPhase, PLATFORM_FEE_PERCENTAGE, WITHDRAWAL_MINIMUM } from "@/lib/payments/constants"
import { Button } from "@/components/ui/button"

interface SellerEarningsCardProps {
  offers: SellerOfferRow[]
}

interface Earnings {
  totalSales: number
  platformFees: number
  netEarnings: number
  availableForWithdrawal: number
  pendingClearance: number
  onHold: number
}

function calculateEarnings(offers: SellerOfferRow[]): Earnings {
  let totalSales = 0
  let platformFees = 0
  let netEarnings = 0
  let availableForWithdrawal = 0
  let pendingClearance = 0
  let onHold = 0

  for (const offer of offers) {
    if (offer.status !== "accepted" || !offer.payment) continue
    const amount = offer.payment.amount ?? offer.amount
    totalSales += amount
    const fee = Math.round((amount * PLATFORM_FEE_PERCENTAGE) / 100)
    platformFees += fee
    netEarnings += amount - fee

    const phase = paymentPhase(offer.payment)
    if (phase === "confirmed") {
      // Check if hold period has elapsed
      if (offer.payment.hold_expires_at && new Date(offer.payment.hold_expires_at) > new Date()) {
        onHold += amount - fee
      } else {
        availableForWithdrawal += amount - fee
      }
    } else if (phase === "paid") {
      pendingClearance += amount - fee
    }
  }

  return { totalSales, platformFees, netEarnings, availableForWithdrawal, pendingClearance, onHold }
}

export function SellerEarningsCard({ offers }: SellerEarningsCardProps) {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, {})
  const [showBreakdown, setShowBreakdown] = useState(false)

  const earnings = calculateEarnings(offers)
  const canWithdraw = earnings.availableForWithdrawal >= WITHDRAWAL_MINIMUM

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">Earnings</h3>
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-[#2563EB] hover:underline"
        >
          {showBreakdown ? "Hide" : "Show"} breakdown
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <WalletIcon className="size-4" />
            Available
          </span>
          <span className="text-lg font-semibold text-green-600">
            {formatPrice(earnings.availableForWithdrawal, { maxFractionDigits: 2 })}
          </span>
        </div>

        {earnings.onHold > 0 ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClockIcon className="size-4" />
              On hold (48h)
            </span>
            <span className="text-sm text-foreground">
              {formatPrice(earnings.onHold, { maxFractionDigits: 2 })}
            </span>
          </div>
        ) : null}

        {earnings.pendingClearance > 0 ? (
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowDownIcon className="size-4" />
              Pending clearance
            </span>
            <span className="text-sm text-foreground">
              {formatPrice(earnings.pendingClearance, { maxFractionDigits: 2 })}
            </span>
          </div>
        ) : null}
      </div>

      {showBreakdown ? (
        <div className="mt-4 border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total sales</span>
            <span className="text-foreground">{formatPrice(earnings.totalSales, { maxFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
            <span className="text-red-600">-{formatPrice(earnings.platformFees, { maxFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-medium">
            <span className="text-foreground">Net earnings</span>
            <span className="text-foreground">{formatPrice(earnings.netEarnings, { maxFractionDigits: 2 })}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <form action={formAction}>
          <input type="hidden" name="amount" value={String(earnings.availableForWithdrawal)} />
          <Button
            type="submit"
            className="w-full"
            disabled={!canWithdraw || pending}
          >
            <BanknoteIcon className="mr-2 size-4" />
            {pending
              ? "Processing..."
              : canWithdraw
                ? "Request withdrawal"
                : `Min. withdrawal is ${formatPrice(WITHDRAWAL_MINIMUM, { maxFractionDigits: 0 })}`}
          </Button>
        </form>
        {state.message ? (
          <p role="alert" className="mt-2 text-sm text-destructive">{state.message}</p>
        ) : null}
      </div>
    </div>
  )
}
