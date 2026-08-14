import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPinIcon, PhoneIcon, SendIcon } from "lucide-react"

import { ROLE_LABELS, type UserRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { initials, formatShortDate } from "@/lib/utils"
import { fetchSellerReviews, summarizeRating } from "@/lib/reviews"
import { SellerTrustBadges } from "@/components/verification/seller-trust-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ReviewStars } from "@/components/reviews/review-stars"

type PublicProfileRow = {
  full_name: string | null
  avatar_url: string | null
  city: string | null
  sub_city: string | null
  bio: string | null
  telegram_username: string | null
  phone: string | null
  trust_score: number | null
  role: "buyer" | "seller" | "admin" | null
  phone_public: boolean | null
  phone_verified: boolean | null
  fayda_verified: boolean | null
}

async function fetchPublicProfile(id: string): Promise<PublicProfileRow | null> {
  const supabase = await createClient()

  // Public surface only: phone is fetched separately and only when the owner
  // has opted in (Security spec §19: phone is private by default). Trust-badge
  // flags (phone_verified, fayda_verified) are public by T12 RLS design.
  const baseColumns =
    "full_name, avatar_url, city, sub_city, bio, telegram_username, trust_score, role, phone_public, phone_verified, fayda_verified"

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(baseColumns)
    .eq("id", id)
    .maybeSingle()

  if (error || !profile) return null

  if (profile.phone_public) {
    const { data: withPhone } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", id)
      .maybeSingle()
    ;(profile as PublicProfileRow).phone = withPhone?.phone ?? null
  }

  return profile as PublicProfileRow
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchPublicProfile(id)
  if (!profile) return { title: "Profile not found" }
  const name = profile.full_name ?? "VinTech user"
  return {
    title: name,
    description: profile.bio ?? `${name}'s VinTech Marketplace profile.`,
    openGraph: {
      title: name,
      description: profile.bio ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  }
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const profile = await fetchPublicProfile(id)
  if (!profile) notFound()

  const role = (profile.role ?? "buyer") as UserRole
  const roleLabel = ROLE_LABELS[role] ?? "Buyer"
  const reviews = await fetchSellerReviews(id)
  const rating = summarizeRating(reviews)


  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <Card className="gap-6">
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profile.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name ?? roleLabel}
                  width={64}
                  height={64}
                />
              ) : null}
              <AvatarFallback className="text-xl">
                {initials(profile.full_name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                {profile.full_name ?? "VinTech user"}
              </h1>
              <p className="text-sm text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <Badge variant="outline" className="capitalize">
            {roleLabel.toLowerCase()}
          </Badge>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* T12 trust badges (replaces the previous placeholder). Phone / Fayda
              flags and role are the public verification surface per DB spec §15
              and issue #16 AC; the empty state ("Not verified yet") renders for
              profiles with no active badge. */}
          <div className="flex items-center gap-3">
            <SellerTrustBadges seller={profile} />
          </div>

          {profile.telegram_username ? (
            <Badge variant="secondary">Telegram connected</Badge>
          ) : null}

          <div className="flex items-center gap-3 text-sm">
            <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
            <span>
              {profile.city
                ? `${profile.city}${profile.sub_city ? `, ${profile.sub_city}` : ""}`
                : "Location not set"}
            </span>
          </div>

          {profile.telegram_username ? (
            <div className="flex items-center gap-3 text-sm">
              <SendIcon className="size-4 shrink-0 text-muted-foreground" />
              <a
                href={`https://t.me/${profile.telegram_username}`}
                target="_blank"
                rel="noreferrer noopener"
                className="text-primary underline"
              >
                @{profile.telegram_username}
              </a>
            </div>
          ) : null}

          {profile.phone ? (
            <div className="flex items-center gap-3 text-sm">
              <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
              <span>{profile.phone}</span>
            </div>
          ) : null}

          {profile.bio ? (
            <p className="text-sm leading-relaxed text-foreground/80">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No bio added yet.</p>
          )}

           <dl className="grid grid-cols-2 gap-4 border-t border-border pt-5">
             <div>
               <dt className="text-xs font-medium text-muted-foreground">
                 Trust score
               </dt>
               <dd className="mt-1 text-2xl font-semibold text-foreground">
                 {profile.trust_score ?? 50}
               </dd>
             </div>
             <div>
               <dt className="text-xs font-medium text-muted-foreground">Role</dt>
               <dd className="mt-1 text-2xl font-semibold text-foreground">
                 {roleLabel}
               </dd>
             </div>
           </dl>
         </CardContent>
       </Card>

      {reviews.length > 0 ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <ReviewStars rating={rating.average ?? 0} size="md" />
                <span className="text-sm text-muted-foreground">
                  {rating.average?.toFixed(1) ?? "—"} out of 5 ({rating.count})
                </span>
              </div>
            </div>

            <ul className="mt-4 flex flex-col gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="flex items-start gap-3 text-sm">
                  <Avatar className="size-8">
                    {review.buyer?.avatar_url ? (
                      <AvatarImage
                        src={review.buyer.avatar_url}
                        alt={review.buyer.full_name ?? "Reviewer"}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {initials(review.buyer?.full_name ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <ReviewStars rating={review.rating} size="xs" />
                      <span className="text-xs text-muted-foreground">
                        {formatShortDate(review.created_at)}
                      </span>
                    </div>
                    {review.comment ? (
                      <p className="mt-1 text-sm text-foreground/80">
                        {review.comment}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}


      <div className="mt-6 text-center">
        <Button asChild variant="link">
          <Link href="/">← Back to listings</Link>
        </Button>
      </div>
    </main>
  )
}
