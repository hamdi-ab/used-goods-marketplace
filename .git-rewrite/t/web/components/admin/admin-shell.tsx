"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { LogOutIcon, MenuIcon } from "lucide-react"

import { siteName } from "@/lib/nav"
import { initials } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { useSignOut } from "@/components/auth/use-sign-out"
import { AdminNav } from "@/components/admin/admin-nav"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

function AdminBrand() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 px-5 py-5 font-heading text-lg font-semibold text-foreground">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        V
      </span>
      <span className="hidden sm:inline">{siteName}</span>
    </Link>
  )
}

function AdminUserFooter() {
  const { user, loading } = useAuth()
  const signOut = useSignOut()

  if (loading) {
    return (
      <div className="border-t border-border p-4">
        <div className="size-9 animate-pulse rounded-full bg-muted" aria-hidden />
      </div>
    )
  }

  if (!user) return null

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email

  return (
    <div className="border-t border-border p-3">
      <Link
        href="/admin/account"
        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
      >
        <Avatar className="size-9">
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        className="mt-1 w-full justify-start text-muted-foreground hover:text-destructive"
        onClick={() => void signOut()}
      >
        <LogOutIcon className="size-4" />
        Sign out
      </Button>
    </div>
  )
}

function AdminSidebar() {
  return (
    <div className="flex h-full flex-col">
      <AdminBrand />
      <div className="flex-1 overflow-y-auto px-3">
        <AdminNav />
      </div>
      <AdminUserFooter />
    </div>
  )
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-background lg:block">
        <AdminSidebar />
      </aside>

      <div className="flex min-h-full flex-col lg:pl-64">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:backdrop-blur lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open admin menu">
                <MenuIcon className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <span className="font-heading text-base font-semibold text-foreground">
            Admin
          </span>
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
