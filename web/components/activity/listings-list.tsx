import Link from "next/link"
import { AlertCircleIcon, PackageIcon } from "lucide-react"

import { fetchSellerListings } from "@/lib/listings"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/listings"
import { formatShortDate } from "@/lib/utils"

export async function ListingsList({ userId }: { userId: string }) {
  const { listings, error } = await fetchSellerListings(userId, { limit: 20 })

  if (error) {
    return (
      <EmptyState
        icon={AlertCircleIcon}
        title="Unable to load listings"
        description="There was a problem loading your listings. Please try again."
        iconClassName="bg-destructive/10 text-destructive"
        action={
          <Button variant="outline" asChild>
            <Link href="/activity?tab=listings">Try again</Link>
          </Button>
        }
      />
    )
  }

  if (listings.length === 0) {
    return (
      <EmptyState
        icon={PackageIcon}
        title="No listings yet"
        description="You haven't created any listings. Start selling today!"
        action={
          <Button asChild>
            <Link href="/sell">Create a listing</Link>
          </Button>
        }
      />
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
