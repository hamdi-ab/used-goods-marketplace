"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { adminNav, mobileNav } from "@/lib/nav"
import { useAuth } from "@/components/auth/auth-provider"

export function MobileNav() {
  const pathname = usePathname()
  const { role } = useAuth()

  // Admins are moderation-only (ADR-020): the console sidebar is their
  // navigation, so the mobile sheet shows only a home link.
  const nav = role === "admin" ? adminNav : mobileNav

  return (
    <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
      {nav.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-5" /> : null}
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
