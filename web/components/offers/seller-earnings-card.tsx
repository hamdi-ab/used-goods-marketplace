"use client"

import { useState } from "react"
import { useActionState } from "react"
import { ArrowDownIcon, BanknoteIcon, ClockIcon, SmartphoneIcon, WalletIcon } from "lucide-react"

import { requestWithdrawalAction } from "@/app/actions/payments"
import type { SellerOfferRow } from "@/lib/offers"
import { formatPrice } from "@/lib/listings/constants"
import { paymentPhase, PLATFORM_FEE_PERCENTAGE, WITHDRAWAL_MINIMUM } from "@/lib/payments/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface SellerEarningsCardProps {
  offers: SellerOfferRow[]
}

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

type PayoutMethod = "bank_transfer" | "mobile_money"

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
    const fee = (amount * PLATFORM_FEE_PERCENTAGE) / 100
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
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("bank_transfer")
  const [accountNumber, setAccountNumber] = useState("")
  const [showPayoutForm, setShowPayoutForm] = useState(false)

  const earnings = calculateEarnings(offers)
  const canWithdraw = earnings.availableForWithdrawal >= WITHDRAWAL_MINIMUM

  // Reset form after successful withdrawal
  if (state.ok && showPayoutForm) {
    setShowPayoutForm(false)
    setAccountNumber("")
  }

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
        {state.ok ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p className="font-medium">Withdrawal request submitted!</p>
            <p className="mt-1 text-xs">
              {formatPrice(state.netAmount ?? earnings.availableForWithdrawal, { maxFractionDigits: 2 })} via {state.fee && state.fee > 0 ? `${payoutMethod === "mobile_money" ? "mobile money" : "bank transfer"} (fee: ${formatPrice(state.fee, { maxFractionDigits: 2 })})` : payoutMethod === "mobile_money" ? "mobile money" : "bank transfer"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Status: pending — funds will be transferred within 24-48 hours.</p>
          </div>
        ) : (
          <form action={formAction} className="space-y-3">
            {!showPayoutForm ? (
              <Button
                type="button"
                className="w-full"
                disabled={!canWithdraw}
                onClick={() => setShowPayoutForm(true)}
              >
                <BanknoteIcon className="mr-2 size-4" />
                {canWithdraw
                  ? "Request withdrawal"
                  : `Min. withdrawal is ${formatPrice(WITHDRAWAL_MINIMUM, { maxFractionDigits: 0 })}`}
              </Button>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Payout method</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod("bank_transfer")}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        payoutMethod === "bank_transfer"
                          ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <BanknoteIcon className="size-3" />
                      Bank transfer
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod("mobile_money")}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                        payoutMethod === "mobile_money"
                          ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <SmartphoneIcon className="size-3" />
                      Mobile money
                    </button>
                  </div>
                  <input type="hidden" name="payoutMethod" value={payoutMethod} />
                </div>
                <div>
                  <Label htmlFor="accountNumber" className="text-xs">
                    {payoutMethod === "mobile_money" ? "Mobile money number" : "Bank account number"}
                  </Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={payoutMethod === "mobile_money" ? "0912345678" : "1000000000000"}
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payoutMethod === "mobile_money"
                      ? "Enter your TeleBirr or CBE Birr phone number"
                      : "Enter your CBE or commercial bank account number"}
                  </p>
                </div>
                <input type="hidden" name="amount" value={String(earnings.availableForWithdrawal)} />
                <div className="flex gap-2">
                  <Button type="submit" disabled={pending || !accountNumber.trim()}>
                    {pending ? "Submitting..." : `Withdraw ${formatPrice(earnings.availableForWithdrawal, { maxFractionDigits: 2 })}`}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowPayoutForm(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
        {state.message ? (
          <p role="alert" className="mt-2 text-sm text-destructive">{state.message}</p>
        ) : null}
      </div>
    </div>
  )
}
