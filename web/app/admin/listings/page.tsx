import type { Metadata } from "next"
import Link from "next/link"

import { fetchAdminListings } from "@/lib/admin"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { AdminListingRow } from "@/components/admin/admin-listing-row"

export const metadata: Metadata = {
  title: "Admin — Listings",
  description: "Moderate marketplace listings.",
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const offset = parseOffset(sp.offset)
  const search = typeof sp.search === "string" ? sp.search : ""
  const status = typeof sp.status === "string" ? sp.status : ""

  const { listings, count, hasMore, error } = await fetchAdminListings(
    { offset },
    { search, status }
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Listings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Moderate marketplace listings. Use Remove to archive a listing and hide it from all readers.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-16 text-center">
          <p className="text-sm text-muted-foreground">No listings found.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {count} listing{count === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <AdminListingRow listing={listing} />
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-6 flex justify-center">
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
