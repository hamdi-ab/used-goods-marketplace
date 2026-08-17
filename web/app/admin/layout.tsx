import type { ReactNode } from "react"

import { requireAdmin } from "@/lib/auth"
import { AdminNav } from "@/components/admin/admin-nav"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireAdmin()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <aside className="hidden w-52 shrink-0 md:block">
        <AdminNav />
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
