"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { footerNav, siteName } from "@/lib/nav"

function SiteFooterInner() {
  const searchParams = useSearchParams()

  // PROTOTYPE — the home-page redesign renders its own PrototypeFooter
  // (components/home/prototype/prototype-footer.tsx); stand down here so the
  // two footers do not stack. Removed with the prototype machinery.
  if (searchParams.get("variant")) return null

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <p className="font-heading text-base font-semibold text-foreground">
              {siteName}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A trusted marketplace for buying and selling used goods.
            </p>
          </div>
          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3"
            aria-label="Footer"
          >
            {footerNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export function SiteFooter() {
  // useSearchParams needs a Suspense boundary during prerendering; the inner
  // component reads the variant param to stand down on prototype pages.
  return (
    <Suspense fallback={null}>
      <SiteFooterInner />
    </Suspense>
  )
}