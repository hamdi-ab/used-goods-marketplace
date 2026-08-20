import { BROWSE_LIMIT_MAX, PAGE_SIZE } from "@/lib/listings/constants"

// The highest offset a windowed page may start from. Browse and search both
// fetch PAGE_SIZE rows per request and never page past the PostgREST 1000-row
// ceiling, so a page that starts at or beyond this offset would run past the
// end of the window (T05/T06, NFR-COMP-003).
export const MAX_PAGING_OFFSET = BROWSE_LIMIT_MAX - PAGE_SIZE

/** Parse + clamp an untrusted offset from the URL into the paging window.
 *
 * Shared by `lib/browse` and `lib/search` so the two read seams can never
 * drift apart on what a valid offset looks like. The clamp guarantees
 * `offset + PAGE_SIZE <= BROWSE_LIMIT_MAX`, which is what makes "Load more"
 * terminate instead of re-clamping to the same page forever. (§15.)
 *
 * Accepts the raw searchParams value (`string | string[] | undefined`): a
 * repeated `?offset=1&offset=2` degrades to the first value, exactly like
 * `lib/search`'s `single` coercion. */
export function parseOffset(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = Number(value ?? "")
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(parsed, MAX_PAGING_OFFSET)
    : 0
}

export function nextOffset(offset: number): number {
  return offset + PAGE_SIZE
}
