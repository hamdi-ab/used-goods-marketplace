import Link from "next/link"

import { cn } from "@/lib/utils"
import { footerNav, siteName } from "@/lib/nav"
import { Button } from "@/components/ui/button"

export function SiteFooter({ flush = false }: { flush?: boolean }) {
  const columns = [footerNav.slice(0, 3), footerNav.slice(3)]

  return (
    <footer
      className={cn(
        "border-t border-[#2563EB] bg-[#2563EB] text-white",
        flush ? "" : "mt-16"
      )}
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <p className="flex items-center gap-2 font-heading text-lg font-semibold">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1">
                <svg
                  viewBox="0 0 24 24"
                  className="size-6 text-[#2563EB]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
                </svg>
              </span>
              {siteName}
            </p>
            <p className="mt-3 text-sm text-white/90">
              A trusted marketplace for buying and selling second-hand goods across
              Ethiopia — verified sellers, real reviews, safe meetups.
            </p>
          </div>

          {columns.map((col, i) => (
            <nav key={i} aria-label={i === 0 ? "Footer" : "Legal"} className="text-sm">
              <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-wider text-white/80">
                {i === 0 ? "Marketplace" : "Company"}
              </p>
              <ul className="space-y-1">
                {col.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-block py-1.5 text-white/90 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="flex flex-col items-start justify-center gap-3 rounded-2xl p-5 ring-1 ring-white/15">
            <p className="font-heading text-base font-semibold">
              Got something to sell?
            </p>
            <p className="text-sm text-white/90">
              List an item in minutes and reach verified local buyers today.
            </p>
            <Button
              asChild
              className="bg-white text-[#2563EB] hover:bg-white/90"
            >
              <Link href="/sell">Start selling</Link>
            </Button>
          </div>
        </div>

        <p className="mt-10 border-t border-white/20 pt-4 text-xs text-white/90">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
