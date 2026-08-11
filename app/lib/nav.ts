import {
  HomeIcon,
  SearchIcon,
  PlusIcon,
  HeartIcon,
  UserIcon,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon?: LucideIcon
}

export const siteName = "VinTech Marketplace"

export const primaryNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Browse", href: "/search" },
  { title: "Sell", href: "/sell" },
  { title: "Favorites", href: "/favorites" },
  { title: "Dashboard", href: "/dashboard" },
  { title: "Profile", href: "/profile" },
]

export const mobileNav: NavItem[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Search", href: "/search", icon: SearchIcon },
  { title: "Sell", href: "/sell", icon: PlusIcon },
  { title: "Favorites", href: "/favorites", icon: HeartIcon },
  { title: "Profile", href: "/profile", icon: UserIcon },
]

export const footerNav: NavItem[] = [
  { title: "About", href: "/about" },
  { title: "Help Center", href: "/help" },
  { title: "Safety Tips", href: "/safety" },
  { title: "Terms of Service", href: "/terms" },
  { title: "Privacy Policy", href: "/privacy" },
  { title: "Contact", href: "/contact" },
]
