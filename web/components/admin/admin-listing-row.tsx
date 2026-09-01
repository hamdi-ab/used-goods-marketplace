"use client"

import { useActionState } from "react"
import Link from "next/link"
import { ExternalLinkIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"

import { adminRemoveListing } from "@/app/actions/admin"
import type { AdminListingRow } from "@/lib/admin"
import { formatPrice } from "@/lib/listings/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function AdminListingRow({
  listing,
}: {
  listing: AdminListingRow
}) {
  const [state, action, pending] = useActionState(adminRemoveListing, {})

  if (state?.ok) {
    toast.success("Listing removed")
  }

  const sold = listing.sold_to_buyer_id !== null

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="min-w-0">
        <Link
          href={`/listings/${listing.id}`}
          className="line-clamp-1 font-medium text-foreground hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatPrice(listing.price)} · {listing.condition ?? "N/A"}
          {listing.city ? ` · ${listing.city}` : ""}
          {" · "}
          {listing.seller?.full_name ?? "Unknown seller"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {sold ? <Badge variant="secondary">Sold</Badge> : null}
        <Badge variant="outline">{listing.status}</Badge>

        <Button asChild variant="ghost" size="sm">
          <Link href={`/listings/${listing.id}`}>
            <ExternalLinkIcon className="size-3.5" />
            <span className="sr-only">View</span>
          </Link>
        </Button>

        <form action={action}>
          <input type="hidden" name="listingId" value={listing.id} readOnly />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={pending}
            className="border-red-200 text-red-800 hover:bg-red-50"
          >
            <TrashIcon className="mr-1.5 size-3.5" />
            Remove
          </Button>
        </form>
      </div>

      {state?.message && state.ok !== true ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
    </li>
  )
}
