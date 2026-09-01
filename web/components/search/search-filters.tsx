"use client"

import {
  useState,
  useTransition,
  useEffect,
  useMemo,
  useRef,
  type FormEvent,
} from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, Loader2Icon } from "lucide-react"

import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FIELD_CLASS } from "@/lib/form-fields"
import {
  CONDITIONS,
  KNOWN_CITY_LABELS,
  type Category,
  type Condition,
} from "@/lib/listings/constants"
import {
  buildSearchUrl,
  SEARCH_SORTS,
  type SearchQuery,
} from "@/lib/search"

const SELECT_SORT_LABELS: Record<(typeof SEARCH_SORTS)[number], string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
}

const DEBOUNCE_MS = 300

export function SearchFilters({
  categories,
  filters,
}: {
  categories: Category[]
  filters: SearchQuery
}) {
  const router = useRouter()
  const [q, setQ] = useState(filters.q)
  const [categorySlug, setCategorySlug] = useState(filters.categorySlug ?? "")
  const [condition, setCondition] = useState<Condition | "">(filters.condition ?? "")
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "")
  const [city, setCity] = useState(filters.city)
  const [sellerVerified, setSellerVerified] = useState(filters.sellerVerified)
  const [sort, setSort] = useState(filters.sort)

  // Build the next URL from the *live* form state, then debounce it so edits
  // batch into a single push. (#79, industry-audit #12: debounce + known-city.)
  const pendingQuery = buildSearchUrl({
    ...filters,
    q,
    categorySlug: categorySlug || undefined,
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

  // Fire when the debounced value has settled on something new.
  useEffect(() => {
    if (debouncedQuery === activeQuery) return
    lastPushed.current = debouncedQuery
    startTransition(() => {
      router.push(debouncedQuery)
    })
  }, [debouncedQuery, activeQuery, router])

  // Track the last-pushed URL locally so the spinner reflects what *we* fired,
  // not the server-prop lag. Clears when the server catches up.
  const lastPushed = useRef<string | null>(null)

  const isPending = lastPushed.current !== null || isNavigating

  useEffect(() => {
    if (lastPushed.current && lastPushed.current === activeQuery) {
      lastPushed.current = null
    }
  }, [activeQuery])

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(() => {
      router.push(debouncedQuery)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Search and filter listings"
      className="relative"
    >
      {isPending ? (
        <div
          aria-label="Updating results"
          className="pointer-events-none absolute inset-0 -top-1 -z-10 bg-background/60"
        />
      ) : null}

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Label htmlFor="search-keyword" className="sr-only">
            Search by keyword
          </Label>
          <Input
            id="search-keyword"
            type="search"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by keyword, e.g. “laptop”"
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-category">Category</Label>
            <select
              id="search-category"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className={FIELD_CLASS}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-condition">Condition</Label>
          <select
            id="search-condition"
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
            <Label htmlFor="search-min">Min price (ETB)</Label>
            <Input
              id="search-min"
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="No minimum"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-max">Max price (ETB)</Label>
            <Input
              id="search-max"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => {
                const next = e.target.value
                // If both fields are filled and min > max, swap them so the
                // range is always valid — the user never gets a silent empty
                // result from an inverted range.
                if (next && minPrice && Number(next) < Number(minPrice)) {
                  setMinPrice(next)
                  setMaxPrice(minPrice)
                } else {
                  setMaxPrice(next)
                }
              }}
              placeholder="No maximum"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-city">City</Label>
            <select
              id="search-city"
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
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <input
              id="search-verified"
              type="checkbox"
              checked={sellerVerified}
              onChange={(e) => setSellerVerified(e.target.checked)}
              className="mt-0.5 size-4 cursor-pointer rounded border-input align-middle text-primary focus:ring-2 focus:ring-ring"
            />
            <Label htmlFor="search-verified" className="font-medium">
              Verified seller only
            </Label>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="search-sort">Sort by</Label>
              <select
                id="search-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SearchQuery["sort"])}
                className={FIELD_CLASS}
              >
                {SEARCH_SORTS.map((s) => (
                  <option key={s} value={s}>
                    {SELECT_SORT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("")
                setCategorySlug("")
                setCondition("")
                setMinPrice("")
                setMaxPrice("")
                setCity("")
                setSellerVerified(false)
                setSort("newest")
              }}
            >
              Clear
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              Search
            </Button>
            {isPending ? (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </div>
      </div>
    </form>
  )
}
