import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import {
  pagedHasMore,
  resolveWindow,
  type PagingArgs,
} from "@/lib/pagination"

export interface AdminUserRow {
  id: string
  full_name: string | null
  role: "buyer" | "seller" | "admin"
  city: string | null
  phone: string | null
  telegram_username: string | null
  trust_score: number | null
  profile_completion: number | null
  phone_verified: boolean | null
  fayda_verified: boolean | null
  suspended_at: string | null
  created_at: string
}

const ADMIN_USER_COLUMNS =
  "id, full_name, role, city, phone, telegram_username, trust_score, profile_completion, phone_verified, fayda_verified, suspended_at, created_at"

export interface AdminListingRow {
  id: string
  title: string
  price: number
  condition: string | null
  status: string
  city: string | null
  view_count: number | null
  favorite_count: number | null
  sold_to_buyer_id: string | null
  created_at: string
  published_at: string | null
  images: { image_url: string; display_order: number }[] | null
  seller: {
    id: string
    full_name: string | null
  } | null
}

export interface AdminUsersPage {
  users: AdminUserRow[]
  count: number | null
  hasMore: boolean
  error: string | null
}

export interface AdminUsersFilter {
  search?: string
  role?: "buyer" | "seller" | "admin"
}

export async function fetchAdminUsers(
  args: PagingArgs = {},
  filter: AdminUsersFilter = {},
  client?: SupabaseClient
): Promise<AdminUsersPage> {
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)

  let query = supabase
    .from("profiles")
    .select(ADMIN_USER_COLUMNS, { count: "exact" })
    .is("deleted_at", null)

  if (filter.search) {
    query = query.ilike("full_name", `%${filter.search}%`)
  }
  if (filter.role) {
    query = query.eq("role", filter.role)
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchAdminUsers:", error.message)
    return { users: [], count, hasMore: false, error: error.message }
  }

  const users = (data ?? []) as unknown as AdminUserRow[]
  return {
    users,
    count,
    hasMore: pagedHasMore(offset, users.length, count),
    error: null,
  }
}

export interface AdminListingsPage {
  listings: AdminListingRow[]
  count: number | null
  hasMore: boolean
  error: string | null
}

export interface AdminListingsFilter {
  search?: string
  status?: string
}

export async function fetchAdminListings(
  args: PagingArgs = {},
  filter: AdminListingsFilter = {},
  client?: SupabaseClient
): Promise<AdminListingsPage> {
  const supabase = client ?? (await createClient())
  const { limit, offset } = resolveWindow(args)

  let query = supabase
    .from("listings")
    .select(
      `id, title, price, condition, status, city, view_count, favorite_count,
       sold_to_buyer_id, created_at, published_at,
       images:listing_images(image_url, display_order),
       seller:profiles!listings_seller_id_fkey(id, full_name)`,
      { count: "exact" }
    )
    .is("deleted_at", null)

  if (filter.search) {
    query = query.ilike("title", `%${filter.search}%`)
  }
  if (filter.status) {
    query = query.eq("status", filter.status)
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("fetchAdminListings:", error.message)
    return { listings: [], count, hasMore: false, error: error.message }
  }

  type RawAdminListingRow = Omit<AdminListingRow, "price" | "seller"> & {
    price: string
    seller: { id: string; full_name: string | null }[] | null
  }
  const listings = ((data ?? []) as unknown as RawAdminListingRow[]).map(
    (row) => ({
      ...row,
      price: Number(row.price),
      seller: row.seller?.[0] ?? null,
    })
  )
  return {
    listings,
    count,
    hasMore: pagedHasMore(offset, listings.length, count),
    error: null,
  }
}
