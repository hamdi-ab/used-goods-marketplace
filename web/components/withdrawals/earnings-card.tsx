import {
  BanknoteIcon,
  ClockIcon,
  LockIcon,
  WalletIcon,
} from "lucide-react"

import type { SellerEarnings } from "@/lib/payments"
import { formatPrice } from "@/lib/listings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EarningsCardProps {
  earnings: SellerEarnings
}

function EarningsRow({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: typeof BanknoteIcon
  label: string
  value: number
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <span className={muted ? "text-sm text-muted-foreground" : "font-medium"}>
        {formatPrice(value, { maxFractionDigits: 2 })}
      </span>
    </div>
  )
}

export function EarningsCard({ earnings }: EarningsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <WalletIcon className="size-5 text-[#2563EB]" />
          Earnings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex items-baseline justify-between pb-3">
          <span className="text-sm text-muted-foreground">Available for withdrawal</span>
          <span className="text-2xl font-bold text-[#2563EB]">
            {formatPrice(earnings.availableForWithdrawal, { maxFractionDigits: 2 })}
          </span>
        </div>

        <div className="border-t pt-2">
          <EarningsRow
            icon={BanknoteIcon}
            label="Total sales"
            value={earnings.totalSales}
            muted
          />
          <EarningsRow
            icon={BanknoteIcon}
            label="Platform fees (5%)"
            value={earnings.platformFees}
            muted
          />
          <EarningsRow
            icon={BanknoteIcon}
            label="Net earnings"
            value={earnings.netEarnings}
            muted
          />
        </div>

        {earnings.pendingClearance > 0 || earnings.onHold > 0 || earnings.pendingWithdrawals > 0 ? (
          <div className="border-t pt-2">
            <EarningsRow
              icon={ClockIcon}
              label="Pending clearance"
              value={earnings.pendingClearance}
              muted
            />
            <EarningsRow
              icon={LockIcon}
              label="On hold"
              value={earnings.onHold}
              muted
            />
            <EarningsRow
              icon={ClockIcon}
              label="Pending withdrawals"
              value={earnings.pendingWithdrawals}
              muted
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
