"use client"

import { useState } from "react"
import { useActionState } from "react"
import { ArrowDownIcon, BanknoteIcon, CheckCircle2Icon, ClockIcon, SmartphoneIcon, WalletIcon } from "lucide-react"

import { requestWithdrawalAction } from "@/app/actions/payments"
import type { SellerEarnings, WithdrawalRow } from "@/lib/payments"
import { formatPrice } from "@/lib/listings/constants"
import { WITHDRAWAL_MINIMUM } from "@/lib/payments/constants"
import { formatShortDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EarningsCardProps {
  earnings: SellerEarnings
  withdrawals: WithdrawalRow[]
  compact?: boolean
}

type PayoutMethod = "bank_transfer" | "mobile_money"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

export function EarningsCard({ earnings, withdrawals, compact = false }: EarningsCardProps) {
  const [state, formAction, pending] = useActionState(requestWithdrawalAction, {})
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("bank_transfer")
  const [accountNumber, setAccountNumber] = useState("")
  const [showPayoutForm, setShowPayoutForm] = useState(false)

  const canWithdraw = earnings.availableForWithdrawal >= WITHDRAWAL_MINIMUM

  if (state.ok && showPayoutForm) {
    setShowPayoutForm(false)
    setAccountNumber("")
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-foreground">Earnings</h3>
        {!compact ? (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            {formatPrice(earnings.availableForWithdrawal, { maxFractionDigits: 2 })} available
          </span>
        ) : null}
      </div>

      {compact ? (
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Available</p>
            <p className="font-semibold text-green-600">{formatPrice(earnings.availableForWithdrawal, { maxFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">On hold</p>
            <p className="font-semibold text-amber-600">{formatPrice(earnings.onHold, { maxFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="font-semibold text-blue-600">{formatPrice(earnings.pendingClearance, { maxFractionDigits: 0 })}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
            <span className="flex items-center gap-2 text-sm text-green-800">
              <WalletIcon className="size-4" />
              Available for withdrawal
            </span>
            <span className="text-lg font-bold text-green-700">
              {formatPrice(earnings.availableForWithdrawal, { maxFractionDigits: 2 })}
            </span>
          </div>

          {earnings.onHold > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ClockIcon className="size-4" />
                On hold (48h after confirm)
              </span>
              <span className="text-foreground">{formatPrice(earnings.onHold, { maxFractionDigits: 2 })}</span>
            </div>
          ) : null}

          {earnings.pendingClearance > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ArrowDownIcon className="size-4" />
                Pending (awaiting confirmation)
              </span>
              <span className="text-foreground">{formatPrice(earnings.pendingClearance, { maxFractionDigits: 2 })}</span>
            </div>
          ) : null}

          <div className="border-t pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Total sales</span>
              <span>{formatPrice(earnings.totalSales, { maxFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee (5%)</span>
              <span className="text-red-500">-{formatPrice(earnings.platformFees, { maxFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4">
        {state.ok ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2Icon className="size-4" />
              Withdrawal request submitted!
            </p>
            <p className="mt-1 text-xs">
              {formatPrice(state.netAmount ?? earnings.availableForWithdrawal, { maxFractionDigits: 2 })} via{" "}
              {state.payoutMethod === "mobile_money" ? "mobile money" : "bank transfer"}
              {state.fee && state.fee > 0 ? ` (fee: ${formatPrice(state.fee, { maxFractionDigits: 2 })})` : ""}
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
                  <Label htmlFor={`account-${compact ? "compact" : "full"}`} className="text-xs">
                    {payoutMethod === "mobile_money" ? "Mobile money number" : "Bank account number"}
                  </Label>
                  <Input
                    id={`account-${compact ? "compact" : "full"}`}
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

      {withdrawals.length > 0 ? (
        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Recent withdrawals</p>
          <div className="space-y-2">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <div>
                  <span className="font-medium">{formatPrice(Number(w.net_amount), { maxFractionDigits: 2 })}</span>
                  <span className="ml-2 text-muted-foreground">{formatShortDate(w.created_at)}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLES[w.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
