import { CONDITIONS, type Condition } from "@/lib/listings/constants"
import { nextOffset, parseOffset } from "@/lib/pagination"

export { nextOffset }

export const SEARCH_SORTS = ["newest", "oldest", "price_asc", "price_desc"] as const
export type SearchSort = (typeof SEARCH_SORTS)[number]

export interface SearchQuery {
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
}): SearchQuery {
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

  return {
    q,
    categorySlug,
    minPrice,
    maxPrice,
    condition,
    city,
    sort,
    offset: parseOffset(single(params.offset)),
  }
}

function parsePrice(v: string | undefined): number | undefined {
  if (v === undefined) return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Build the search URL from a query object, omitting empty/zero params. */
export function buildSearchUrl(query: SearchQuery): string {
  const params = new URLSearchParams()
  if (query.q) params.set("q", query.q)
  if (query.categorySlug) params.set("category", query.categorySlug)
  if (query.minPrice !== undefined) params.set("min", String(query.minPrice))
  if (query.maxPrice !== undefined) params.set("max", String(query.maxPrice))
  if (query.condition) params.set("condition", query.condition)
  if (query.city) params.set("city", query.city)
  if (query.sort !== "newest") params.set("sort", query.sort)
  if (query.offset) params.set("offset", String(query.offset))
  const qs = params.toString()
  return qs ? `/search?${qs}` : "/search"
}
