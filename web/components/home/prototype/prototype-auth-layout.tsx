import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { PrototypeHeader } from "./prototype-header"
import { PrototypeFooter } from "./prototype-footer"

// PROTOTYPE — Option 1 auth frame for the redesign variants: centered card on
// the variant's brand backdrop, with the matching header + footer and a slim
// trust tick row under the card. Light backdrop for A, brand blue for B.
const TRUST: { title: string; icon: string }[] = [
  { title: "Phone + Fayda ID verification", icon: "✓" },
  { title: "Public reviews & trust score", icon: "★" },
  { title: "Safe local meetups", icon: "✓" },
]

export function PrototypeAuthLayout({
  variant,
  title,
  description,
  footer,
  children,
}: {
  variant: "A" | "B"
  title: string
  description: string
  footer?: ReactNode
  children: ReactNode
}) {
  const blue = variant === "B"

  return (
    <div className="flex min-h-screen flex-col">
      <PrototypeHeader variant={variant} />
      <main
        className={cn(
          "flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8",
          blue
            ? "bg-gradient-to-b from-[#DBEAFE] to-[#EFF6FF]"
            : "bg-gradient-to-b from-[#f8fafc] to-[#eef2f7]"
        )}
      >
        <div className="w-full max-w-sm">
          <div
            className={cn(
              "mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl text-lg font-bold shadow-md",
              blue
                ? "bg-[#2563EB] text-white shadow-[#2563EB]/30"
                : "bg-primary text-primary-foreground"
            )}
            aria-hidden="true"
          >
            V
          </div>
          <p
            className={cn(
              "mb-4 text-center font-heading text-sm font-semibold",
              blue ? "text-primary" : "text-muted-foreground"
            )}
          >
            {title}
          </p>
          <div
            className={cn(
              "rounded-2xl border bg-card p-6 shadow-lg sm:p-8",
              blue ? "border-white/20 shadow-[#172554]/25" : "border-border"
            )}
          >
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {description}
            </p>
            {children}
            {footer ? (
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {footer}
              </p>
            ) : null}
          </div>
          <div
            className={cn(
              "mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium",
              blue ? "text-primary" : "text-muted-foreground"
            )}
          >
            {TRUST.map((t) => (
              <span key={t.title} className="inline-flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
              {t.icon}
            </span>
                {t.title}
              </span>
            ))}
          </div>
        </div>
      </main>
      <PrototypeFooter variant={variant} flush />
    </div>
  )
}