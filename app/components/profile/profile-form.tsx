"use client"

import { useActionState, useRef, useState, type ChangeEvent } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadIcon } from "lucide-react"
import Link from "next/link"

import { ROLE_LABELS, type SessionUser } from "@/lib/auth/types"
import { initials } from "@/lib/utils"
import { updateProfile, uploadAvatar } from "@/app/actions/profile"

type ProfileRow = {
  avatar_url: string | null
  full_name: string | null
  phone: string | null
  telegram_username: string | null
  city: string | null
  sub_city: string | null
  bio: string | null
  trust_score: number | null
  profile_completion: number | null
  role: "buyer" | "seller" | "admin" | null
  phone_public: boolean | null
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function ProfileForm({
  user,
  profile,
}: {
  user: SessionUser
  profile: ProfileRow
}) {
  const [state, formAction, pending] = useActionState(updateProfile, {})
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const roleLabel = ROLE_LABELS[user.role] ?? "Buyer"

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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Your profile
        </h1>
        <Badge variant="secondary">{roleLabel}</Badge>
      </div>

      <Card className="mb-6 gap-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Avatar</CardTitle>
          <div className="flex items-center gap-3">
            <Avatar className="size-16">
              <AvatarImage
                src={avatarUrl ?? undefined}
                alt={profile.full_name ?? user.fullName ?? "You"}
              />
              <AvatarFallback className="text-xl">
                {initials(profile.full_name ?? user.fullName ?? "")}
              </AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={avatarUploading || pending}
            >
              <UploadIcon className="mr-2 size-4" />
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
          {avatarError ? <p className="text-sm text-destructive">{avatarError}</p> : null}
          <p className="text-xs text-muted-foreground">
            JPG, PNG or WebP. Max 5 MB.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About you</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={profile.full_name ?? user.fullName ?? ""}
                  readOnly
                  className="bg-muted/40"
                  aria-readonly
                />
                <p className="text-xs text-muted-foreground">
                  Set at signup.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  defaultValue={profile.city ?? ""}
                  placeholder="e.g. Addis Ababa"
                  aria-invalid={!!state.errors?.city}
                />
                <FieldError message={state.errors?.city?.[0]} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="subCity">Sub-city</Label>
              <Input
                id="subCity"
                name="subCity"
                defaultValue={profile.sub_city ?? ""}
                placeholder="e.g. Bole"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  defaultValue={profile.phone ?? ""}
                  placeholder="e.g. +251 91 234 5678"
                  aria-invalid={!!state.errors?.phone}
                />
                <FieldError message={state.errors?.phone?.[0]} />
              </div>
              <div className="flex items-end pb-7">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="phonePublic"
                    defaultChecked={profile.phone_public ?? false}
                    className="size-4 rounded border-border accent-primary"
                  />
                  Show my phone publicly
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="telegramUsername">Telegram username</Label>
              <Input
                id="telegramUsername"
                name="telegramUsername"
                defaultValue={profile.telegram_username ?? ""}
                placeholder="@yourname"
                aria-invalid={!!state.errors?.telegramUsername}
              />
              <FieldError message={state.errors?.telegramUsername?.[0]} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="bio">About you</Label>
              <Input
                id="bio"
                name="bio"
                defaultValue={profile.bio ?? ""}
                placeholder="A short introduction"
                aria-invalid={!!state.errors?.bio}
              />
              <FieldError message={state.errors?.bio?.[0]} />
            </div>

            {state.message ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}
            {state.ok ? <p className="text-sm text-green-600">Profile updated.</p> : null}

            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span>
          <Badge variant="secondary" className="mr-1">
            {profile.trust_score ?? 50}
          </Badge>{" "}
          trust score
        </span>
        <span>
          Role: <span className="text-foreground">{roleLabel}</span>
        </span>
        <Link
          href={`/users/${user.id}`}
          className="ml-auto text-primary hover:underline"
        >
          View public profile
        </Link>
      </div>
    </div>
  )
}
