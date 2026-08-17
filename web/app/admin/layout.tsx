import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/auth"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()

  return <AdminShell>{children}</AdminShell>
}
