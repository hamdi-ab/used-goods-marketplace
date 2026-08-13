import {
  HomeIcon,
  SearchIcon,
  PlusIcon,
  HeartIcon,
  HandshakeIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon?: LucideIcon
}

export const siteName = "VinTech Marketplace"

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

export const footerNav: NavItem[] = [
  { title: "About", href: "/about" },
  { title: "Help Center", href: "/help" },
  { title: "Safety Tips", href: "/safety" },
  { title: "Terms of Service", href: "/terms" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Contact", href: "/contact" },
]
