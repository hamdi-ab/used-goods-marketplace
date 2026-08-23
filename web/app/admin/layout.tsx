import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/auth"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminShellWithVariant } from "@/components/admin/admin-shell-with-variant"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()

  return <AdminShellWithVariant>{children}</AdminShellWithVariant>
}
