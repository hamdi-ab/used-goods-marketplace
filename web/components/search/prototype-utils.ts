import type { SearchSort } from "@/lib/search"
import { SEARCH_SORTS } from "@/lib/search"
import { buildSearchUrl, type SearchQuery } from "@/lib/search"

// PROTOTYPE — shared helpers for the browse-page redesign variants
// (pills + collapsible filter sheet + result-header upgrade). Gated by
// ?variant= on the search page and removed with the prototype machinery.

export type VariantKey = "A" | "B"

/** Append the variant param to any internal URL, preserving existing params
 * and hash fragments (e.g. `/dashboard#listings` keeps its anchor). */
export function withVariant(url: string, variant: VariantKey): string {
  const [path, hashPart] = url.split("#")
  const [pathname, qs] = path.split("?")
  const params = new URLSearchParams(qs ?? "")
  params.set("variant", variant)
  const next = params.toString()
  const withQuery = next ? `${pathname}?${next}` : pathname
  return hashPart ? `${withQuery}#${hashPart}` : withQuery
}

export const SORT_LABELS: Record<SearchSort, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
}

export const DEFAULT_SORT: SearchSort = "newest"

export function isSort(v: string | undefined): v is SearchSort {
  return (SEARCH_SORTS as readonly string[]).includes(v ?? "")
}

export { buildSearchUrl }
export type { SearchQuery }