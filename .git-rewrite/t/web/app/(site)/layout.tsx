import type { ReactNode } from "react"

import { SiteHeader } from "@/components/home/header"
import { SiteFooter } from "@/components/home/footer"

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className="flex w-full flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  )
}
