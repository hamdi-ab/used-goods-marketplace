"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3Icon,
  FlagIcon,
  LayoutDashboardIcon,
  ListIcon,
  UsersIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

const adminNav = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon },
  { title: "Users", href: "/admin/users", icon: UsersIcon },
  { title: "Listings", href: "/admin/listings", icon: ListIcon },
  { title: "Reports", href: "/admin/reports", icon: FlagIcon },
  { title: "Statistics", href: "/admin/statistics", icon: BarChart3Icon },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="sticky top-24 flex flex-col gap-1">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Admin
      </p>
      {adminNav.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
