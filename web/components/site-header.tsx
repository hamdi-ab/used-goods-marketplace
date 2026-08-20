"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { primaryNav, siteName } from "@/lib/nav"
import { useAuth } from "@/components/auth/auth-provider"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { MobileNav } from "@/components/mobile-nav"
import { UserMenu } from "@/components/auth/user-menu"

export function SiteHeader() {
  const pathname = usePathname()
  const { role } = useAuth()

  const isAdmin = role === "admin"

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-lg font-semibold text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            V
          </span>
          <span className="hidden sm:inline">{siteName}</span>
        </Link>

        {/* Admins (ADR-020) navigate from the console sidebar; the header
            stays clean instead of showing a lone Home link. */}
        {!isAdmin ? (
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {primaryNav.map((item) => {
              const active = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.title}
                </Link>
              )
            })}
          </nav>
        ) : null}

        <div className="flex items-center gap-2 sm:gap-3">
          {!isAdmin ? (
            <Button asChild variant="outline" size="sm" className="hidden gap-1.5 shadow-xs sm:inline-flex">
              <Link href="/sell">
                <PlusIcon className="size-4" />
                <span>Sell</span>
              </Link>
            </Button>
          ) : null}
          <div className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
          <NotificationBell />
          <UserMenu />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
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
