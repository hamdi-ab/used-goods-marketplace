import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/auth"
import { fetchAdminReports } from "@/lib/reports"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()
  const reports = await fetchAdminReports()

  return <AdminShell reportCount={reports.length}>{children}</AdminShell>
}
