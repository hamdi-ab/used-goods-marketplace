import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/auth"
import { fetchAdminReports } from "@/lib/reports"
import { AdminShellWithVariant } from "@/components/admin/admin-shell-with-variant"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()
  const reports = await fetchAdminReports()

  return <AdminShellWithVariant reportCount={reports.length}>{children}</AdminShellWithVariant>
}
