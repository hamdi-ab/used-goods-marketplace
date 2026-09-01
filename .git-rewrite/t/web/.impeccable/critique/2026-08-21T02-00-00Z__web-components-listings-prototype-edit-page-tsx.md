# Critique snapshot — /listings/[id]/edit (prototype)

> **Project:** VinTech Marketplace  
> **Page:** `web/components/listings/prototype-edit-page.tsx`  
> **Status:** fixes applied + committed  

## Good
- Faithful "Split Editor" preview: real `fetchListing` data, form column + sticky preview rail (live card preview, photo strip, status select), and an honest "Preview mode — nothing is saved" action rail. Buttons are `type="button"` (no fake submit), inputs are `readOnly`/`disabled`, and the leading comment accurately describes the inert preview.

## Issues found (1) → fixed
1. **[P2] "Save changes" / "Archive listing"** (`<Button>` rail) — default `h-9` (36px) broke the app-wide 44px rhythm. → `className="h-11"`.

## Deferred (P3, acceptable)
- Native `<select>` for category/status (disabled in preview) — not made composable; scope.
- "View listing →" secondary text link under 44px — text-link convention.

## Verify
- `eslint` clean; `tsc` clean for the file.
- SSR `/listings/<nonexistent>/edit?variant=A`: HTTP 200 (route compiles; bogus id falls through to the `not-found` boundary, which proves the module loaded without error). Populated edit form requires an authenticated seller's real listing id — the `className="h-11"` change is verified via source + the identical, already-live `h-11` Button pattern on the offers/seller actions.
