import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MapPinIcon, TagIcon } from "lucide-react"

import { ROLE_LABELS, getCurrentUser } from "@/lib/auth"
import type { UserRole } from "@/lib/auth/types"
import { fetchListing, formatCondition, formatPrice } from "@/lib/listings"
import type { ListingWithRelations } from "@/lib/listings/constants"
import { fetchFavoriteIds } from "@/lib/favorites"
import { fetchSellerContactInfo, type SellerContactInfo } from "@/lib/contact"
import { initials } from "@/lib/utils"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { ListingViewTracker } from "@/components/listings/listing-view-tracker"
import { SimilarListings } from "@/components/listings/similar-listings"
import { ListingGallery } from "@/components/listings/listing-gallery"
import { ConditionChip } from "@/components/listings/condition-chip"
import { MakeOfferButton } from "@/components/offers/make-offer-button"
import { ContactButton } from "@/components/contact/contact-button"
import { ReportButton } from "@/components/reports/report-button"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
    description: l.description ?? `${l.title} on Dagim Gebeya`,
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

  const contactInfo: SellerContactInfo | null = user
    ? await fetchSellerContactInfo(data.listing.seller_id)
    : null

  const { listing: l, images, category, seller } = data
  const isOwner = Boolean(user && user.id === l.seller_id)

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
      <ListingViewTracker listingId={l.id} />

      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Browse", href: "/search" },
          { label: l.title },
        ]}
      />

      <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
            <ListingGallery images={images} title={l.title} />
          </div>
        </div>

        <div className="order-1 flex flex-col justify-between gap-6 lg:order-2 lg:col-span-5">
          <div className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-foreground/70">
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

            <div>
              <div className="mb-2">
                <ConditionChip condition={l.condition} />
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {l.title}
              </h1>
            </div>

            <div className="rounded-xl border border-[#2563EB]/20 bg-[#2563EB]/5 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Price
              </span>
              <span className="font-heading mt-0.5 block text-3xl font-extrabold text-[#2563EB] sm:text-4xl">
                {formatPrice(l.price, { maxFractionDigits: 2 })}
              </span>
              {l.negotiable ? (
                <span className="mt-1 block text-xs font-medium text-foreground/70">
                  Negotiable (or best offer)
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar className="size-12 border">
                <AvatarImage
                  src={seller?.avatar_url ?? undefined}
                  alt={seller?.full_name ?? "Seller"}
                />
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {seller?.full_name?.slice(0, 2).toUpperCase() ?? "SV"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-foreground">
                  <Link
                    href={`/users/${seller?.id ?? l.seller_id}`}
                    className="hover:text-[#2563EB] hover:underline"
                  >
                    {seller?.full_name ?? "Verified Seller"}
                  </Link>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {seller?.trust_score != null
                    ? `Trust score: ${seller.trust_score}/100`
                    : "Community seller"}
                </p>
              </div>
            </div>
            <SellerTrustRow seller={seller} />
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            {l.status === "sold" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  This item has been sold
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  It&apos;s no longer available.{" "}
                  <Link
                    href="#similar"
                    className="font-medium underline underline-offset-2"
                  >
                    See similar listings
                  </Link>{" "}
                  instead.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
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
                <div className="-mx-1 mt-3 flex items-center justify-end gap-1 border-t pt-3 text-xs text-foreground/70">
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
              </>
            )}
          </div>
        </div>
      </div>

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

      <div id="similar" className="mt-12">
        <SimilarListings listingId={l.id} />
      </div>
    </main>
  )
}

function TrustMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const color =
    pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-muted-foreground/30"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums">{score}/100</span>
    </div>
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

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      {seller?.trust_score != null ? (
        <div>
          <p className="text-xs font-medium text-muted-foreground">Trust score</p>
          <TrustMeter score={seller.trust_score} />
        </div>
      ) : null}
      {badges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
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
      ) : null}
    </div>
  )
}
