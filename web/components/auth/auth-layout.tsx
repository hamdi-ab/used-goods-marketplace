import type { ReactNode } from "react"
import Link from "next/link"
import { ShieldCheckIcon, StarIcon, MapPinIcon } from "lucide-react"

const TRUST_ITEMS: { title: string; icon: ReactNode }[] = [
  { title: "Phone + Fayda ID verification", icon: <ShieldCheckIcon className="size-3.5" /> },
  { title: "Public reviews & trust score", icon: <StarIcon className="size-3.5" /> },
  { title: "Safe local meetups", icon: <MapPinIcon className="size-3.5" /> },
]

import DagimLogo from "@/components/brand/dagim-logo"

function MarketplaceLogo() {
  return <DagimLogo width={28} height={28} />
}

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm fade-up">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#2563EB] shadow-md shadow-[#2563EB]/30" aria-hidden="true">
          <MarketplaceLogo />
        </div>
        <p className="mb-2 text-center font-heading text-sm font-semibold text-[#2563EB]">
          {title}
        </p>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
          {description ? (
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
          {children}
          {footer ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
          {TRUST_ITEMS.map((t) => (
            <span key={t.title} className="inline-flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-primary">
                {t.icon}
              </span>
              {t.title}
            </span>
          ))}
        </div>
      </div>
    </main>
  )
}
