"use client"

import Link from "next/link"
import {
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  PlusIcon,
  UserRoundIcon,
  FlagIcon,
  ChevronRightIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useSignOut } from "@/components/auth/use-sign-out"
import { initials } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu({ tone = "light" }: { tone?: "light" | "blue" }) {
  const { user, loading } = useAuth()
  const signOut = useSignOut()

  if (loading) {
    return <div className="size-9 animate-pulse rounded-full bg-muted" aria-hidden />
  }

  if (!user) {
    return null
  }

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Avatar className="size-9 cursor-pointer ring-2 ring-background transition-opacity hover:opacity-80">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className={cn(
            "text-sm font-medium",
            tone === "blue"
              ? "bg-white/20 text-white"
              : "bg-primary text-primary-foreground"
          )}>
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2" sideOffset={8}>
        {/* User header */}
        <div className="flex items-center gap-3 rounded-lg px-2 py-2 mb-1">
          <Avatar className="size-10">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
            <AvatarFallback className="bg-primary text-sm font-medium text-primary-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Account section */}
        <div>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
              <UserRoundIcon className="size-4 text-muted-foreground" />
              <span className="flex-1">Profile</span>
              <ChevronRightIcon className="size-4 text-muted-foreground/50" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
              <LayoutDashboardIcon className="size-4 text-muted-foreground" />
              <span className="flex-1">Dashboard</span>
              <ChevronRightIcon className="size-4 text-muted-foreground/50" />
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Activity section */}
        <div>
          <DropdownMenuItem asChild>
            <Link href="/favorites" className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
              <HeartIcon className="size-4 text-muted-foreground" />
              <span className="flex-1">Favorites</span>
              <ChevronRightIcon className="size-4 text-muted-foreground/50" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/reports" className="flex items-center gap-3 rounded-md px-2 py-2 text-sm">
              <FlagIcon className="size-4 text-muted-foreground" />
              <span className="flex-1">My reports</span>
              <ChevronRightIcon className="size-4 text-muted-foreground/50" />
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="my-1" />

        {/* Sell action */}
        <DropdownMenuItem asChild>
          <Link href="/sell" className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-primary">
            <PlusIcon className="size-4" />
            <span className="flex-1">Sell an item</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        {/* Sign out */}
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOutIcon className="size-4" />
          <span className="flex-1">Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
