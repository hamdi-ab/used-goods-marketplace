import {
  BarChart3Icon,
  BadgeCheckIcon,
  FlagIcon,
  HandshakeIcon,
  HeartIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon?: LucideIcon
}

export const siteName = "VinTech Marketplace"

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
export const primaryNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Browse", href: "/search" },
  { title: "Sell", href: "/sell" },
  { title: "Offers", href: "/offers" },
  { title: "Favorites", href: "/favorites" },
]

export const mobileNav: NavItem[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Search", href: "/search", icon: SearchIcon },
  { title: "Sell", href: "/sell", icon: PlusIcon },
  { title: "Offers", href: "/offers", icon: HandshakeIcon },
  { title: "Favorites", href: "/favorites", icon: HeartIcon },
]

// Admins are moderation-only (ADR-020): the top header shows no nav (it would
// be a lone Home link), so Home leads the console nav itself — a view-site
// door on top of the /admin sidebar sections.
export const adminNav: NavItem[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon },
  { title: "Users", href: "/admin/users", icon: UsersIcon },
  { title: "Listings", href: "/admin/listings", icon: ListIcon },
  { title: "Reports", href: "/admin/reports", icon: FlagIcon },
  { title: "Verifications", href: "/admin/verifications", icon: BadgeCheckIcon },
  { title: "Statistics", href: "/admin/statistics", icon: BarChart3Icon },
]

// Utility section pinned below the primary nav (component standards: settings
// and account live at the sidebar bottom, styled quietly and set apart).
export const adminAccountNav: NavItem[] = [
  { title: "Account", href: "/admin/account", icon: SettingsIcon },
]

export const footerNav: NavItem[] = [
  { title: "About", href: "/about" },
  { title: "Help Center", href: "/help" },
  { title: "Safety Tips", href: "/safety" },
  { title: "Terms of Service", href: "/terms" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Contact", href: "/contact" },
]
