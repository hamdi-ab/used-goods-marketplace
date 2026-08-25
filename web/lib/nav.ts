import {
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

// Component standards §12 caps primary destinations at 5. Dashboard and
// Profile live in the account menu (components/auth/user-menu.tsx) instead.
//
// Nav is role-scoped: buyers see "My offers" (offers they made), sellers see
// "Incoming offers" (offers they received). This follows the Airbnb pattern
// (Trips vs Reservations) — each role sees only their mental model, no
// cross-contamination, no confusing links to the other role's view.
export function primaryNav(role: UserRole | null): NavItem[] {
  const offers: NavItem =
    role === "seller"
      ? { title: "Incoming offers", href: "/offers/seller", icon: HandshakeIcon }
      : { title: "My offers", href: "/offers", icon: HandshakeIcon }

  return [
    { title: "Home", href: "/", icon: HomeIcon },
    { title: "Browse", href: "/search", icon: LayoutGridIcon },
    { title: "Sell", href: "/sell", icon: PlusIcon },
    offers,
    { title: "Favorites", href: "/favorites", icon: HeartIcon },
  ]
}

export function mobileNav(role: UserRole | null): NavItem[] {
  const offers: NavItem =
    role === "seller"
      ? { title: "Incoming offers", href: "/offers/seller", icon: HandshakeIcon }
      : { title: "My offers", href: "/offers", icon: HandshakeIcon }

  return [
    { title: "Home", href: "/", icon: HomeIcon },
    { title: "Search", href: "/search", icon: SearchIcon },
    { title: "Sell", href: "/sell", icon: PlusIcon },
    offers,
    { title: "Favorites", href: "/favorites", icon: HeartIcon },
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
