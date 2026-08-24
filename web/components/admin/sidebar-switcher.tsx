"use client"

import Link from "next/link"
import { LogOutIcon } from "lucide-react"

import { initials } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { useSignOut } from "@/components/auth/use-sign-out"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { SidebarVariantA } from "@/components/admin/sidebar-variant-a"
import { SidebarVariantB } from "@/components/admin/sidebar-variant-b"

function UserFooter() {
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
        className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
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

interface SidebarSwitcherProps {
  variant: "A" | "B"
}

export function SidebarSwitcher({ variant }: SidebarSwitcherProps) {
  return (
    <div className="flex h-full flex-col">
      {variant === "A" ? <SidebarVariantA /> : <SidebarVariantB />}
      <UserFooter />
    </div>
  )
}
