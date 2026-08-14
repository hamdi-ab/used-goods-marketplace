import type {
  BrowseListing,
  BrowseSeller,
  Condition,
  ListingImage,
} from "./constants"

// ---- The two shapes the browse feed can arrive in ----
//
// The browse and favorites feeds select PostgREST nested joins
// (seller:profiles(...), images:listing_images(...)), while the search feed
// consumes the flat search_listings RPC row (seller_* columns + a precomputed
// image_url/image_count). One mapper below turns either into the single
// BrowseListing display shape, so "which image is the cover" and "how the
// seller is stitched" never fork.

export interface NestedBrowseRow {
  id: string
  title: string
  price: number
  condition: Condition
  city: string | null
  published_at: string
  seller: BrowseSeller[] | null
  images: ListingImage[] | null
}

export interface FlatSearchRow {
  id: string
  title: string
  price: number
  condition: Condition
  city: string | null
  published_at: string
  image_url: string | null
  image_count: number
  seller_id: string | null
  seller_full_name: string | null
  seller_avatar_url: string | null
  seller_role: string | null
  seller_trust_score: number | null
  seller_phone_verified?: boolean | null
  seller_fayda_verified?: boolean | null
}

export type BrowseRow = NestedBrowseRow | FlatSearchRow

/** Shared cover-pick: the lowest display_order image is the listing's cover.
 * One rule for every listing read shape that renders a thumbnail (browse feed,
 * favorites feed, seller dashboard, admin report queue) so it never forks. */
export function pickCoverImage(
  images: { image_url: string; display_order: number }[] | null | undefined
): string | null {
  return (
    [...(images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]
      ?.image_url ?? null
  )
}

// Stitch a seller from the denormalized fields that both the nested join
// (BrowseSeller) and the flat search RPC (seller_* columns) produce. Keeping
// the 6-field seller shape in one place is what stops a new badge column from
// forking between the two read paths.
export function buildSeller(fields: {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  trust_score: number | null
  phone_verified: boolean | null
  fayda_verified: boolean | null
}): BrowseSeller {
  return {
    id: fields.id,
    full_name: fields.full_name,
    avatar_url: fields.avatar_url,
    role: fields.role,
    trust_score: fields.trust_score,
    phone_verified: fields.phone_verified ?? null,
    fayda_verified: fields.fayda_verified ?? null,
  }
}

/** Map a nested (browse/favorites) or flat (search RPC) row to the display
 * shape both feeds render. Nested rows always carry the `images` key (even
 * when null), which is how the two shapes are told apart. */
export function mapBrowseListing(row: BrowseRow): BrowseListing {
  if ("images" in row) {
    const seller = row.seller?.[0] ?? null
    return {
      id: row.id,
      title: row.title,
      price: row.price,
      condition: row.condition,
      city: row.city,
      published_at: row.published_at,
      image_url: pickCoverImage(row.images),
      image_count: (row.images ?? []).length,
      seller: seller
        ? buildSeller({
            id: seller.id,
            full_name: seller.full_name,
            avatar_url: seller.avatar_url,
            role: seller.role,
            trust_score: seller.trust_score,
            phone_verified: seller.phone_verified ?? null,
            fayda_verified: seller.fayda_verified ?? null,
          })
        : null,
    }
  }

  return {
    id: row.id,
    title: row.title,
    price: row.price,
    condition: row.condition,
    city: row.city,
    published_at: row.published_at,
    image_url: row.image_url,
    image_count: row.image_count,
    seller: row.seller_id
      ? buildSeller({
          id: row.seller_id,
          full_name: row.seller_full_name,
          avatar_url: row.seller_avatar_url,
          role: row.seller_role,
          trust_score: row.seller_trust_score,
          phone_verified: row.seller_phone_verified ?? null,
          fayda_verified: row.seller_fayda_verified ?? null,
        })
      : null,
  }
}
