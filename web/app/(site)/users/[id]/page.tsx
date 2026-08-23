import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPinIcon, PhoneIcon, SendIcon, ShieldCheckIcon, CalendarIcon } from "lucide-react"

import { ROLE_LABELS, type UserRole, getCurrentUser } from "@/lib/auth"
import { fetchPublicProfile } from "@/lib/profiles"
import { initials, formatShortDate } from "@/lib/utils"
import { fetchSellerRatingSummary, fetchSellerReviews } from "@/lib/reviews"
import { fetchSellerContactInfo } from "@/lib/contact"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { SellerTrustBadges } from "@/components/verification/seller-trust-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactButton } from "@/components/contact/contact-button"
import { ReportButton } from "@/components/reports/report-button"
import { ReviewStars } from "@/components/reviews/review-stars"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const profile = await fetchPublicProfile(id)
  if (!profile) return { title: "Profile not found" }
  const name = profile.full_name ?? "Dagim Gebeya user"
  return {
    title: name,
    description: profile.bio ?? `${name}'s Dagim Gebeya profile.`,
    openGraph: {
      title: name,
      description: profile.bio ?? undefined,
      images: profile.avatar_url ? [profile.avatar_url] : undefined,
    },
  }
}

function trustBadgeClass(score: number | null): string {
  if (score == null) return "border-slate-200 bg-slate-100 text-slate-700"
  if (score >= 70) return "border-emerald-200 bg-emerald-100 text-emerald-700"
  if (score >= 40) return "border-amber-200 bg-amber-100 text-amber-700"
  return "border-slate-200 bg-slate-100 text-slate-700"
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const sp = await searchParams
  const profile = await fetchPublicProfile(id)
  if (!profile) notFound()

  const role = (profile.role ?? "buyer") as UserRole
  const roleLabel = ROLE_LABELS[role] ?? "Buyer"
  const offset = parseOffset(sp.offset)
  const [reviews, rating] = await Promise.all([
    fetchSellerReviews(id, { offset }),
    fetchSellerRatingSummary(id),
  ])
  const user = await getCurrentUser()
  const contactInfo = user ? await fetchSellerContactInfo(id) : null
  const trustScore = profile.trust_score ?? 50

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Hero */}
      <div className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="relative bg-gradient-to-br from-[#172554] to-[#1e3a8a] px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-6">
            <Avatar className="size-24 border ring-4 ring-[#2563EB]/40">
              {profile.avatar_url ? (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.full_name ?? roleLabel}
                  width={96}
                  height={96}
                />
              ) : null}
              <AvatarFallback className="text-2xl">
                {initials(profile.full_name ?? "")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <h1 className="font-heading text-2xl font-bold text-white">
                {profile.full_name ?? "Dagim Gebeya user"}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge className="border-white/25 bg-white/15 text-white">
                  {roleLabel}
                </Badge>
                <Badge className="border-white/25 bg-white/15 text-white">
                  Trust {trustScore}
                </Badge>
                <SellerTrustBadges seller={profile} variant="light" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 divide-x border-b sm:grid-cols-4">
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Trust score</p>
            <p className={`mt-1 font-heading text-lg font-bold ${trustScore >= 70 ? "text-emerald-600" : trustScore >= 40 ? "text-amber-600" : "text-slate-500"}`}>
              {trustScore}/100
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Rating</p>
            <p className="mt-1 font-heading text-lg font-bold text-foreground">
              {rating.average?.toFixed(1) ?? "—"}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Reviews</p>
            <p className="mt-1 font-heading text-lg font-bold text-foreground">{rating.count}</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Role</p>
            <p className="mt-1 font-heading text-lg font-bold text-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left sidebar: contact + details */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {user?.id !== id ? (
            <Card>
              <CardHeader>
                <CardTitle>Contact seller</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ContactButton
                  sellerId={id}
                  signedIn={Boolean(user)}
                  contactInfo={contactInfo}
                />
                <ReportButton
                  target={{ type: "seller", sellerId: id }}
                  signedIn={Boolean(user)}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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

              {contactInfo?.phone ? (
                <div className="flex items-center gap-3 text-sm">
                  <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span>{contactInfo.phone}</span>
                </div>
              ) : null}

              <div className="flex items-center gap-3 text-sm">
                <ShieldCheckIcon className="size-4 shrink-0 text-muted-foreground" />
                <SellerTrustBadges seller={profile} />
              </div>
            </CardContent>
          </Card>

          {profile.bio ? (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {profile.bio}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right column: reviews */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.error ? (
                <p className="text-sm text-muted-foreground">
                  Could not load reviews. Try again.
                </p>
              ) : reviews.reviews.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center gap-2">
                    <ReviewStars rating={rating.average ?? 0} size="md" />
                    <span className="text-sm text-muted-foreground">
                      {rating.average?.toFixed(1) ?? "—"} out of 5 ({rating.count})
                    </span>
                  </div>

                  <ul className="flex flex-col gap-4">
                    {reviews.reviews.map((review) => (
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

                  {reviews.hasMore ? (
                    <div className="mt-6 flex justify-center">
                      <Link
                        href={`/users/${id}?offset=${nextOffset(offset)}`}
                        className="text-sm font-medium underline"
                      >
                        Load more
                      </Link>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Reviews appear after a completed transaction.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Button asChild variant="link">
          <Link href="/">← Back to listings</Link>
        </Button>
      </div>
    </main>
  )
}
