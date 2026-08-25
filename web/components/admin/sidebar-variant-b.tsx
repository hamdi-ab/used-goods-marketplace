"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import {
  HomeIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ShieldCheckIcon,
  UsersIcon,
  BarChart3Icon,
  FlagIcon,
  AlertTriangleIcon,
  BanknoteIcon,
  UserPlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface NavItem {
  title: string
  href: string
  icon: LucideIcon | null
  badge?: number
}

interface NavSection {
  label: string
  items: NavItem[]
}

const sections: NavSection[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, badge: 0 },
      { title: "Statistics", href: "/admin/statistics", icon: BarChart3Icon, badge: 0 },
    ],
  },
  {
    label: "Moderation",
    items: [
      { title: "Reports", href: "/admin/reports", icon: FlagIcon, badge: 3 },
      { title: "Disputes", href: "/admin/disputes", icon: AlertTriangleIcon, badge: 0 },
      { title: "Withdrawals", href: "/admin/withdrawals", icon: BanknoteIcon, badge: 0 },
      { title: "Verifications", href: "/admin/verifications", icon: ShieldCheckIcon, badge: 0 },
    ],
  },
  {
    label: "Manage",
    items: [
      { title: "Users", href: "/admin/users", icon: UsersIcon, badge: 0 },
      { title: "Listings", href: "/admin/listings", icon: PackageIcon, badge: 0 },
      { title: "Business Leads", href: "/admin/business-leads", icon: UserPlusIcon, badge: 0 },
    ],
  },
]

export function SidebarVariantB() {
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

      {/* View Site link */}
      <div className="px-3 pb-1">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
            pathname === "/" ? "bg-primary/10 text-primary" : "font-semibold text-muted-foreground"
          )}
        >
          <HomeIcon className="size-[18px]" />
          View Site
        </Link>
      </div>

      {/* Nav with sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav aria-label="Admin" className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href
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
                      {item.icon ? <item.icon className="size-[18px]" /> : null}
                      {item.title}
                      {(item.badge ?? 0) > 0 ? (
                        <Badge variant="secondary" className="ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[0.65rem]">
                          {item.badge}
                        </Badge>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
