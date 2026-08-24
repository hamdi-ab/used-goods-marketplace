import Image from "next/image"
import Link from "next/link"

import type { BrowseListing } from "@/lib/listings"
import { formatPrice } from "@/lib/listings/constants"
import { FavoriteButton } from "@/components/favorites/favorite-button"

interface ListingsBentoProps {
  listings: BrowseListing[]
  favoriteIds: Set<string> | null
}


// over a 4-column grid with 210px rows so every tile is tall enough to read:
//   row 1-2 col 1     tall spine (420px)
//   row 1-2 col 2-3   feature tile (2x2, 420px)
//   row 1-2 col 4     two smalls stacked (210px each)
//   row 3    col 1-4  four smalls (210px each)
// No full-width base tile — it was too squashed to read. Throwaway 
export function ListingsBento({ listings, favoriteIds }: ListingsBentoProps) {
  const tiles = listings.slice(0, 9)
  const [spine, feature, ...rest] = tiles
  const rightSmalls = rest.slice(0, 2)
  const bottomSmalls = rest.slice(2, 6)

  const tile = (
    l: BrowseListing,
    classes: string,
    sizes: string
  ) => (
    <Link
      key={l.id}
      href={`/listings/${l.id}`}
      className={`group relative overflow-hidden rounded-2xl border bg-muted ${classes}`}
      aria-label={l.title}
    >
      {l.image_url ? (
        <Image
          src={l.image_url}
          alt=""
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          No photo
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />
      {favoriteIds ? (
        <div className="absolute right-2 top-2">
          <FavoriteButton listingId={l.id} initial={favoriteIds.has(l.id)} />
        </div>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="line-clamp-1 text-sm font-semibold text-white">{l.title}</p>
        <p className="mt-0.5 text-sm font-semibold text-white/90">
          {formatPrice(l.price)}
        </p>
      </div>
    </Link>
  )

  return (
    <div className="grid grid-cols-2 gap-3 auto-rows-[210px] lg:grid-cols-4">
      {spine
        ? tile(spine, "col-span-1 row-span-2 lg:col-span-1 lg:row-span-2", "(max-width: 1024px) 50vw, 25vw")
        : null}
      {feature
        ? tile(feature, "col-span-2 row-span-2 lg:col-span-2 lg:row-span-2", "(max-width: 1024px) 100vw, 50vw")
        : null}
      {rightSmalls.map((l) =>
        tile(l, "col-span-1 row-span-1 lg:col-span-1 lg:row-span-1", "(max-width: 1024px) 50vw, 25vw")
      )}
      {bottomSmalls.map((l) =>
        tile(l, "col-span-1 row-span-1 lg:col-span-1 lg:row-span-1", "(max-width: 1024px) 50vw, 25vw")
      )}
    </div>
  )
}