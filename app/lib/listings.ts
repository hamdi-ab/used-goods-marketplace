import "server-only"

import { createClient } from "@/lib/supabase/server"

export type Condition = "Brand New" | "Lightly Used" | "Fair"
export type ListingStatus = "draft" | "published" | "sold" | "archived"

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

export async function fetchListing(
  id: string
): Promise<ListingWithRelations | null> {
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from("listings")
    .select(
      "id, seller_id, category_id, title, description, price, condition, negotiable, city, sub_city, address, status, view_count, favorite_count, published_at, created_at, updated_at"
    )
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

export async function fetchSellerListings(
  sellerId: string
): Promise<Listing[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, seller_id, category_id, title, description, price, condition, negotiable, city, sub_city, address, status, view_count, favorite_count, published_at, created_at, updated_at"
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("fetchSellerListings:", error.message)
    return []
  }
  return data as Listing[]
}
