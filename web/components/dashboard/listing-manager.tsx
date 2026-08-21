"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useState } from "react"
import { EyeIcon, HeartIcon, PackageOpenIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react"

import { deleteListing, boostListing } from "@/app/actions/listings"
import type { SellerListingRow } from "@/lib/listings"
import { formatPrice, LISTING_STATUS_LABELS } from "@/lib/listings/constants"
import { isBoostActive, boostLabel } from "@/lib/boost"
import { ListingStatusBadge } from "@/components/dashboard/listing-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: LISTING_STATUS_LABELS.published },
  { key: "draft", label: LISTING_STATUS_LABELS.draft },
  { key: "sold", label: LISTING_STATUS_LABELS.sold },
] as const

type FilterKey = (typeof FILTERS)[number]["key"]

function ListingRow({ listing }: { listing: SellerListingRow }) {
  const [state, action, pending] = useActionState(deleteListing, {})
  const [boostState, boostAction, boostPending] = useActionState(boostListing, {
    ok: true,
  })
  const [imgError, setImgError] = useState(false)
  const [confirming, setConfirming] = useState(false)

  return (
    <li>
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-md border bg-muted">
            {listing.cover_image_url && !imgError ? (
              <Image
                src={listing.cover_image_url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-foreground/70">
                No photo
              </div>
            )}
          </div>

            <div className="min-w-0 flex-1">
              <Link
                href={`/listings/${listing.id}`}
                className="line-clamp-1 font-medium hover:underline"
              >
                {listing.title}
              </Link>
              {listing.status === "published" &&
              isBoostActive(listing.boosted_until) ? (
                <span className="mt-1 block text-xs font-medium text-amber-600">
                  Boosted — {boostLabel(listing.boosted_until)}
                </span>
              ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ListingStatusBadge status={listing.status} />
              <span className="text-sm font-semibold">
                {formatPrice(listing.price)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-foreground/70">
              <span className="inline-flex items-center gap-1">
                <EyeIcon className="size-3.5" />
                {listing.view_count} views
              </span>
              <span className="inline-flex items-center gap-1">
                <HeartIcon className="size-3.5" />
                {listing.favorite_count} favorites
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/listings/${listing.id}/edit`}>
                <PencilIcon className="mr-1.5 size-3.5" />
                Edit
              </Link>
            </Button>
            <form action={action} aria-busy={pending}>
              <input type="hidden" name="id" value={listing.id} readOnly />
              {confirming ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                  <span className="text-xs font-medium text-amber-800">
                    Archive this listing? Buyers will no longer see it.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirming(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={pending}
                    >
                      {pending ? "Archiving…" : "Archive"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirming(true)}
                >
                  <XIcon className="mr-1.5 size-3.5" />
                  Archive
                </Button>
              )}
            </form>
            {listing.status === "published" &&
            !isBoostActive(listing.boosted_until) ? (
              <div className="flex items-center gap-1.5">
                <form action={boostAction}>
                  <input type="hidden" name="id" value={listing.id} readOnly />
                  <input type="hidden" name="preset" value="standard" readOnly />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={boostPending}
                    title="Boost to top of search for 3 days (49 ETB, paid off-platform)"
                  >
                    Boost 49
                  </Button>
                </form>
                <form action={boostAction}>
                  <input type="hidden" name="id" value={listing.id} readOnly />
                  <input type="hidden" name="preset" value="premium" readOnly />
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={boostPending}
                    title="Boost to top of search for 7 days (99 ETB, paid off-platform)"
                  >
                    Boost 99
                  </Button>
                </form>
              </div>
            ) : null}
          </div>

          {state.ok ? (
            <p
              role="status"
              className="w-full text-sm font-medium text-emerald-700"
            >
              Listing archived.
            </p>
          ) : state.message ? (
            <p role="alert" className="w-full text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          {boostState.message && !boostState.ok ? (
            <p role="alert" className="w-full text-sm text-destructive">
              {boostState.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </li>
  )
}

export function ListingManager({
  listings,
  initialLimit = 6,
}: {
  listings: SellerListingRow[]
  initialLimit?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [filter, setFilter] = useState<FilterKey>("all")

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-14 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <PackageOpenIcon className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-heading text-lg font-semibold">
            You have no listings yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            Add your first item with a few photos and a price — buyers can start
            finding it right away.
          </p>
          <Button asChild className="mt-4">
            <Link href="/sell">
              <PlusIcon className="mr-1.5 size-4" />
              Create a listing
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const filtered =
    filter === "all" ? listings : listings.filter((l) => l.status === filter)
  const visible = expanded ? filtered : filtered.slice(0, initialLimit)
  const hiddenCount = filtered.length - visible.length

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter listings by status"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <Button
              key={f.key}
              type="button"
              variant={active ? "default" : "outline"}
              className={cn(
                "h-9 rounded-full px-3.5 text-xs transition-colors",
                active && "text-primary-foreground"
              )}
              onClick={() => {
                setFilter(f.key)
                setExpanded(false)
              }}
              aria-pressed={active}
            >
              {f.label}
            </Button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-10 text-center">
            <h3 className="font-heading text-base font-semibold">
              No {filter === "all" ? "" : LISTING_STATUS_LABELS[filter].toLowerCase()} listings
            </h3>
            <p className="mt-1 text-sm text-foreground/70">
              Try a different status filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setExpanded(true)}
            >
              Show all {filtered.length} listings
            </Button>
          ) : null}
        </>
      )}
    </div>
  )
}