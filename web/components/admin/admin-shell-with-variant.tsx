"use client"

import type { ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import { AdminPrototypeSwitcher } from "@/components/admin/prototype-switcher"

type Variant = "A" | "B" | "C"

export function AdminShellWithVariant({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const raw = searchParams.get("variant")
  const variant: Variant = raw === "A" || raw === "B" || raw === "C" ? raw : "B"

  return (
    <>
      <AdminShell variant={variant}>{children}</AdminShell>
      <AdminPrototypeSwitcher />
    </>
  )
}
