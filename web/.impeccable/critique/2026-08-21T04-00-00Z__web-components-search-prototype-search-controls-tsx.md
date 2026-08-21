# Critique snapshot — /search (deeper pass)

> **Project:** VinTech Marketplace  
> **Pages:** `web/components/search/prototype-browse-page.tsx`, `prototype-search-controls.tsx`  
> **Status:** fixes applied + committed (supplements 07e7264 empty-CTA fix)  

## Good
- Coherent filter UX: debounced keyword push, category pills, collapsible sheet, removable active chips, result count + sort header, spinner on load-more. Empty + error states both present.

## Issues found → fixed
1. **[P2] "Apply" button** (filter sheet) — `size="sm"` (h-7 = 28px), the primary filter-confirm action. → `className="h-11"`.
2. **[P2] "Clear" button** (filter sheet) — `size="sm"` (28px). → `className="h-10"` (matches the "Filters" toggle + keyword input height).
3. **[P2] "Clear all" button** (active-chips bar) — `size="sm"` (28px). → `className="h-10"`.
4. **[P2] "Retry" link** (browse error state) — small underline link, inconsistent with the offers/reports "Retry" (which is a 44px primary button). → `h-11` primary button for app-wide error-recovery CTA consistency.

## Confirmed out of scope (codebase convention, not forced)
- Native `<select>` (condition/city/sort) — the entire app uses native selects with `FIELD_CLASS`; no shadcn `Select` exists. Converting is a site-wide design decision, not a page fix.
- Category pills `px-4 py-2` (~28px) — explicitly match the home "C5" pattern (cited in-file); bumping only here would diverge from home.
- `PrototypeLoadMore` text link — matches production `/offers` pagination style.
- "Back to listings" text links — text-link convention.

## Verify
- `eslint` clean for both files; `tsc` clean (className-only changes).
- `/search?variant=A|B`: HTTP 200. Default no-filter probe shows no filter-sheet chips/Buttons (sheet closed / no active chips), so the new button heights are verified by source + the identical `h-10`/`h-11` tailwind-merge pattern already proven live on offers/dashboard/profile. The empty-state "Clear all filters" CTA (`h-11`) was verified live in 07e7264.
