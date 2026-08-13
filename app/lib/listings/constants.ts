/**
 * Pure listing domain value objects.
 *
 * Framework-agnostic constants, types and helpers shared by Server and Client
 * modules. This module intentionally has NO `server-only` import and imports no
 * Supabase client, so Client Components can consume it directly without pulling
 * the server seam into the client graph. `@/lib/listings` re-exports everything
 * here (`export *`) so existing server-side imports keep resolving.
 */

export const CONDITIONS = ["Brand New", "Lightly Used", "Fair"] as const
export const STATUSES = ["draft", "published", "sold"] as const // "archived" is delete-only
export const MAX_IMAGES = 10

export type Condition = (typeof CONDITIONS)[number]
export type ListingStatus = (typeof STATUSES)[number] | "archived"

export interface ListingStatusOption {
  value: string
  label: string
  disabled?: boolean
}

export const STATUSES_FOR_DISPLAY: ListingStatusOption[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived", disabled: true },
]

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

export interface FormatPriceOptions {
  maxFractionDigits?: number
}

export function formatPrice(
  price: number | string,
  opts: FormatPriceOptions = {}
): string {
  const n = typeof price === "number" ? price : Number(price)
  if (Number.isNaN(n)) return "ETB \u2014"
  const maxFractionDigits = opts.maxFractionDigits ?? 0
  try {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
      maximumFractionDigits: maxFractionDigits,
    }).format(n)
  } catch {
    return `ETB ${Math.round(n)}`
  }
}

const CONDITION_LABELS: Record<Condition, string> = {
  "Brand New": "Brand new",
  "Lightly Used": "Lightly used",
  "Fair": "Fair",
}

export function formatCondition(condition: Condition): string {
  return CONDITION_LABELS[condition] ?? condition
}

export const CONDITION_COLORS: Record<Condition, string> = {
  "Brand New": "bg-green-100 text-green-800",
  "Lightly Used": "bg-blue-100 text-blue-800",
  "Fair": "bg-amber-100 text-amber-800",
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id)
}
