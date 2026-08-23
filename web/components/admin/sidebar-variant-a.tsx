"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ListIcon,
  PackageIcon,
  ShieldCheckIcon,
  UsersIcon,
  BarChart3Icon,
  FlagIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const navSections = [
  { key: "overview", label: "Overview" },
  { key: "moderation", label: "Moderation" },
  { key: "manage", label: "Manage" },
] as const

const navItems = [
  { title: "View Site", href: "/", icon: null, section: null },
  { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, section: "overview", badge: 0 },
  { title: "Statistics", href: "/admin/statistics", icon: BarChart3Icon, section: "overview", badge: 0 },
  { title: "Reports", href: "/admin/reports", icon: FlagIcon, section: "moderation", badge: 3 },
  { title: "Verifications", href: "/admin/verifications", icon: ShieldCheckIcon, section: "moderation", badge: 0 },
  { title: "Users", href: "/admin/users", icon: UsersIcon, section: "manage", badge: 0 },
  { title: "Listings", href: "/admin/listings", icon: PackageIcon, section: "manage", badge: 0 },
] as const

export function SidebarVariantA() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 px-5 py-5 font-heading text-lg font-semibold text-foreground"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          V
        </span>
        <span className="hidden sm:inline">Dagim Gebeya</span>
      </Link>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav aria-label="Admin" className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const isHome = item.href === "/"
            const active = pathname === item.href
            const Icon = item.icon

            if (isHome) {
              return (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                      "font-semibold text-muted-foreground"
                    )}
                  >
                    <HomeIcon className="size-[18px]" />
                    View Site
                  </Link>
                  <div className="my-2 h-px bg-border" aria-hidden="true" />
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                {Icon ? <Icon className="size-[18px]" /> : null}
                {item.title}
                {item.badge > 0 ? (
                  <Badge variant="secondary" className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[0.65rem]">
                    {item.badge}
                  </Badge>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ChevronLeftIcon className="size-4" />
          <span className="hidden sm:inline">Collapse sidebar</span>
        </button>
      </div>
    </div>
  )
}
