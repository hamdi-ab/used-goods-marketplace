import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { MapPinIcon, TagIcon } from "lucide-react"

import type { VariantKey } from "@/components/search/prototype-utils"
import { withVariant } from "@/components/search/prototype-utils"
import { fetchListing, formatCondition, formatPrice } from "@/lib/listings"
import type { Condition, ListingWithRelations } from "@/lib/listings/constants"
import { fetchFavoriteIds } from "@/lib/favorites"
import { getCurrentUser } from "@/lib/auth"
import { fetchSellerContactInfo, type SellerContactInfo } from "@/lib/contact"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { MakeOfferButton } from "@/components/offers/make-offer-button"
import { ContactButton } from "@/components/contact/contact-button"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ReportButton } from "@/components/reports/report-button"
import { SimilarListings } from "@/components/listings/similar-listings"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Listing detail",
  description: "View item details on VinTech Marketplace.",
}

// PROTOTYPE — listing-detail redesign variants (?variant=A|B, dev only).
// Perfect Bento Alignment:
// LEFT column = image gallery card (flex-1 image fills the column height).
// RIGHT column = offer/purchase card + seller profile card (trust + verified badges).
// Right cards' combined height defines the row; left image flexes to match => exact equal heights.
export async function PrototypeDetailPage({
  variant,
  id,
}: {
  variant: VariantKey
  id: string
}) {
  const data = await fetchListing(id)
  if (!data) {
    return (
      <>
        <PrototypeHeader variant={variant} />
        <main className="mx-auto flex w-full max-w-3xl flex-1 px-4 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold">Listing not found</h1>
        </main>
        <PrototypeFooter variant={variant} />
      </>
    )
  }

  const user = await getCurrentUser()
  const favorited = user
    ? await fetchFavoriteIds(user.id).then((ids) => ids.includes(id))
    : null

  const contactInfo: SellerContactInfo | null = user
    ? await fetchSellerContactInfo(data.listing.seller_id)
    : null

  const { listing: l, images, category, seller } = data
  const cover = images[0]?.image_url
  const isOwner = Boolean(user && user.id === l.seller_id)

  return (
    <>
      <PrototypeHeader variant={variant} />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href={withVariant("/search", variant)}
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to listings
          </Link>
        </div>

        {/* Symmetrical Bento Top Row — left gallery height == right (offer + seller) height */}
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* LEFT (7 cols): Image Gallery Card — image flexes to fill row height */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
              <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border bg-muted">
                {cover ? (
                  <Image
                    src={cover}
                    alt={l.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No photo available
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 ? (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {images.slice(0, 5).map((img, i) => (
                    <div
                      key={img.id ?? i}
                      className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border bg-muted ring-offset-2 transition hover:ring-2 hover:ring-[#2563EB]"
                    >
                      <Image
                        src={img.image_url}
                        alt={img.alt_text ?? l.title}
                        fill
                        sizes="120px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* RIGHT (5 cols): Offer Card + Seller Profile Card stacked, defines the row height */}
          <div className="flex flex-col justify-between gap-6 lg:col-span-5">
            {/* Offer / Purchase Card */}
            <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
              {/* Category & Location */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {category ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <TagIcon className="size-3.5" />
                    {category.name}
                  </span>
                ) : null}
                {category && (l.city || l.sub_city) ? <span>•</span> : null}
                {l.city || l.sub_city ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="size-3.5" />
                    {[l.city, l.sub_city].filter(Boolean).join(", ")}
                  </span>
                ) : null}
              </div>

              {/* Condition & Title */}
              <div>
                <div className="mb-2">
                  <ConditionPill condition={l.condition as Condition} />
                </div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {l.title}
                </h1>
              </div>

              {/* Price Box */}
              <div className="rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-4">
                <span className="font-heading block text-3xl font-extrabold text-[#2563EB] sm:text-4xl">
                  {formatPrice(l.price, { maxFractionDigits: 2 })}
                </span>
                {l.negotiable ? (
                  <span className="mt-1 block text-xs font-medium text-muted-foreground">
                    Negotiable (or best offer)
                  </span>
                ) : null}
              </div>

              {/* Primary Action Buttons */}
              <div className="flex flex-col gap-3 pt-1">
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
              </div>

              {/* Secondary actions */}
              <div className="-mx-1 flex items-center justify-end gap-1 border-t pt-3 text-xs text-muted-foreground">
                <FavoriteButton
                  listingId={l.id}
                  initial={favorited}
                  isOwner={isOwner}
                />
                <ReportButton
                  target={{ type: "listing", listingId: l.id }}
                  signedIn={Boolean(user)}
                  isOwner={isOwner}
                />
              </div>
            </div>

            {/* Seller Profile Card (trust + verified badges) */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar className="size-12 border">
                  <AvatarImage
                    src={seller?.avatar_url ?? undefined}
                    alt={seller?.full_name ?? "Seller"}
                  />
                  <AvatarFallback className="font-semibold text-muted-foreground">
                    {seller?.full_name?.slice(0, 2).toUpperCase() ?? "SV"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground">
                    <Link
                      href={withVariant(
                        `/users/${seller?.id ?? l.seller_id}`,
                        variant
                      )}
                      className="hover:text-[#2563EB] hover:underline"
                    >
                      {seller?.full_name ?? "Verified Seller"}
                    </Link>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {seller?.trust_score != null
                      ? `Trust score: ${seller.trust_score}`
                      : "Community seller"}
                  </p>
                </div>
              </div>
              <SellerTrustRow seller={seller} />
            </div>
          </div>
        </div>

        {/* Bottom Row: Full-width Horizontal Description Card */}
        <div className="mt-8 rounded-2xl border bg-card p-8 shadow-sm">
          <h2 className="font-heading mb-4 text-xl font-semibold text-foreground">
            About this item
          </h2>
          {l.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80 sm:text-base">
              {l.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description provided by seller.
            </p>
          )}
        </div>

        {/* Similar Listings Section */}
        <div className="mt-12">
          <SimilarListings listingId={l.id} variant={variant} />
        </div>
      </main>

      <PrototypeFooter variant={variant} />
    </>
  )
}

function ConditionPill({ condition }: { condition: Condition }) {
  const map: Record<Condition, string> = {
    "Brand New": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Lightly Used": "bg-amber-100 text-amber-800 border-amber-200",
    Fair: "bg-orange-100 text-orange-800 border-orange-200",
  }
  const cls = map[condition] ?? "bg-muted text-muted-foreground"
  return (
    <Badge variant="outline" className={`font-medium ${cls}`}>
      {formatCondition(condition)}
    </Badge>
  )
}

function SellerTrustRow({
  seller,
}: {
  seller: ListingWithRelations["seller"]
}) {
  const badges = [
    {
      label: "Phone verified",
      ok: seller?.phone_verified,
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Fayda verified",
      ok: seller?.fayda_verified,
      cls: "border-[#2563EB]/30 bg-[#EEF4FF] text-[#2563EB]",
    },
  ].filter((b) => b.ok)

  if (badges.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-3">
      {badges.map((b) => (
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
  )
}