"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { adminAccountNav, adminNav } from "@/lib/nav"
import { cn } from "@/lib/utils"

function NavList({ items }: { items: typeof adminNav }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => {
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
    </div>
  )
}

export function AdminNav() {
  return (
    <nav aria-label="Admin" className="flex h-full flex-col justify-between gap-6">
      <div>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <NavList items={adminNav} />
      </div>
      <div>
        <div className="mx-3 mb-2 h-px bg-border" aria-hidden="true" />
        <NavList items={adminAccountNav} />
      </div>
    </nav>
  )
}
