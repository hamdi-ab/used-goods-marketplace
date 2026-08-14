"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FIELD_CLASS } from "@/lib/form-fields"
import { CONDITIONS, type Category, type Condition } from "@/lib/listings/constants"
import { buildSearchUrl, SEARCH_SORTS, type SearchQuery } from "@/lib/search"

const SELECT_SORT_LABELS: Record<(typeof SEARCH_SORTS)[number], string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
}

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
  const [condition, setCondition] = useState<Condition | "">(
    filters.condition ?? ""
  )
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "")
  const [city, setCity] = useState(filters.city)
  const [sort, setSort] = useState(filters.sort)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    router.push(
      buildSearchUrl({
        q,
        categorySlug: categorySlug || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        condition: condition || undefined,
        city,
        sort,
        offset: 0,
      })
    )
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Search and filter listings">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
              onChange={(e) =>
                setCondition(e.target.value as Condition | "")
              }
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
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="No maximum"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search-city">City</Label>
            <Input
              id="search-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Addis Ababa"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
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

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/search")}>
              Clear
            </Button>
            <Button type="submit">Search</Button>
          </div>
        </div>
      </div>
    </form>
  )
}
