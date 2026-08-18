import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPinIcon, TagIcon } from "lucide-react"

import { ROLE_LABELS, getCurrentUser } from "@/lib/auth"
import type { UserRole } from "@/lib/auth/types"
import { fetchListing, formatCondition, formatPrice } from "@/lib/listings"
import { fetchFavoriteIds } from "@/lib/favorites"
import { fetchSellerContactInfo } from "@/lib/contact"
import { initials } from "@/lib/utils"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ListingViewTracker } from "@/components/listings/listing-view-tracker"
import { SimilarListings } from "@/components/listings/similar-listings"
import { MakeOfferButton } from "@/components/offers/make-offer-button"
import { ContactButton } from "@/components/contact/contact-button"
import { ReportButton } from "@/components/reports/report-button"
import { SellerTrustBadges } from "@/components/verification/seller-trust-badges"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const data = await fetchListing(id, { includeSeller: false })
  if (!data) return { title: "Listing not found" }
  const l = data.listing
  return {
    title: l.title,
    description: l.description ?? `${l.title} on VinTech Marketplace`,
    openGraph: {
      title: l.title,
      description: l.description ?? undefined,
      images: data.images.length ? [data.images[0]?.image_url] : undefined,
    },
  }
}

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchListing(id)
  if (!data) notFound()

  const user = await getCurrentUser()
  const favorited = user
    ? (await fetchFavoriteIds(user.id)).includes(id)
    : null

  // Fetch the seller's contact surface (telegram + phone opt-in) so the
  // ContactSeller button can render the right options. Phone is only
  // returned when the seller has opted in (Privacy, AC4).
  const contactInfo = user
    ? await fetchSellerContactInfo(data.listing.seller_id)
    : null

  const { listing: l, images, category, seller } = data
  const cover = images[0]?.image_url
  const roleLabel =
    ROLE_LABELS[(seller?.role ?? "seller") as UserRole] ?? "Seller"
  const isOwner = Boolean(user && user.id === l.seller_id)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ListingViewTracker listingId={l.id} />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          {cover ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
              <Image
                src={cover}
                alt={l.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              {images.length > 1 ? (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-video w-full overflow-hidden rounded-md border"
                    >
                      <Image
                        src={img.image_url}
                        alt={img.alt_text ?? l.title}
                        fill
                        sizes="(max-width: 768px) 18vw, 10vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              No photo
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="font-heading flex-1 text-2xl font-semibold text-foreground">
              {l.title}
            </h1>
            <Badge variant="secondary">{formatCondition(l.condition)}</Badge>
            {l.ai_assisted ? (
              <Badge variant="outline">AI-assisted</Badge>
            ) : null}
            <FavoriteButton listingId={l.id} initial={favorited} isOwner={isOwner} />
            <ReportButton
              target={{ type: "listing", listingId: l.id }}
              signedIn={Boolean(user)}
              isOwner={isOwner}
            />
          </div>

          <p className="text-2xl font-semibold text-foreground">
            {formatPrice(l.price, { maxFractionDigits: 2 })}
            {l.negotiable ? " (or best offer)" : null}
          </p>

          <MakeOfferButton
            listingId={l.id}
            listingPrice={l.price}
            isOwner={isOwner}
            available={l.status === "published"}
            signedIn={Boolean(user)}
          />

          <ContactButton
            listingId={l.id}
            sellerId={l.seller_id}
            signedIn={Boolean(user)}
            contactInfo={contactInfo}
            isOwner={isOwner}
          />

          {category ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TagIcon className="size-4" />
              <span>{category.name}</span>
            </div>
          ) : null}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="size-4" />
            <span>
              {[l.city, l.sub_city].filter(Boolean).join(", ") || "Location not set"}
            </span>
          </div>
          {l.address ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" />
              <span>{l.address}</span>
            </div>
          ) : null}

          {l.description ? (
            <p className="text-sm leading-relaxed text-foreground/80">
              {l.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No description provided.</p>
          )}

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage
                  src={seller?.avatar_url ?? undefined}
                  alt={seller?.full_name ?? roleLabel}
                />
                <AvatarFallback className="text-sm">
                  {initials(seller?.full_name ?? "")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                 <CardTitle className="text-base">
                   <Link
                     href={`/users/${seller?.id ?? l.seller_id}`}
                     className="text-primary hover:underline"
                   >
                     {seller?.full_name ?? "View seller profile"}
                   </Link>
                 </CardTitle>
                 <p className="text-sm text-muted-foreground">
                   Trust score {seller?.trust_score ?? 50}
                 </p>
               </div>
             </CardHeader>
             <CardContent>
               <SellerTrustBadges seller={seller} />
             </CardContent>
           </Card>

          <Button asChild size="lg">
            <Link href={`/users/${seller?.id ?? l.seller_id}`}>
              View seller profile
            </Link>
          </Button>
        </div>
      </div>

      <SimilarListings listingId={l.id} />

      <div className="mt-8 text-center">
        <Button asChild variant="link">
          <Link href="/">← Back to listings</Link>
        </Button>
      </div>
    </main>
  )
}

