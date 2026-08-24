"use client"

import type { ReactNode } from "react"
import { MenuIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarSwitcher } from "@/components/admin/sidebar-switcher"
import { DockVariantC } from "@/components/admin/dock-variant-c"

function AdminSidebar({ variant }: { variant: "A" | "B" }) {
  return (
    <div className="flex h-full flex-col">
      <SidebarSwitcher variant={variant} />
    </div>
  )
}

interface AdminShellProps {
  children: ReactNode
  variant?: "A" | "B" | "C"
}

export function AdminShell({ children, variant = "B" }: AdminShellProps) {
  if (variant === "C") {
    return <DockVariantC>{children}</DockVariantC>
  }

  return (
    <div className="min-h-full bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-background lg:block">
        <AdminSidebar variant={variant} />
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
              <AdminSidebar variant={variant} />
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
