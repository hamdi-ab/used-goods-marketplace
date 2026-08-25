import type { Metadata } from "next"

import { fetchAdminWithdrawals } from "@/lib/payments"
import AdminWithdrawalsPage from "./page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Withdrawals",
  description: "Review and process seller withdrawal requests.",
}

export default async function WithdrawalsPage() {
  const withdrawals = await fetchAdminWithdrawals()
  return <AdminWithdrawalsPage withdrawals={withdrawals} />
}
