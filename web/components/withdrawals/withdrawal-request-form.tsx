"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { BanknoteIcon, SmartphoneIcon, WalletIcon } from "lucide-react"
import { toast } from "sonner"

import { requestWithdrawalAction } from "@/app/actions/payments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/listings/constants"
import { useState } from "react"

const WITHDRAWAL_MINIMUM = 50

interface WithdrawalRequestFormProps {
  availableBalance: number
  pendingAmount: number
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={disabled || pending} className="w-full">
      {pending ? "Requesting..." : "Request withdrawal"}
    </Button>
  )
}

export function WithdrawalRequestForm({
  availableBalance,
  pendingAmount,
}: WithdrawalRequestFormProps) {
  const [state, formAction] = useActionState(requestWithdrawalAction, {})
  const [amount, setAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [payoutMethod, setPayoutMethod] = useState<"bank_transfer" | "mobile_money">("bank_transfer")
  const [lastShownState, setLastShownState] = useState<typeof state | null>(null)

  // Only fire toast on state change
  if (state !== lastShownState) {
    if (state.ok) {
      toast.success(
        `Withdrawal requested! Fee: ${state.fee ? formatPrice(state.fee, { maxFractionDigits: 2 }) : "0 ETB"}, Net: ${state.netAmount ? formatPrice(state.netAmount, { maxFractionDigits: 2 }) : "0 ETB"}`
      )
      if (lastShownState !== null) {
        setAmount("")
        setAccountNumber("")
      }
    } else if (state.message && lastShownState !== null) {
      toast.error(state.message)
    }
    setLastShownState(state)
  }

  const amountNum = parseFloat(amount) || 0
  const isValidAmount = amountNum >= WITHDRAWAL_MINIMUM && amountNum <= availableBalance
  const canSubmit = isValidAmount && accountNumber.trim().length > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <WalletIcon className="size-5 text-[#2563EB]" />
          Request withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="withdraw-amount">Amount (ETB)</Label>
            <Input
              id="withdraw-amount"
              name="amount"
              type="number"
              min={WITHDRAWAL_MINIMUM}
              max={availableBalance}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${WITHDRAWAL_MINIMUM}`}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Available: {formatPrice(availableBalance, { maxFractionDigits: 2 })}
              {pendingAmount > 0 ? ` (${formatPrice(pendingAmount, { maxFractionDigits: 2 })} pending)` : ""}
            </p>
          </div>

          <div>
            <Label>Payout method</Label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setPayoutMethod("bank_transfer")}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  payoutMethod === "bank_transfer"
                    ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                    : "border-border hover:bg-muted"
                }`}
              >
                <BanknoteIcon className="size-4" />
                Bank transfer
              </button>
              <button
                type="button"
                onClick={() => setPayoutMethod("mobile_money")}
                className={`flex flex-1 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  payoutMethod === "mobile_money"
                    ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                    : "border-border hover:bg-muted"
                }`}
              >
                <SmartphoneIcon className="size-4" />
                Mobile money
              </button>
            </div>
            <input type="hidden" name="payoutMethod" value={payoutMethod} />
          </div>

          <div>
            <Label htmlFor="withdraw-account">Account number</Label>
            <Input
              id="withdraw-account"
              name="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={payoutMethod === "mobile_money" ? "09XXXXXXXX" : "Bank account number"}
              className="mt-1"
            />
          </div>

          <SubmitButton disabled={!canSubmit} />

          <p className="text-xs text-muted-foreground">
            First 2 withdrawals each month are free. After that, a 5 ETB fee applies.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
