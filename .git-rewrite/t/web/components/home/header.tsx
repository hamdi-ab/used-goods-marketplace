"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { HandshakeIcon, HeartIcon, HomeIcon, LayoutGridIcon, MenuIcon, SearchIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteName } from "@/lib/nav"
import { useAuth } from "@/components/auth/auth-provider"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/auth/user-menu"

const NAV: { title: string; href: string; icon: LucideIcon }[] = [
  { title: "Home", href: "/", icon: HomeIcon },
  { title: "Browse", href: "/search", icon: LayoutGridIcon },
  { title: "Offers", href: "/offers", icon: HandshakeIcon },
  { title: "Favorites", href: "/favorites", icon: HeartIcon },
]

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2563EB] bg-[#2563EB] text-white">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md font-heading text-lg font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-white p-1">
            <svg
              viewBox="0 0 24 24"
              className="size-6 text-[#2563EB]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
            </svg>
          </span>
          <span className="hidden sm:inline">{siteName}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex text-white" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  active
                    ? "text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="size-4" />
                {item.title}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-white transition-transform",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <form
            onSubmit={handleSearch}
            className="hidden w-56 items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-sm text-white/90 md:flex"
          >
            <SearchIcon className="size-4 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search listings..."
              className="w-full bg-transparent text-white outline-none placeholder:text-current"
            />
          </form>

          {user ? (
            <>
              <NotificationBell tone="blue" href="/notifications" />
              <Button
                asChild
                className="hidden sm:inline-flex bg-white text-[#2563EB] hover:bg-white/90"
              >
                <Link href="/sell">Sell</Link>
              </Button>
              <UserMenu tone="blue" />
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden sm:inline-flex text-white hover:bg-white/10"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="hidden sm:inline-flex border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/register">Sign up</Link>
              </Button>
              <Button
                asChild
                className="bg-white text-[#2563EB] hover:bg-white/90"
              >
                <Link href="/sell">Sell</Link>
              </Button>
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden border-white/30 bg-transparent text-white hover:bg-white/10"
                aria-label="Open menu"
              >
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <MobileNav />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
