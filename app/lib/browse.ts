import { BROWSE_LIMIT_MAX, PAGE_SIZE } from "@/lib/listings"

export interface BrowseCursor {
  categorySlug: string | undefined
  offset: number
}

/** Parse + clamp the browse cursor from untrusted URL search params.
 *
 * Single source of truth for the paging window: the offset is finite,
 * non-negative and never exceeds the 1000-row ceiling, so "Load more" can no
 * longer point past the end of the window (the homepage used to re-parse the
 * offset and build `nextHref` from the raw, unclamped value).
 * (§15: validate external input — offset comes from the URL.) */
export function parseBrowseParams(params: {
  category?: string | string[] | undefined
  offset?: string | string[] | undefined
}): BrowseCursor {
  const categorySlug =
    typeof params.category === "string" ? params.category : undefined
  const raw = typeof params.offset === "string" ? params.offset : ""
  const parsed = Number(raw)
  const offset =
    Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, BROWSE_LIMIT_MAX - 1)
      : 0
  return { categorySlug, offset }
}

/** Build the paginated browse URL (replaces the inline helper in app/page.tsx). */
export function buildBrowseUrl(
  categorySlug: string | undefined,
  offset: number
): string {
  const params = new URLSearchParams()
  if (categorySlug) params.set("category", categorySlug)
  if (offset) params.set("offset", String(offset))
  return `/?${params.toString()}`
}

export function nextOffset(offset: number): number {
  return offset + PAGE_SIZE
}
