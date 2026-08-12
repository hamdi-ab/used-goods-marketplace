import "server-only"

import { createClient } from "@/lib/supabase/server"

// ---- Shared value sets (also drive the client form via literals) ----
export const CONDITIONS = ["Brand New", "Lightly Used", "Fair"] as const
export const STATUSES = ["draft", "published", "sold"] as const // "archived" is delete-only
export const MAX_IMAGES = 10
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"]

export type Condition = (typeof CONDITIONS)[number]
export type ListingStatus = (typeof STATUSES)[number] | "archived"

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

export interface ListingImage {
  id: string
  listing_id: string
  image_url: string
  display_order: number
  alt_text: string | null
}

export interface Listing {
  id: string
  seller_id: string
  category_id: string | null
  title: string
  description: string | null
  price: number
  condition: Condition
  negotiable: boolean
  city: string | null
  sub_city: string | null
  address: string | null
  status: ListingStatus
  view_count: number
  favorite_count: number
  published_at: string
  created_at: string
  updated_at: string
}

export interface ListingWithRelations {
  listing: Listing
  images: ListingImage[]
  category: Category | null
  seller: {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: string | null
    trust_score: number | null
  } | null
}

export interface ListingPayload {
  title: string
  description?: string
  price: number
  condition: Condition
  categoryId?: string
  city: string
  subCity?: string
  address?: string
  negotiable: boolean
  photos?: File[]
}

export interface ListingEditPayload {
  id: string
  title: string
  description?: string
  price: number
  condition: Condition
  categoryId?: string
  city: string
  subCity?: string
  address?: string
  negotiable: boolean
  status?: ListingStatus
}

export const LISTING_COLUMNS =
  "id, seller_id, category_id, title, description, price, condition, negotiable, city, sub_city, address, status, view_count, favorite_count, published_at, created_at, updated_at"

// ---- Helpers ----

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id)
}

/** Returns the image MIME derived from magic bytes, or null if it's not a real image (rejects executables). */
async function detectImageMime(file: File): Promise<string | null> {
  const slice = file.slice(0, 12)
  const buf = await slice.arrayBuffer()
  const b = new Uint8Array(buf)
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg"
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png"
  // RIFF....WEBP
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp"
  }
  return null
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
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

export async function fetchListing(id: string): Promise<ListingWithRelations | null> {
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

  const { data: seller } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, trust_score")
    .eq("id", listing.seller_id)
    .maybeSingle()

  return {
    listing: listing as Listing,
    images: (images ?? []) as ListingImage[],
    category: category as Category | null,
    seller: seller as ListingWithRelations["seller"],
  }
}

// Reads the row for the owner even when not published (used by edit page).
export async function fetchListingForEdit(
  id: string,
  sellerId: string
): Promise<ListingWithRelations | null> {
  if (!isValidUuid(id)) return null
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from("listings")
    .select(LISTING_COLUMNS)
    .eq("id", id)
    .eq("seller_id", sellerId)
    .maybeSingle()
  if (!listing) return null

  const { data: images } = await supabase
    .from("listing_images")
    .select("id, listing_id, image_url, display_order, alt_text")
    .eq("listing_id", id)
    .order("display_order", { ascending: true })

  const { data: category } = listing.category_id
    ? await supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .eq("id", listing.category_id)
        .maybeSingle()
    : { data: null }

  return {
    listing: listing as Listing,
    images: (images ?? []) as ListingImage[],
    category: (category as Category | null) ?? null,
    seller: null,
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

export const PAGE_SIZE = 12
// Supabase/PostgREST caps a single select result set at 1000 rows. Browse is
// windowed: each request fetches PAGE_SIZE rows and we never page past the
// 1000-row ceiling (T05, NFR-COMP-003).
export const BROWSE_LIMIT_MAX = 1000

export interface BrowseSeller {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  trust_score: number | null
}

export interface BrowseListing {
  id: string
  title: string
  price: number
  condition: Condition
  city: string | null
  published_at: string
  image_url: string | null
  image_count: number
  seller: BrowseSeller | null
}

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

export function formatPrice(price: number | string): string {
  const n = typeof price === "number" ? price : Number(price)
  if (Number.isNaN(n)) return "ETB —"
  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n)
  } catch {
    return `ETB ${Math.round(n)}`
  }
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
  // Clamp + guard the pagination window: finite, non-negative, and never past
  // the 1000-row ceiling so "Load more" always terminates. (§15: validate
  // external input — offset comes from the URL.)
  const requestedOffset = opts.offset ?? 0
  const offset =
    Number.isFinite(requestedOffset) && requestedOffset > 0
      ? Math.min(requestedOffset, BROWSE_LIMIT_MAX - 1)
      : 0

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

  // Track objects successfully uploaded so they can be cleaned up if a later
  // step fails — otherwise a partial batch would orphan storage objects.
  const uploadedPaths: string[] = []
  const cleanupUploaded = async () => {
    if (uploadedPaths.length) {
      await supabase.storage.from("listing-images").remove(uploadedPaths).catch(() => {})
    }
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const detected = await detectImageMime(file)
      if (!detected || !ALLOWED_IMAGE_MIME.includes(detected)) {
        await cleanupUploaded()
        return `${file.name || "Photo"} is not a valid JPG, PNG or WebP image`
      }
      if (file.size > MAX_IMAGE_BYTES) {
        await cleanupUploaded()
        return "Each photo must be 5 MB or smaller"
      }

      const ext = EXT_BY_MIME[detected]
      const path = `${listingId}/${crypto.randomUUID()}-${i}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file, { upsert: false })

      if (uploadError) {
        await cleanupUploaded()
        return uploadError.message
      }
      uploadedPaths.push(path)

      const {
        data: { publicUrl },
      } = supabase.storage.from("listing-images").getPublicUrl(path)

      const { error: imageError } = await supabase.from("listing_images").insert({
        listing_id: listingId,
        image_url: publicUrl,
        display_order: i,
        alt_text: null,
      })

      if (imageError) {
        await cleanupUploaded()
        return imageError.message
      }
    }

    return null
  } catch (error) {
    await cleanupUploaded()
    return error instanceof Error ? error.message : "Failed to upload photos"
  }
}
