import {
  BROWSE_LIMIT_MAX,
  CONDITIONS,
  PAGE_SIZE,
  type Condition,
} from "@/lib/listings/constants"

export const SEARCH_SORTS = ["newest", "oldest", "price_asc", "price_desc"] as const
export type SearchSort = (typeof SEARCH_SORTS)[number]

export interface SearchFilters {
  q: string
  categorySlug: string | undefined
  minPrice: number | undefined
  maxPrice: number | undefined
  condition: Condition | undefined
  city: string
  sort: SearchSort
  offset: number
}

type SearchParamValue = string | string[] | undefined

/** Parse + clamp the search/filter query from untrusted URL search params.
 *
 * Mirrors `lib/browse`: every input is validated so a hand-edited URL can never
 * inject an invalid sort/condition/price or an out-of-window offset. The parsed
 * shape is the single source of truth for the server page, the client filter
 * form and "Load more". (§15: validate external input.) */
export function parseSearchParams(params: {
  q?: SearchParamValue
  category?: SearchParamValue
  min?: SearchParamValue
  max?: SearchParamValue
  condition?: SearchParamValue
  city?: SearchParamValue
  sort?: SearchParamValue
  offset?: SearchParamValue
}): SearchFilters {
  const single = (v: SearchParamValue): string | undefined =>
    typeof v === "string" ? v : undefined

  const q = (single(params.q) ?? "").trim()
  const categorySlug = single(params.category)?.trim() || undefined
  const minPrice = parsePrice(single(params.min))
  const maxPrice = parsePrice(single(params.max))

  const rawCondition = single(params.condition)
  const condition = (CONDITIONS as readonly string[]).includes(rawCondition ?? "")
    ? (rawCondition as Condition)
    : undefined

  const city = (single(params.city) ?? "").trim()

  const rawSort = single(params.sort) ?? ""
  const sort = (SEARCH_SORTS as readonly string[]).includes(rawSort)
    ? (rawSort as SearchSort)
    : "newest"

  const rawOffset = single(params.offset) ?? ""
  const parsedOffset = Number(rawOffset)
  const offset =
    Number.isFinite(parsedOffset) && parsedOffset > 0
      ? Math.min(parsedOffset, BROWSE_LIMIT_MAX - 1)
      : 0

  return { q, categorySlug, minPrice, maxPrice, condition, city, sort, offset }
}

function parsePrice(v: string | undefined): number | undefined {
  if (v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Build the search URL from a filters object, omitting empty/zero params. */
export function buildSearchUrl(filters: SearchFilters): string {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  if (filters.categorySlug) params.set("category", filters.categorySlug)
  if (filters.minPrice !== undefined) params.set("min", String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set("max", String(filters.maxPrice))
  if (filters.condition) params.set("condition", filters.condition)
  if (filters.city) params.set("city", filters.city)
  if (filters.sort !== "newest") params.set("sort", filters.sort)
  if (filters.offset) params.set("offset", String(filters.offset))
  const qs = params.toString()
  return qs ? `/search?${qs}` : "/search"
}

export function nextOffset(offset: number): number {
  return offset + PAGE_SIZE
}
