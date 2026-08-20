"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HandshakeIcon, HeartIcon, HomeIcon, LayoutGridIcon, MenuIcon, SearchIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteName } from "@/lib/nav"
import { withVariant } from "@/components/search/prototype-utils"
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

// PROTOTYPE — header for the home-page redesign variants. Full 5-slot bar:
// logo, icon nav links with accent-underline active state, compact search
// pill, then the action cluster (Sell always visible; Log in ghost + Sign up
// outline when signed out). Variant A keeps the light bar; variant B uses a
// lighter-blue bar (not the old dark navy).
export function PrototypeHeader({ variant }: { variant: "A" | "B" }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const blue = variant === "B"

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b",
        blue
          ? "border-[#2563EB] bg-[#2563EB] text-white"
          : "border-border bg-background/95 backdrop-blur supports-backdrop-filter:backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-md font-heading text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            blue
              ? "text-white focus-visible:ring-white/60"
              : "text-foreground focus-visible:ring-primary/60"
          )}
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-sm font-bold",
              blue ? "bg-white text-[#2563EB]" : "bg-primary text-primary-foreground"
            )}
          >
            V
          </span>
          <span className="hidden sm:inline">{siteName}</span>
        </Link>

        <nav
          className={cn("hidden items-center gap-0.5 lg:flex", blue && "text-white")}
          aria-label="Primary"
        >
          {NAV.map((item) => {
            const active = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                  blue
                    ? "focus-visible:ring-white/60"
                    : "focus-visible:ring-primary/60",
                  active
                    ? blue
                      ? "text-white"
                      : "text-primary"
                    : blue
                      ? "text-white/90 hover:bg-white/10 hover:text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {item.title}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-0.5 rounded-full transition-transform",
                    blue ? "bg-white" : "bg-primary",
                    active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Link
            href="/search"
            className={cn(
              "hidden w-56 items-center gap-2 rounded-full px-3.5 py-2 text-sm transition-colors md:flex",
              blue
                ? "bg-white/15 text-white/90 hover:bg-white/25"
                : "bg-muted text-foreground/70 hover:bg-muted/70"
            )}
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="truncate">Search listings&hellip;</span>
          </Link>

          {user ? (
            <>
              <NotificationBell
                tone={blue ? "blue" : "light"}
                href={withVariant("/notifications", variant)}
              />
              <Button
                asChild
                className={cn(
                  "hidden sm:inline-flex",
                  blue
                    ? "bg-white text-[#2563EB] hover:bg-white/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Link href="/sell">Sell</Link>
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className={cn(
                  "hidden sm:inline-flex",
                  blue && "text-white hover:bg-white/10"
                )}
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className={cn(
                  "hidden sm:inline-flex",
                  blue && "border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <Link href="/register">Sign up</Link>
              </Button>
              <Button
                asChild
                className={cn(
                  blue
                    ? "bg-white text-[#2563EB] hover:bg-white/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
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
                className={cn(
                  "lg:hidden",
                  blue && "border-white/30 bg-transparent text-white hover:bg-white/10"
                )}
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