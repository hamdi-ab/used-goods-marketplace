"use client"

import { useRef, useState, type ChangeEvent } from "react"
import { LogOutIcon } from "lucide-react"
import Link from "next/link"

import type { SessionUser } from "@/lib/auth/types"
import { initials } from "@/lib/utils"
import { useSignOut } from "@/components/auth/use-sign-out"
import { uploadAvatar } from "@/app/actions/profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AccountProfile = {
  avatar_url: string | null
  full_name: string | null
  role: "buyer" | "seller" | "admin" | null
}

export function AdminAccountForm({
  user,
  profile,
}: {
  user: SessionUser
  profile: AccountProfile
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const signOut = useSignOut()

  const name = profile.full_name ?? user.fullName ?? user.email

  async function handleAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setAvatarError(null)
    const form = new FormData()
    form.set("avatar", file)
    const res = await uploadAvatar(user.id, { url: null, error: null }, form)
    setAvatarUploading(false)
    if (res.error) setAvatarError(res.error)
    else setAvatarUrl(res.url)
  }

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

      <Card className="mb-6 gap-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Avatar</CardTitle>
          <div className="flex items-center gap-3">
            <Avatar className="size-16">
              <AvatarImage src={avatarUrl ?? undefined} alt={name} />
              <AvatarFallback className="text-xl">{initials(name)}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUrl ? "Change photo" : "Upload photo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
        </CardHeader>
        <CardContent>
          {avatarError ? (
            <p className="text-sm text-destructive">{avatarError}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. Max 5 MB.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="secondary">Admin</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Name and email are set at signup and cannot be changed here.
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
            <Button asChild variant="link" size="sm" className="px-0 text-primary">
              <Link href={`/users/${user.id}`}>View public profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}