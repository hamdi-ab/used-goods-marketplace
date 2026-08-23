import type { ReactNode } from "react"
import Link from "next/link"
import { ShieldCheckIcon, StarIcon, MapPinIcon } from "lucide-react"

const TRUST_ITEMS: { title: string; icon: ReactNode }[] = [
  { title: "Phone + Fayda ID verification", icon: <ShieldCheckIcon className="size-3.5" /> },
  { title: "Public reviews & trust score", icon: <StarIcon className="size-3.5" /> },
  { title: "Safe local meetups", icon: <MapPinIcon className="size-3.5" /> },
]

function MarketplaceLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
    </svg>
  )
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
      <div className="w-full max-w-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#2563EB] shadow-md shadow-[#2563EB]/30" aria-hidden="true">
          <MarketplaceLogo />
        </div>
        <p className="mb-2 text-center font-heading text-sm font-semibold text-[#2563EB]">
          {title}
        </p>
        <div className="rounded-2xl border border-white/20 bg-card p-6 shadow-lg shadow-[#172554]/15 sm:p-8">
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#2563EB]">
          {TRUST_ITEMS.map((t) => (
            <span key={t.title} className="inline-flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded-full bg-[#2563EB]/10">
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
