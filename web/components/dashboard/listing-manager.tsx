"use client"

import Image from "next/image"
import Link from "next/link"
import { useActionState, useState } from "react"
import { EyeIcon, HeartIcon, PackageOpenIcon, PencilIcon, PlusIcon, XIcon } from "lucide-react"

import { deleteListing } from "@/app/actions/listings"
import type { SellerListingRow } from "@/lib/listings"
import { formatPrice } from "@/lib/listings/constants"
import { ListingStatusBadge } from "@/components/dashboard/listing-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

function ListingRow({ listing }: { listing: SellerListingRow }) {
  const [state, action, pending] = useActionState(deleteListing, {})
  const [imgError, setImgError] = useState(false)

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
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
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
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ListingStatusBadge status={listing.status} />
              <span className="text-sm font-semibold">
                {formatPrice(listing.price)}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
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

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/listings/${listing.id}/edit`}>
                <PencilIcon className="mr-1.5 size-3.5" />
                Edit
              </Link>
            </Button>
            <form
              action={action}
              onSubmit={(e) => {
                if (!confirm("Archive this listing? It will no longer be visible."))
                  e.preventDefault()
              }}
            >
              <input type="hidden" name="id" value={listing.id} readOnly />
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                <XIcon className="mr-1.5 size-3.5" />
                {pending ? "Archiving…" : "Archive"}
              </Button>
            </form>
          </div>

          {state.message ? (
            <p role="alert" className="w-full text-sm text-destructive">
              {state.message}
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
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your first item with a few photos and a price — buyers can start
            finding it right away.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/sell">
              <PlusIcon className="mr-1.5 size-4" />
              Create a listing
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const visible = expanded ? listings : listings.slice(0, initialLimit)
  const hiddenCount = listings.length - visible.length

  return (
    <div className="flex flex-col gap-3">
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
          Show all {listings.length} listings
        </Button>
      ) : null}
    </div>
  )
}