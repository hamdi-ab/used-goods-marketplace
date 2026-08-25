"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { adminNav, mobileNav } from "@/lib/nav"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function MobileNav() {
  const pathname = usePathname()
  const { user, role } = useAuth()

  const nav = role === "admin" ? adminNav : mobileNav(role)

  return (
    <nav className="flex flex-col gap-1 p-4" aria-label="Mobile">
      {/* Search bar at top of mobile menu */}
      <div className="mb-2">
        <form action="/search" className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Search listings..."
            className="pl-10"
          />
        </form>
      </div>

      {nav.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {Icon ? <Icon className="size-5" /> : null}
            {item.title}
          </Link>
        )
      })}

      {/* Auth links when signed out */}
      {!user ? (
        <div className="mt-4 border-t pt-4 space-y-2">
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Sign up
          </Link>
        </div>
      ) : (
        <div className="mt-4 border-t pt-4">
          <Link
            href="/sell"
            className="flex items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Start selling
          </Link>
        </div>
      )}
    </nav>
  )
}
