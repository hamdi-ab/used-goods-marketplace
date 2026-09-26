import {
  BanknoteIcon,
  HomeIcon,
  SearchIcon,
  PlusIcon,
  HeartIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  UsersIcon,
  PackageIcon,
  FlagIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  UserCogIcon,
  LayoutGridIcon,
  ListIcon,
  type LucideIcon,
} from "lucide-react"
import type { UserRole } from "@/lib/auth/types"

export type NavItem = {
  title: string
  href: string
  icon?: LucideIcon
}

export const siteName = "Dagim Gebeya"

// The login redirect target shared by signed-out CTAs (heart, make an offer,
// contact seller, report). Login honors a `?next=` query param (see
// app/login/page.tsx), so a signed-out visitor lands back on the exact page
// after signing in. One definition, re-exported per domain so client
// components need no URL-building logic.
export function buildLoginUrl(pathname: string): string {
  return `/login?next=${encodeURIComponent(pathname)}`
}

// Primary nav is capped at 3 items (Browse, Activity, Sell). The Account
// menu lives in the user-menu dropdown. Admin sees only Browse.
//
// Activity is a unified hub for all user actions — outgoing offers, incoming
// offers, favorites, dashboard. The entry currently points to /offers as a
// placeholder; when the ActivitySection component lands it will render a
// tabbed view at the same route.
export function primaryNav(role: UserRole | null): NavItem[] {
  if (role === "admin") {
    return [
      { title: "Browse", href: "/search", icon: LayoutGridIcon },
    ]
  }

  return [
    { title: "Browse", href: "/search", icon: LayoutGridIcon },
    { title: "Activity", href: "/activity", icon: ListIcon },
    { title: "Sell", href: "/sell", icon: PlusIcon },
  ]
}

export function mobileNav(role: UserRole | null): NavItem[] {
  if (role === "admin") {
    return [
      { title: "Browse", href: "/search", icon: SearchIcon },
    ]
  }

  return [
    { title: "Browse", href: "/search", icon: SearchIcon },
    { title: "Activity", href: "/activity", icon: ListIcon },
    { title: "Sell", href: "/sell", icon: PlusIcon },
  ]
}

export const footerNav: NavItem[] = [
  { title: "About", href: "/about" },
  { title: "Help Center", href: "/help" },
  { title: "Pricing", href: "/pricing" },
  { title: "Safety Tips", href: "/safety" },
  { title: "Terms of Service", href: "/terms" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Contact", href: "/contact" },
]

// Admin shell navigation (components/admin/admin-nav.tsx). The first item
// href "/" renders as "View Site" with a divider; everything else maps to an
// admin route. adminAccountNav is the bottom account section.
export const adminNav: NavItem[] = [
  { title: "View Site", href: "/" },
  { title: "Overview", href: "/admin", icon: LayoutDashboardIcon },
  { title: "Users", href: "/admin/users", icon: UsersIcon },
  { title: "Listings", href: "/admin/listings", icon: PackageIcon },
  { title: "Reports", href: "/admin/reports", icon: FlagIcon },
  { title: "Statistics", href: "/admin/statistics", icon: BarChart3Icon },
  { title: "Verifications", href: "/admin/verifications", icon: ShieldCheckIcon },
]

export const adminAccountNav: NavItem[] = [
  { title: "Account", href: "/admin/account", icon: UserCogIcon },
]
