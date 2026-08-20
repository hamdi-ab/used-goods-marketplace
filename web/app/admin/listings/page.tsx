import type { Metadata } from "next"
import { ListIcon } from "lucide-react"

import { fetchAdminListings } from "@/lib/admin"
import { AdminListingRow } from "@/components/admin/admin-listing-row"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Admin — Listings",
  description: "Moderate marketplace listings.",
}

export default async function AdminListingsPage() {
  const listings = await fetchAdminListings()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Listings
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {listings.length} live {listings.length === 1 ? "listing" : "listings"}.
          Use Remove to archive a listing and hide it from all readers.
        </p>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ListIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">No listings yet</h2>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <AdminListingRow key={listing.id} listing={listing} />
          ))}
        </ul>
      )}
    </div>
  )
}
