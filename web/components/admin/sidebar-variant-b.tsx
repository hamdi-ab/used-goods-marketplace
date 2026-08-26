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
  LogOutIcon,
  UserIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useSignOut } from "@/components/auth/use-sign-out"
import { useAuth } from "@/components/auth/auth-provider"
import { initials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import DagimLogo from "@/components/brand/dagim-logo"

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

const buildSections = (reportCount: number): NavSection[] => [
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
      { title: "Reports", href: "/admin/reports", icon: FlagIcon, badge: reportCount },
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

interface SidebarVariantBProps {
  reportCount: number
}

export function SidebarVariantB({ reportCount }: SidebarVariantBProps) {
  const pathname = usePathname()
  const sections = buildSections(reportCount)
  const signOut = useSignOut()
  const { user } = useAuth()

  const email = user?.email ?? ""
  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? email
  const name = fullName || email

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 px-5 py-5 font-heading text-lg font-semibold text-foreground"
      >
        <DagimLogo width={32} height={32} />
        <span className="hidden sm:inline">Dagim Gebeya</span>
      </Link>

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

      {/* User section */}
      <div className="border-t border-border p-3">
        <Link
          href="/admin/account"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted",
            pathname === "/admin/account" ? "bg-primary/10" : ""
          )}
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOutIcon className="size-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  )
}
