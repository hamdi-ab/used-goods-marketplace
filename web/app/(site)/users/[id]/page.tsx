import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPinIcon, SendIcon } from "lucide-react"

import { ROLE_LABELS, type UserRole, getCurrentUser } from "@/lib/auth"
import { fetchPublicProfile } from "@/lib/profiles"
import { initials, formatShortDate } from "@/lib/utils"
import { fetchSellerRatingSummary, fetchSellerReviews } from "@/lib/reviews"
import { fetchSellerContactInfo } from "@/lib/contact"
import { fetchSellerPublicListings } from "@/lib/listings"
import { SellerTrustBadges } from "@/components/verification/seller-trust-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactButton } from "@/components/contact/contact-button"
import { ReportButton } from "@/components/reports/report-button"
import { ReviewStars } from "@/components/reviews/review-stars"
import { ListingCard } from "@/components/listings/listing-card"

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
  const [reviews, rating, user, listings] = await Promise.all([
    fetchSellerReviews(id, { limit: 10 }),
    fetchSellerRatingSummary(id),
    getCurrentUser(),
    fetchSellerPublicListings(id, 6),
  ])
  const contactInfo = user ? await fetchSellerContactInfo(id) : null

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/search"
          className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to listings
        </Link>
      </div>

      {/* Harmonized bento grid */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        {/* Identity tile (spans two rows) */}
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] p-6 shadow-sm lg:col-span-5 lg:row-span-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-20 border">
                {profile.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.full_name ?? roleLabel}
                  />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {initials(profile.full_name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-semibold leading-tight text-foreground">
                  {profile.full_name ?? "Dagim Gebeya user"}
                </h1>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {roleLabel.toLowerCase()}
                </Badge>
              </div>
            </div>

            <SellerTrustBadges seller={profile} />

            <dl className="grid grid-cols-2 gap-4 border-t border-[#2563EB]/20 pt-4">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Trust score
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  {profile.trust_score ?? 50}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Reviews
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-foreground">
                  {rating.count}
                </dd>
              </div>
            </dl>
          </div>

          {user?.id !== id ? (
            <div className="flex flex-col gap-3">
              <ContactButton
                sellerId={id}
                signedIn={Boolean(user)}
                contactInfo={contactInfo}
              />
              <ReportButton
                target={{ type: "seller", sellerId: id }}
                signedIn={Boolean(user)}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              This is your public profile.
            </p>
          )}
        </div>

        {/* About tile */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:col-span-7">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            About
          </h2>
          {profile.bio ? (
            <p className="text-sm leading-relaxed text-foreground/80">
              {profile.bio}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No bio added yet.</p>
          )}

          <div className="flex flex-col gap-3 border-t pt-4 text-sm">
            <div className="flex items-center gap-3">
              <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
              <span>
                {profile.city
                  ? `${profile.city}${profile.sub_city ? `, ${profile.sub_city}` : ""}`
                  : "Location not set"}
              </span>
            </div>
            {profile.telegram_username ? (
              <div className="flex items-center gap-3">
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
          </div>
        </div>

        {/* Reviews tile */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm lg:col-span-7">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            Reviews
          </h2>
          {reviews.error ? (
            <p className="text-sm text-muted-foreground">
              Could not load reviews. Try again.
            </p>
          ) : reviews.reviews.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
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
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No reviews yet. Reviews appear after a completed transaction.
            </p>
          )}
        </div>
      </div>

      {/* Active listings showcase */}
      {listings.length > 0 ? (
        <section className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Active listings
              </h2>
              <p className="text-sm text-muted-foreground">
                {listings.length} published item{listings.length > 1 ? "s" : ""}{" "}
                from this seller.
              </p>
            </div>
            <Link
              href="/search"
              className="text-sm font-medium text-primary hover:underline"
            >
              Browse all →
            </Link>
          </div>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
