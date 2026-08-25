"use client"

import { useState } from "react"
import { useActionState } from "react"
import { CheckCircle2Icon, XCircleIcon, ClockIcon, AlertTriangleIcon } from "lucide-react"

import type { AdminWithdrawalRow } from "@/lib/payments"
import { approveWithdrawalAction, rejectWithdrawalAction } from "@/app/actions/payments"
import { formatPrice } from "@/lib/listings/constants"
import { formatShortDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface AdminWithdrawalsPageProps {
  withdrawals: AdminWithdrawalRow[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

export default function AdminWithdrawalsPage({ withdrawals }: AdminWithdrawalsPageProps) {
  const [filter, setFilter] = useState<string>("pending")

  const filtered = filter === "all" ? withdrawals : withdrawals.filter((w) => w.status === filter)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Withdrawals
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review and process seller withdrawal requests.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {["pending", "completed", "failed", "all"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === status
                ? "bg-[#2563EB] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangleIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">No withdrawals</h2>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {filter === "pending"
                ? "No pending withdrawal requests."
                : `No ${filter} withdrawals found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((w) => (
            <li key={w.id}>
              <WithdrawalCard withdrawal={w} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function WithdrawalCard({ withdrawal }: { withdrawal: AdminWithdrawalRow }) {
  const [approveState, approveFormAction, approvePending] = useActionState(approveWithdrawalAction, {})
  const [rejectState, rejectFormAction, rejectPending] = useActionState(rejectWithdrawalAction, {})
  const [rejectNote, setRejectNote] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)

  const isPending = withdrawal.status === "pending"

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
              <ClockIcon className="size-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{withdrawal.seller_name ?? "Unknown"}</span>
                <Badge className={STATUS_STYLES[withdrawal.status] ?? "bg-gray-100 text-gray-800"}>
                  {withdrawal.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Requested {formatShortDate(withdrawal.created_at)} via{" "}
                {withdrawal.payout_method === "mobile_money" ? "mobile money" : "bank transfer"}
              </p>
              {withdrawal.payout_details ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Account: {(() => {
                    try {
                      const details = JSON.parse(withdrawal.payout_details)
                      return details.account_number ?? "N/A"
                    } catch {
                      return "N/A"
                    }
                  })()}
                </p>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatPrice(Number(withdrawal.net_amount), { maxFractionDigits: 2 })}
            </p>
            {Number(withdrawal.fee) > 0 ? (
              <p className="text-xs text-muted-foreground">
                Fee: {formatPrice(Number(withdrawal.fee), { maxFractionDigits: 2 })}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Gross: {formatPrice(Number(withdrawal.amount), { maxFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="mt-4 border-t pt-4">
            {approveState.ok ? (
              <p className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2Icon className="size-4" />
                Withdrawal approved!
              </p>
            ) : rejectState.ok ? (
              <p className="flex items-center gap-2 text-sm text-red-600">
                <XCircleIcon className="size-4" />
                Withdrawal rejected.
              </p>
            ) : (
              <>
                {!showRejectForm ? (
                  <div className="flex gap-2">
                    <form action={approveFormAction}>
                      <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                      <Button type="submit" size="sm" disabled={approvePending}>
                        <CheckCircle2Icon className="mr-1.5 size-4" />
                        {approvePending ? "Approving..." : "Approve"}
                      </Button>
                    </form>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <XCircleIcon className="mr-1.5 size-4" />
                      Reject
                    </Button>
                  </div>
                ) : (
                  <form action={rejectFormAction} className="space-y-2">
                    <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                    <Textarea
                      name="reason"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Reason for rejection (optional)..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" variant="destructive" size="sm" disabled={rejectPending}>
                        {rejectPending ? "Rejecting..." : "Confirm Reject"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRejectForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
                {approveState.message ? (
                  <p role="alert" className="mt-2 text-sm text-destructive">{approveState.message}</p>
                ) : null}
                {rejectState.message ? (
                  <p role="alert" className="mt-2 text-sm text-destructive">{rejectState.message}</p>
                ) : null}
              </>
            )}
          </div>
        ) : withdrawal.processed_at ? (
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Processed {formatShortDate(withdrawal.processed_at)}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
