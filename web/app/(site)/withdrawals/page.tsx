import type { Metadata } from "next"
import { requireTrader } from "@/lib/auth"
import { fetchSellerEarnings, fetchSellerWithdrawals } from "@/lib/payments"
import { WithdrawalRequestForm } from "@/components/withdrawals/withdrawal-request-form"
import { WithdrawalHistory } from "@/components/withdrawals/withdrawal-history"
import { EarningsCard } from "@/components/withdrawals/earnings-card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Withdrawals",
  description: "Request and track withdrawals of your earnings.",
}

export default async function WithdrawalsPage() {
  const user = await requireTrader()
  const [earnings, withdrawals] = await Promise.all([
    fetchSellerEarnings(user.id),
    fetchSellerWithdrawals(user.id),
  ])

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Withdrawals" },
        ]}
      />

      <div className="mt-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Withdrawals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Request payouts of your available earnings.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <EarningsCard earnings={earnings} />
          <WithdrawalRequestForm
            availableBalance={earnings.availableForWithdrawal}
            pendingAmount={earnings.pendingWithdrawals}
          />
        </div>
        <WithdrawalHistory withdrawals={withdrawals} />
      </div>
    </main>
  )
}
