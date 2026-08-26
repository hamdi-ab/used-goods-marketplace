"use client"

import { useActionState, useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { UploadIcon, ShieldCheckIcon, PhoneIcon, UserCheckIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROLE_LABELS, type SessionUser } from "@/lib/auth/types"
import type { MyVerificationRow } from "@/lib/verifications"
import { cn, initials } from "@/lib/utils"
import { updateProfile, uploadAvatar } from "@/app/actions/profile"
import { VerificationCard } from "./verification-card"

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
  fayda_verified: boolean | null
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

function trustBadgeClass(score: number | null): string {
  if (score == null) return "border-slate-200 bg-slate-100 text-slate-700"
  if (score >= 70) return "border-emerald-200 bg-emerald-100 text-emerald-700"
  if (score >= 40) return "border-amber-200 bg-amber-100 text-amber-700"
  return "border-slate-200 bg-slate-100 text-slate-700"
}

export function ProfileForm({
  user,
  profile,
  verifications,
  faydaAvailable,
  faydaOutcome,
}: {
  user: SessionUser
  profile: ProfileRow
  verifications: MyVerificationRow[]
  faydaAvailable: boolean
  faydaOutcome: { ok: boolean; error?: string } | null
}) {
  const [state, formAction, pending] = useActionState(updateProfile, {})
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const roleLabel = ROLE_LABELS[user.role] ?? "Buyer"
  const trustScore = profile.trust_score ?? 50
  const completion = profile.profile_completion ?? 0

  async function handleAvatar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setAvatarError(null)
    const form = new FormData()
    form.set("avatar", file)
    const res = await uploadAvatar(user.id, { url: null, error: null }, form)
    setAvatarUploading(false)
    if (res.error) {
      setAvatarError(res.error)
      toast.error(res.error)
    } else {
      setAvatarUrl(res.url)
      toast.success("Profile photo uploaded")
    }
  }

  const verifiedTypes = new Set(
    verifications.filter((v) => v.status === "verified").map((v) => v.type)
  )
  const trustBadges = [
    { label: "Verified Seller", show: user.role === "seller" && verifiedTypes.size > 0, icon: ShieldCheckIcon, cls: "border-[#2563EB]/30 bg-[#EEF4FF] text-[#2563EB]" },
    { label: "Phone verified", show: verifiedTypes.has("phone"), icon: PhoneIcon, cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { label: "Fayda verified", show: verifiedTypes.has("fayda"), icon: UserCheckIcon, cls: "border-[#2563EB]/30 bg-[#EEF4FF] text-[#2563EB]" },
  ].filter((b) => b.show)

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Your profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your identity, trust and contact details.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Identity Sidebar */}
        <div className="lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="relative bg-gradient-to-br from-[#172554] to-[#1e3a8a] px-6 pb-6 pt-8">
              <div className="flex flex-col items-center gap-3">
                <Avatar className="size-24 border ring-4 ring-[#2563EB]/40">
                  <AvatarImage
                    src={avatarUrl ?? undefined}
                    alt={profile.full_name ?? user.fullName ?? "You"}
                  />
                  <AvatarFallback className="text-2xl">
                    {initials(profile.full_name ?? user.fullName ?? "")}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 pt-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex flex-col gap-2">
                  <p className="font-heading text-lg font-semibold text-foreground">
                    {profile.full_name ?? user.fullName ?? "Your name"}
                  </p>
                  <Badge variant="secondary" className="mx-auto w-fit">
                    {roleLabel}
                  </Badge>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => fileRef.current?.click()}
                    disabled={avatarUploading || pending}
                  >
                    <UploadIcon className="mr-2 size-4" />
                    {avatarUrl ? "Change photo" : "Upload photo"}
                  </Button>
                  {avatarError ? (
                    <p className="text-xs text-destructive">{avatarError}</p>
                  ) : null}
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG or WebP. Max 5 MB.
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Trust score</span>
                  <Badge variant="outline" className={`font-semibold ${trustBadgeClass(trustScore)}`}>
                    {trustScore}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profile completion</span>
                  <span className="font-medium text-foreground">{completion}%</span>
                </div>
              </div>

              {trustBadges.length > 0 ? (
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {trustBadges.map((b) => (
                    <Badge
                      key={b.label}
                      variant="outline"
                      className={`gap-1.5 font-medium ${b.cls}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {b.label}
                    </Badge>
                  ))}
                </div>
              ) : null}

              <Link
                href={`/users/${user.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                View public profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: edit form */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <form action={formAction} className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>About you</CardTitle>
                <CardDescription>
                  Location and a short introduction buyers will see.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
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
                  <p className="text-xs text-muted-foreground">Set at signup.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="subCity">Sub-city</Label>
                    <Input
                      id="subCity"
                      name="subCity"
                      defaultValue={profile.sub_city ?? ""}
                      placeholder="e.g. Bole"
                    />
                  </div>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
                <CardDescription>
                  How buyers reach you. Phone is private unless you toggle it public.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
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
                  <label className="flex items-center gap-2 pb-1 text-sm">
                    <input
                      type="checkbox"
                      name="phonePublic"
                      defaultChecked={profile.phone_public ?? false}
                      className="size-4 rounded border-border accent-primary"
                    />
                    Show my phone publicly
                  </label>
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
              </CardContent>
            </Card>

            {state.message ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}
            {state.ok ? (
              <p className="text-sm text-green-600">Profile updated.</p>
            ) : null}

            <Button type="submit" disabled={pending} className="w-fit h-11">
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </form>

          <VerificationCard verifications={verifications} faydaAvailable={faydaAvailable} />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        name="avatar"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleAvatar}
      />
    </main>
  )
}
