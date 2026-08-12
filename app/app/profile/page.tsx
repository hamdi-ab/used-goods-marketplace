import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { MailIcon, MapPinIcon, PhoneIcon, SendIcon } from "lucide-react"

import { getCurrentUser, ROLE_LABELS } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { initials } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Your profile",
  description: "Your VinTech Marketplace profile.",
}

type ProfileRow = {
  full_name: string | null
  phone: string | null
  telegram_username: string | null
  city: string | null
  sub_city: string | null
  bio: string | null
  trust_score: number | null
  profile_completion: number | null
  role: "buyer" | "seller" | "admin" | null
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, telegram_username, city, sub_city, bio, trust_score, profile_completion, role"
    )
    .eq("id", user.id)
    .maybeSingle()

  const p = (profile ?? {}) as ProfileRow
  const roleLabel = ROLE_LABELS[p.role ?? user.role] ?? "Buyer"

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <Card className="gap-6">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-base">{initials(p.full_name ?? user.fullName ?? "")}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-heading text-xl font-semibold leading-tight text-foreground">
                {p.full_name ?? user.fullName ?? "Your profile"}
              </h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge variant="secondary">{roleLabel}</Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {!user.profileCompleted ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
              <p className="font-medium text-foreground">Your profile is not complete.</p>
              <p className="mt-1 text-muted-foreground">
                Add your name, city and contact details so buyers and sellers can reach you.
              </p>
              <Button asChild className="mt-3">
                <Link href="/onboarding">Complete your profile</Link>
              </Button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon className="size-4 shrink-0" />
              <span>
                {p.city ?? "—"}
                {p.sub_city ? `, ${p.sub_city}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MailIcon className="size-4 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <PhoneIcon className="size-4 shrink-0" />
              <span>{p.phone ?? "No phone added"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <SendIcon className="size-4 shrink-0" />
              <span>{p.telegram_username ? `@${p.telegram_username}` : "No Telegram added"}</span>
            </div>
          </div>

          {p.bio ? (
            <p className="text-sm leading-relaxed text-foreground/80">{p.bio}</p>
          ) : null}

          <dl className="grid grid-cols-2 gap-4 border-t border-border pt-5">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Trust score</dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground">{p.trust_score ?? 50}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Profile completion</dt>
              <dd className="mt-1 text-2xl font-semibold text-foreground">
                {p.profile_completion ?? 0}%
              </dd>
            </div>
          </dl>
        </CardContent>

        <CardFooter className="justify-between">
          <Button asChild variant="outline">
            <Link href="/dashboard">View dashboard</Link>
          </Button>
          <Button asChild variant="link">
            <Link href="/">Back to home</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}