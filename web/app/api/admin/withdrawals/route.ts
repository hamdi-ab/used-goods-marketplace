import { NextResponse } from "next/server"
import { fetchAdminWithdrawals } from "@/lib/payments"

export const dynamic = "force-dynamic"

export async function GET() {
  const withdrawals = await fetchAdminWithdrawals()
  return NextResponse.json(withdrawals)
}
