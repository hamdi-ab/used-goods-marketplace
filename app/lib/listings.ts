import "server-only"

import { createClient } from "@/lib/supabase/server"
import {
  detectImageMime,
  EXT_BY_MIME,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_MIME,
  uploadObjects,
} from "@/lib/media"

import {
  BROWSE_LIMIT_MAX,
  LISTING_COLUMNS,
  MAX_IMAGES,
  PAGE_SIZE,
  isValidUuid,
} from "./listings/constants"
import type {
  BrowseListing,
  BrowseSeller,
  Category,
  Condition,
  Listing,
  ListingEditPayload,
  ListingImage,
  ListingPayload,
  ListingStatus,
  ListingWithRelations,
} from "./listings/constants"
import type { SearchSort } from "@/lib/search"

// Re-export the pure value objects so imports from "@/lib/listings" keep
// resolving. Definitions live in ./listings/constants (server-free).
export * from "./listings/constants"

// ---- Internal row shape (server-only; not part of the public value object) ----

interface RawListingRow {
  id: string
  title: string
  price: number
  condition: Condition
  city: string | null
  published_at: string
  seller: BrowseSeller[] | null
  images: ListingImage[] | null
}

// ---- Reads ----

export async function fetchCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .order("name")
  if (error) {
    console.error("fetchCategories:", error.message)
    return []
  }
  return data as Category[]
}

export interface FetchListingOptions {
  /** Include the joined seller profile. The detail view renders the seller card,
   * but the edit flow only authorizes via the page and never reads the profile
   * row — so it can opt out of the extra profiles join. (RLS "readable by the
   * owner" already lets an owner see their unpubished/draft rows.) */
  includeSeller?: boolean
}

export async function fetchListing(
  id: string,
  opts: FetchListingOptions = {}
): Promise<ListingWithRelations | null> {
  if (!isValidUuid(id)) return null
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .maybeSingle()
  if (!listing) return null

  const { data: images } = await supabase
    .from("listing_images")
    .select("id, listing_id, image_url, display_order, alt_text")
    .eq("listing_id", id)
    .order("display_order", { ascending: true })

  let category: Category | null = null
  if (listing.category_id) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("id", listing.category_id)
      .maybeSingle()
    category = (cat as Category | null) ?? null
  }

  // The seller join is opt-out: one seam serves both read intents (detail wants
  // seller, edit does not), instead of two near-copied functions.
  let seller: ListingWithRelations["seller"] = null
  if (opts.includeSeller !== false) {
    const { data: s } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role, trust_score")
      .eq("id", listing.seller_id)
      .maybeSingle()
    seller = s as ListingWithRelations["seller"]
  }

  return {
    listing: listing as Listing,
    images: (images ?? []) as ListingImage[],
    category: category as Category | null,
    seller,
  }
}

export async function fetchSellerListings(sellerId: string): Promise<Listing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
  if (error) {
    console.error("fetchSellerListings:", error.message)
    return []
  }
  return data as Listing[]
}

// Public, paginated browse of published listings (anon-readable via RLS).
export async function fetchListings(opts: {
  limit?: number
  offset?: number
  categorySlug?: string
} = {}): Promise<{
  listings: BrowseListing[]
  count: number | null
  hasMore: boolean
  error: string | null
}> {
  const supabase = await createClient()
  const limit = Math.min(opts.limit ?? PAGE_SIZE, BROWSE_LIMIT_MAX)
  // offset is an untrusted cursor from the URL; parseBrowseParams
  // (lib/browse) is the single source of truth that validates + clamps it
  // to the 1000-row paging window so "Load more" always terminates.
  const offset = opts.offset ?? 0

  let categoryId: string | null = null
  if (opts.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", opts.categorySlug)
      .maybeSingle()
    categoryId = cat?.id ?? null
    if (!categoryId) return { listings: [], count: 0, hasMore: false, error: null }
  }

  let query = supabase
    .from("listings")
    .select(
      `id, title, price, condition, city, published_at,
       seller:profiles(id, full_name, avatar_url, role, trust_score),
       images:listing_images(id, image_url, display_order)`,
      { count: "exact" }
    )
    .eq("status", "published")
  if (categoryId) query = query.eq("category_id", categoryId)

  const { data, error, count } = await query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchListings:", error.message)
    return { listings: [], count, hasMore: false, error: error.message }
  }

  const listings: BrowseListing[] = (data as RawListingRow[] | null ?? []).map(
    (l) => {
      const images = l.images ?? []
      const cover =
        [...images]
          .sort((a, b) => a.display_order - b.display_order)[0]?.image_url ??
        null
      const seller = l.seller?.[0] ?? null
      return {
        id: l.id,
        title: l.title,
        price: l.price,
        condition: l.condition,
        city: l.city,
        published_at: l.published_at,
        image_url: cover,
        image_count: images.length,
        seller: seller
          ? {
              id: seller.id,
              full_name: seller.full_name,
              avatar_url: seller.avatar_url,
              role: seller.role,
              trust_score: seller.trust_score,
            }
          : null,
      }
    }
  )

  const hasMore = typeof count === "number" ? offset + listings.length < count : false
  return { listings, count, hasMore, error: null }
}

export interface SearchOptions {
  q?: string
  categorySlug?: string
  minPrice?: number
  maxPrice?: number
  condition?: Condition
  city?: string
  sort?: SearchSort
  offset?: number
}

export interface SearchResult {
  listings: BrowseListing[]
  totalCount: number
  hasMore: boolean
  error: string | null
}

/** Row shape returned by the `search_listings` RPC (see migrations). */
interface SearchListingRow {
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
  total_count: number
}

// Keyword + filters + sort + count in one round trip via the search_listings
// RPC (T06, Search Service). Paging mirrors fetchListings: one PAGE_SIZE window
// that never crosses the 1000-row ceiling, with `hasMore` derived from the
// exact count the RPC returns alongside the slice.
export async function searchListings(
  opts: SearchOptions = {}
): Promise<SearchResult> {
  const supabase = await createClient()
  const offset = Math.min(Math.max(opts.offset ?? 0, 0), BROWSE_LIMIT_MAX - 1)

  const { data, error } = await supabase.rpc("search_listings", {
    p_query: opts.q || null,
    p_category_slug: opts.categorySlug || null,
    p_min_price: opts.minPrice ?? null,
    p_max_price: opts.maxPrice ?? null,
    p_condition: opts.condition ?? null,
    p_city: opts.city || null,
    p_sort: opts.sort ?? "newest",
    p_limit: PAGE_SIZE,
    p_offset: offset,
  })

  if (error) {
    console.error("searchListings:", error.message)
    return { listings: [], totalCount: 0, hasMore: false, error: error.message }
  }

  const rows = (data ?? []) as SearchListingRow[]
  const listings: BrowseListing[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    condition: row.condition,
    city: row.city,
    published_at: row.published_at,
    image_url: row.image_url,
    image_count: row.image_count,
    seller: row.seller_id
      ? {
          id: row.seller_id,
          full_name: row.seller_full_name,
          avatar_url: row.seller_avatar_url,
          role: row.seller_role,
          trust_score: row.seller_trust_score,
        }
      : null,
  }))

  const totalCount = rows.length > 0 ? rows[0].total_count : 0
  return {
    listings,
    totalCount,
    hasMore: offset + listings.length < totalCount,
    error: null,
  }
}

// ---- Writes (called by server actions; DB access centralized here, §17) ----

export async function createListing(
  values: ListingPayload,
  sellerId: string
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient()

  if (values.categoryId) {
    const { count } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true })
      .eq("id", values.categoryId)
    if (!count) return { error: "Invalid category" }
  }

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      seller_id: sellerId,
      category_id: values.categoryId ?? null,
      title: values.title,
      description: values.description ?? null,
      price: values.price,
      condition: values.condition,
      city: values.city,
      sub_city: values.subCity ?? null,
      address: values.address ?? null,
      negotiable: values.negotiable ?? false,
      status: "published" as ListingStatus,
    })
    .select("id")
    .single()

  if (error || !listing) {
    return { error: error?.message ?? "Could not create listing" }
  }

  // Photos are required by the schema; upload them. If upload fails, compensate
  // by deleting the half-created listing so we never persist a gallery-less row.
  const uploadError = await uploadListingPhotos(
    supabase,
    listing.id,
    sellerId,
    values.photos ?? []
  )
  if (uploadError) {
    await supabase.from("listings").delete().eq("id", listing.id)
    return { error: uploadError }
  }

  return { id: listing.id }
}

export async function updateListing(
  values: ListingEditPayload,
  sellerId: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .update({
      category_id: values.categoryId ?? null,
      title: values.title,
      description: values.description ?? null,
      price: values.price,
      condition: values.condition,
      city: values.city,
      sub_city: values.subCity ?? null,
      address: values.address ?? null,
      negotiable: values.negotiable ?? false,
      ...(values.status ? { status: values.status } : {}),
    })
    .eq("id", values.id)
    .eq("seller_id", sellerId)
    .select("id")

  if (error) return { ok: false, error: error.message }
  if (!data || data.length === 0) return { ok: false, error: "Listing not found" }
  return { ok: true, error: null }
}

export async function softDeleteListing(
  id: string,
  sellerId: string
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", sellerId)
    .select("id")

  if (error) return { ok: false, error: error.message }
  if (!data || data.length === 0) return { ok: false, error: "Listing not found" }
  return { ok: true, error: null }
}

export async function uploadListingPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  listingId: string,
  sellerId: string,
  files: File[]
): Promise<string | null> {
  if (files.length > MAX_IMAGES) {
    return `Up to ${MAX_IMAGES} photos allowed`
  }

  // The listing-image adapter: one of two adapters behind the shared Media
  // upload seam (see lib/media). Bucket + path + reconciliation vary; the
  // validate/upload/publicUrl/cleanup skeleton does not.
  const result = await uploadObjects(
    files.map((file, i) => ({ file, index: i })),
    {
      bucket: "listing-images",
      validate: async (file) => {
        const detected = await detectImageMime(file)
        if (!detected || !ALLOWED_IMAGE_MIME.includes(detected)) {
          return `${file.name || "Photo"} is not a valid JPG, PNG or WebP image`
        }
        if (file.size > MAX_IMAGE_BYTES) {
          return "Each photo must be 5 MB or smaller"
        }
        return null
      },
      path: async (file, i) => {
        const ext = EXT_BY_MIME[(await detectImageMime(file)) ?? ""] ?? "jpg"
        return `${listingId}/${crypto.randomUUID()}-${i}.${ext}`
      },
      upsert: false,
      reconcile: async (publicUrl, _file, i) => {
        const { error } = await supabase.from("listing_images").insert({
          listing_id: listingId,
          image_url: publicUrl,
          display_order: i,
          alt_text: null,
        })
        return error ? error.message : null
      },
    },
    supabase
  )

  return result.ok ? null : result.error
}
