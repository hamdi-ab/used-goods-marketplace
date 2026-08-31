import type {
  BrowseListing,
  BrowseSeller,
  Condition,
  ListingImage,
  ListingStatus,
} from "@/lib/listings/constants"

export interface NestedBrowseRow {
  id: string
  title: string
  price: number
  condition: Condition
  city: string | null
  status: ListingStatus
  published_at: string
  boosted_until?: string | null
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
  boosted_until?: string | null
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

export function pickCoverImage(
  images: { image_url: string; display_order: number }[] | null | undefined
): string | null {
  return (
    [...(images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]
      ?.image_url ?? null
  )
}

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

export function mapNestedBrowseListing(row: NestedBrowseRow): BrowseListing {
  const seller = row.seller?.[0] ?? null
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    condition: row.condition,
    city: row.city,
    status: row.status,
    published_at: row.published_at,
    boosted_until: row.boosted_until ?? null,
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

export function mapFlatSearchListing(row: FlatSearchRow): BrowseListing {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    condition: row.condition,
    city: row.city,
    status: "published",
    published_at: row.published_at,
    boosted_until: row.boosted_until ?? null,
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
