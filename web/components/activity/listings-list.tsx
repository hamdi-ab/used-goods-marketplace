import Link from "next/link"
import { fetchSellerListings } from "@/lib/listings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/listings"
import { formatShortDate } from "@/lib/utils"

export async function ListingsList({ userId }: { userId: string }) {
  const { listings, error } = await fetchSellerListings(userId, { limit: 20 })

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">Could not load your listings.</p>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted text-2xl">
          📦
        </div>
        <h3 className="mb-1 font-semibold">My listings</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Manage the items you are selling.
        </p>
        <Button asChild>
          <Link href="/sell">Create a listing</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {listings.map((item) => (
        <div
          key={item.id}
          className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/listings/${item.id}`}
                className="truncate font-semibold hover:underline"
              >
                {item.title}
              </Link>
              <Badge variant="outline" className="capitalize">
                {item.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm font-medium text-primary">
              {formatPrice(item.price)}
            </p>
            <p className="text-xs text-muted-foreground">
              Created {formatShortDate(item.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/listings/${item.id}/edit`}>Edit</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/listings/${item.id}`}>View</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
