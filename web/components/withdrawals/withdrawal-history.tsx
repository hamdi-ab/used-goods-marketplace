import { CheckCircle2Icon, ClockIcon, XCircleIcon } from "lucide-react"

import type { WithdrawalRow } from "@/lib/payments"
import { formatPrice } from "@/lib/listings"
import { formatShortDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface WithdrawalHistoryProps {
  withdrawals: WithdrawalRow[]
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle2Icon className="size-4 text-green-600" />
    case "failed":
      return <XCircleIcon className="size-4 text-red-600" />
    default:
      return <ClockIcon className="size-4 text-amber-600" />
  }
}

export function WithdrawalHistory({ withdrawals }: WithdrawalHistoryProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Withdrawal history</CardTitle>
      </CardHeader>
      <CardContent>
        {withdrawals.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No withdrawals yet.
          </p>
        ) : (
          <ul className="divide-y">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <StatusIcon status={w.status} />
                  <div>
                    <p className="font-medium">
                      {formatPrice(Number(w.net_amount), { maxFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(w.created_at)} ·{" "}
                      {w.payout_method === "mobile_money" ? "Mobile money" : "Bank transfer"}
                    </p>
                  </div>
                </div>
                <Badge className={STATUS_STYLES[w.status] ?? "bg-gray-100 text-gray-800"}>
                  {w.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
