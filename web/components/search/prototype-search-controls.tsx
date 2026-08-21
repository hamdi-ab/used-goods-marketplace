"use client"

import {
  useState,
  useTransition,
  useEffect,
  useMemo,
  type FormEvent,
} from "react"
import { useRouter } from "next/navigation"
import {
  Loader2Icon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react"

import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FIELD_CLASS } from "@/lib/form-fields"
import { cn } from "@/lib/utils"
import {
  CONDITIONS,
  KNOWN_CITY_LABELS,
  type Category,
  type Condition,
} from "@/lib/listings/constants"
import {
  buildSearchUrl,
  SORT_LABELS,
  withVariant,
  type SearchQuery,
  type VariantKey,
} from "@/components/search/prototype-utils"

const DEBOUNCE_MS = 300

// PROTOTYPE — browse-page redesign controls (moodboard #1 + #3): a compact
// keyword pill + "Filters" toggle that expands a sheet, category pills (matching
// the home C5 pattern), removable active-filter chips, and the sort control in
// the result header. Every change debounces a router.push that preserves ?variant=.
export function PrototypeSearchControls({
  categories,
  filters,
  variant,
  count,
  title,
}: {
  categories: Category[]
  filters: SearchQuery
  variant: VariantKey
  count: number
  title?: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(filters.q)
  const [condition, setCondition] = useState<Condition | "">(filters.condition ?? "")
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "")
  const [city, setCity] = useState(filters.city)
  const [sellerVerified, setSellerVerified] = useState(filters.sellerVerified)
  const [sort, setSort] = useState(filters.sort)
  const [sheetOpen, setSheetOpen] = useState(false)

  const push = (url: string) => router.push(withVariant(url, variant))

  const pendingQuery = buildSearchUrl({
    ...filters,
    q,
    categorySlug: filters.categorySlug,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    condition: condition || undefined,
    city,
    sellerVerified,
    sort,
    offset: 0,
  })
  const debouncedQuery = useDebounce(pendingQuery, DEBOUNCE_MS)
  const [isNavigating, startTransition] = useTransition()

  const activeQuery = useMemo(
    () =>
      buildSearchUrl({
        q: filters.q,
        categorySlug: filters.categorySlug,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        condition: filters.condition,
        city: filters.city,
        sellerVerified: filters.sellerVerified,
        sort: filters.sort,
        offset: filters.offset,
      }),
    [filters]
  )

  useEffect(() => {
    if (debouncedQuery === activeQuery) return
    startTransition(() => {
      router.push(withVariant(debouncedQuery, variant))
    })
  }, [debouncedQuery, activeQuery, router, variant])

  const isPending = isNavigating || debouncedQuery !== activeQuery

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(() => push(debouncedQuery))
  }

  function apply(mutate: (f: SearchQuery) => SearchQuery) {
    const next = mutate({ ...filters, offset: 0 })
    startTransition(() => push(buildSearchUrl(next)))
  }

  function setCategory(slug: string | undefined) {
    apply((f) => ({
      ...f,
      categorySlug: slug === f.categorySlug ? undefined : slug,
    }))
  }

  const activeChips: { label: string; clear: () => void }[] = []
  if (filters.q) {
    activeChips.push({
      label: `“${filters.q}”`,
      clear: () => setQ(""),
    })
  }
  if (filters.categorySlug) {
    const cat = categories.find((c) => c.slug === filters.categorySlug)
    activeChips.push({
      label: cat?.name ?? filters.categorySlug,
      clear: () => setCategory(undefined),
    })
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    activeChips.push({
      label:
        filters.minPrice !== undefined && filters.maxPrice !== undefined
          ? `ETB ${filters.minPrice} – ${filters.maxPrice}`
          : filters.minPrice !== undefined
            ? `From ETB ${filters.minPrice}`
            : `Up to ETB ${filters.maxPrice}`,
      clear: () =>
        apply((f) => ({ ...f, minPrice: undefined, maxPrice: undefined })),
    })
  }
  if (filters.condition) {
    activeChips.push({
      label: filters.condition,
      clear: () => apply((f) => ({ ...f, condition: undefined })),
    })
  }
  if (filters.city) {
    activeChips.push({
      label: filters.city,
      clear: () => apply((f) => ({ ...f, city: "" })),
    })
  }
  if (filters.sellerVerified) {
    activeChips.push({
      label: "Verified sellers only",
      clear: () => apply((f) => ({ ...f, sellerVerified: false })),
    })
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} aria-label="Search and filter listings">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Label htmlFor="proto-search-keyword" className="sr-only">
              Search by keyword
            </Label>
            <Input
              id="proto-search-keyword"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by keyword, e.g. “laptop”"
              className="h-10 rounded-full pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSheetOpen((open) => !open)}
            aria-expanded={sheetOpen}
            className="h-10 rounded-full"
          >
            <SlidersHorizontalIcon className="size-4" />
            Filters{activeChips.length > 0 ? ` (${activeChips.length})` : ""}
          </Button>
          {isPending ? (
            <Loader2Icon
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Updating results"
            />
          ) : null}
        </div>

        <div
          className="scrollbar-none -mx-1 mt-3 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Category"
        >
          <button
            type="button"
            onClick={() => apply((f) => ({ ...f, categorySlug: undefined }))}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              !filters.categorySlug
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/50"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                filters.categorySlug === c.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {sheetOpen ? (
          <div className="mt-3 grid grid-cols-1 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proto-search-condition">Condition</Label>
              <select
                id="proto-search-condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition | "")}
                className={FIELD_CLASS}
              >
                <option value="">Any condition</option>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proto-search-min">Min price (ETB)</Label>
              <Input
                id="proto-search-min"
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="No minimum"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proto-search-max">Max price (ETB)</Label>
              <Input
                id="proto-search-max"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No maximum"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proto-search-city">City</Label>
              <select
                id="proto-search-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">Any city</option>
                {KNOWN_CITY_LABELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end gap-3">
              <label
                htmlFor="proto-search-verified"
                className="flex items-start gap-2 pt-1 font-medium"
              >
                <input
                  id="proto-search-verified"
                  type="checkbox"
                  checked={sellerVerified}
                  onChange={(e) => setSellerVerified(e.target.checked)}
                  className="mt-0.5 size-4 cursor-pointer rounded border-input align-middle text-primary focus:ring-2 focus:ring-ring"
                />
                Verified seller only
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    setCondition("")
                    setMinPrice("")
                    setMaxPrice("")
                    setCity("")
                    setSellerVerified(false)
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-11"
                  disabled={isPending}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {title}
          <span className="ml-2 font-medium text-foreground">
            {count} {count === 1 ? "listing" : "listings"}
          </span>
        </p>
        <Label htmlFor="proto-search-sort" className="sr-only">
          Sort by
        </Label>
        <select
          id="proto-search-sort"
          value={sort}
          onChange={(e) =>
            setSort(e.target.value as SearchQuery["sort"])
          }
          className={cn(FIELD_CLASS, "h-9 w-auto py-1 pr-8 text-sm")}
        >
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {chip.label}
              <XIcon className="size-3.5" />
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10"
            onClick={() => {
              setQ("")
              setCondition("")
              setMinPrice("")
              setMaxPrice("")
              setCity("")
              setSellerVerified(false)
              setSort("newest")
              apply(() => ({
                q: "",
                categorySlug: undefined,
                minPrice: undefined,
                maxPrice: undefined,
                condition: undefined,
                city: "",
                sellerVerified: false,
                sort: "newest",
                offset: 0,
              }))
            }}
          >
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  )
}