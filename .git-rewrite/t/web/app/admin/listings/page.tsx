import type { Metadata } from "next"
import Link from "next/link"
import { ListIcon } from "lucide-react"

import { fetchAdminListings } from "@/lib/admin"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { AdminListingRow } from "@/components/admin/admin-listing-row"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Admin — Listings",
  description: "Moderate marketplace listings.",
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const offset = parseOffset((await searchParams).offset)
  const { listings, count, hasMore, error } = await fetchAdminListings({
    offset,
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Listings
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {(count ?? 0).toLocaleString()} live{" "}
          {(count ?? 0) === 1 ? "listing" : "listings"}. Use Remove to archive
          a listing and hide it from all readers.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ListIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              Could not load listings
            </h2>
          </CardContent>
        </Card>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ListIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              No listings yet
            </h2>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {listings.map((listing) => (
              <AdminListingRow key={listing.id} listing={listing} />
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-8 flex justify-center">
              <Link
                href={`/admin/listings?offset=${nextOffset(offset)}`}
                className="text-sm font-medium underline"
              >
                Load more
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
