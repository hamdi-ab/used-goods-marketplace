"use client"

import { LogOutIcon } from "lucide-react"

import type { SessionUser } from "@/lib/auth/types"
import { initials } from "@/lib/utils"
import { useSignOut } from "@/components/auth/use-sign-out"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AdminAccountForm({
  user,
  fullName,
}: {
  user: SessionUser
  fullName: string | null
}) {
  const signOut = useSignOut()

  const name = fullName ?? user.fullName ?? user.email

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Account
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Your moderator identity. Admins are moderation-only, so trading
          profile fields do not apply here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-base">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">{name}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Name and email are set at signup and cannot be changed here. Admins
            have no public marketplace profile.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void signOut()}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOutIcon className="mr-2 size-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}