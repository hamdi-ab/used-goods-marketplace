import type { Metadata } from "next"

import AdminWithdrawalsPage from "./page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Withdrawals",
  description: "Review and process seller withdrawal requests.",
}

export default function WithdrawalsPage() {
  return <AdminWithdrawalsPage />
}
