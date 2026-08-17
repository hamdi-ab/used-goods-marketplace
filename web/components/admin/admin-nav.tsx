"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminNav } from "@/lib/nav"
import { cn } from "@/lib/utils"

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Admin
      </p>
      {adminNav.map((item) => {
        const isHome = item.href === "/"
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <div key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
                isHome && !active && "font-semibold text-foreground"
              )}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {isHome ? "View Site" : item.title}
            </Link>
            {isHome ? (
              <div className="my-2 h-px bg-border" aria-hidden="true" />
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
