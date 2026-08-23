"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MenuIcon, LogOutIcon } from "lucide-react"

import { initials } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { useSignOut } from "@/components/auth/use-sign-out"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  HomeIcon,
  LayoutDashboardIcon,
  BarChart3Icon,
  FlagIcon,
  ShieldCheckIcon,
  UsersIcon,
  PackageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const dockItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, badge: 0 },
  { title: "Statistics", href: "/admin/statistics", icon: BarChart3Icon, badge: 0 },
  { title: "Reports", href: "/admin/reports", icon: FlagIcon, badge: 3 },
  { title: "Verifications", href: "/admin/verifications", icon: ShieldCheckIcon, badge: 0 },
  { title: "Users", href: "/admin/users", icon: UsersIcon, badge: 0 },
  { title: "Listings", href: "/admin/listings", icon: PackageIcon, badge: 0 },
] as const

function DockBar() {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex items-center justify-center gap-1">
      {dockItems.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center gap-0.5 rounded-xl px-3.5 py-1.5 transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="relative">
              <item.icon className="size-[18px]" />
              {(item.badge ?? 0) > 0 ? (
                <span className="absolute -right-2 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[0.55rem] font-bold text-primary-foreground">
                  {item.badge}
                </span>
              ) : null}
            </div>
            <span className="text-[0.6rem] font-medium">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function DockUserFooter() {
  const { user, loading } = useAuth()
  const signOut = useSignOut()

  if (loading || !user) return null

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email

  return (
    <div className="flex items-center gap-3 px-3">
      <Avatar className="size-7">
        <AvatarFallback className="text-[0.65rem]">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{name}</p>
        <p className="truncate text-[0.65rem] text-muted-foreground">{user.email}</p>
      </div>
      <button
        onClick={() => void signOut()}
        className="text-muted-foreground transition-colors hover:text-destructive"
        aria-label="Sign out"
      >
        <LogOutIcon className="size-4" />
      </button>
    </div>
  )
}

export function DockVariantC({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-muted/30 pb-16">
      {/* Desktop: top bar with mobile menu */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:backdrop-blur">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open admin menu" className="lg:hidden">
              <MenuIcon className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Admin menu</SheetTitle>
            <div className="flex h-full flex-col p-4">
              <p className="mb-4 font-heading text-lg font-semibold">Admin</p>
              <div className="flex flex-col gap-1">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <HomeIcon className="size-[18px]" />
                  View Site
                </Link>
                {dockItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <item.icon className="size-[18px]" />
                    {item.title}
                  </Link>
                ))}
              </div>
              <div className="mt-auto border-t border-border pt-3">
                <DockUserFooter />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <span className="font-heading text-base font-semibold text-foreground">Admin</span>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* Bottom dock — desktop only */}
      <div className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-border bg-background/95 backdrop-blur supports-backdrop-filter:backdrop-blur lg:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <DockBar />
          <DockUserFooter />
        </div>
      </div>
    </div>
  )
}
