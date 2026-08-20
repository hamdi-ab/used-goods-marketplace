import Link from "next/link"

import { cn } from "@/lib/utils"
import { footerNav, siteName } from "@/lib/nav"
import { Button } from "@/components/ui/button"

// PROTOTYPE — footer for the home-page redesign variants. Matches the header:
// light for variant A, light blue for variant B. Adds the logo mark, tagline,
// link columns, and a closing CTA row so the page feels finished top to bottom.
export function PrototypeFooter({
  variant,
  flush = false,
}: {
  variant: "A" | "B"
  flush?: boolean
}) {
  const blue = variant === "B"
  const columns = [footerNav.slice(0, 3), footerNav.slice(3)]

  return (
    <footer
      className={cn(
        "border-t",
        flush ? "" : "mt-16",
        blue
          ? "border-[#2563EB] bg-[#2563EB] text-white"
          : "border-border bg-muted/30"
      )}
    >
      <div className="mx-auto w-full max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr]">
          <div className="max-w-xs">
            <p className="flex items-center gap-2 font-heading text-lg font-semibold">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg text-sm font-bold",
                  blue ? "bg-white text-[#2563EB]" : "bg-primary text-primary-foreground"
                )}
              >
                V
              </span>
              {siteName}
            </p>
            <p className={cn("mt-3 text-sm", blue ? "text-white/90" : "text-foreground/70")}>
              A trusted marketplace for buying and selling used goods across
              Addis Ababa — verified sellers, real reviews, safe meetups.
            </p>
          </div>

          {columns.map((col, i) => (
            <nav key={i} aria-label={i === 0 ? "Footer" : "Legal"} className="text-sm">
              <p
                className={cn(
                  "mb-3 font-heading text-xs font-semibold uppercase tracking-wider",
                  blue ? "text-white/80" : "text-foreground/70"
                )}
              >
                {i === 0 ? "Marketplace" : "Company"}
              </p>
              <ul className="space-y-1">
                {col.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "inline-block py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2",
                        blue
                          ? "text-white/90 hover:text-white focus-visible:ring-white"
                          : "text-foreground/70 hover:text-foreground focus-visible:ring-primary"
                      )}
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
            <p className={cn("text-sm", blue ? "text-white/90" : "text-foreground/70")}>
              List an item in minutes and reach verified local buyers today.
            </p>
            <Button
              asChild
              className={cn(
                blue
                  ? "bg-white text-[#2563EB] hover:bg-white/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Link href="/sell">Start selling</Link>
            </Button>
          </div>
        </div>

        <p
          className={cn(
            "mt-10 border-t pt-4 text-xs",
            blue ? "border-white/20 text-white/80" : "border-border text-foreground/70"
          )}
        >
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}